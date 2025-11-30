// src/services/front/center/metro/service.js
'use strict';

import { query } from '../../../../config/db.js';

/**
 * land_price_index.series JSON 을 파싱해서
 * 내부에서 쓰기 좋은 형태로 변환한다.
 *
 * 원본 JSON: [
 *   { "ym":"202201","index_value":102.34,"change_rate":0.012 },
 *   ...
 * ]
 *
 * 반환: [
 *   { ym: '202201', indexValue: 102.34, changeRate: 0.012 },
 *   ...
 * ]
 */
function parseSeriesJson(seriesJson) {
  if (!seriesJson) return [];

  let raw;
  try {
    raw = typeof seriesJson === 'string' ? JSON.parse(seriesJson) : seriesJson;
  } catch (e) {
    console.error('[CENTER_METRO][PARSE_ERROR]', e?.message ?? e);
    return [];
  }

  if (!Array.isArray(raw)) return [];

  const result = [];

  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const ym = String(item.ym ?? '').trim();
    if (!ym) continue;

    const iv = Number(item.index_value ?? item.indexValue ?? item.value);
    const cr = Number(item.change_rate ?? item.changeRate ?? item.rate);

    const indexValue = Number.isFinite(iv) ? iv : null;
    const changeRate = Number.isFinite(cr) ? cr : null;

    result.push({ ym, indexValue, changeRate });
  }

  // ym 기준 정렬 (오름차순)
  result.sort((a, b) => a.ym.localeCompare(b.ym));

  return result;
}

/**
 * series 배열에서 "가장 최신 연도 기준 최근 3개년"만 남긴다.
 * - 예: 2023, 2024, 2025 가 있으면 → 이 3개년만 유지
 * - 최신 데이터가 2025-08 까지만 있어도 연도 기준으로 3개년을 유지
 */
function keepRecent3Years(series) {
  if (!series.length) return [];

  let maxYear = 0;
  for (const p of series) {
    const y = Number(String(p.ym).slice(0, 4));
    if (Number.isInteger(y) && y > maxYear) {
      maxYear = y;
    }
  }

  if (!maxYear) return [];

  const minYear = maxYear - 2; // 최근 3개년
  return series.filter((p) => {
    const y = Number(String(p.ym).slice(0, 4));
    return Number.isInteger(y) && y >= minYear;
  });
}

/**
 * 시계열에서 indexValue 만 추출
 */
function extractIndexValues(series) {
  const arr = [];
  for (const p of series) {
    if (!p) continue;
    const v = Number(p.indexValue);
    if (Number.isFinite(v)) arr.push(v);
  }
  return arr;
}

/**
 * 평균 계산
 */
function average(values) {
  if (!values || !values.length) return null;
  let sum = 0;
  for (const v of values) {
    sum += v;
  }
  return sum / values.length;
}

/**
 * 광역시 + 하위 구들 시계열/통계 조회
 * - metroCode: code_depth = 1 지역 코드
 *
 * 반환 구조:
 * {
 *   metro: {
 *     regionCode, name,
 *     series: [{ ym, indexValue, changeRate }],
 *     avgIndex
 *   },
 *   band: {
 *     high: [{ ym, indexValue, regionCode, regionName }],
 *     low:  [{ ym, indexValue, regionCode, regionName }]
 *   },
 *   children: [
 *     {
 *       regionCode, name,
 *       series: [{ ym, indexValue, changeRate }],
 *       avgIndex,
 *       avgDiff,
 *       totalDeviation,
 *       avgDeviation
 *     },
 *     ...
 *   ]
 * }
 */
export async function getMetroDetail(metroCode) {
  const code = Number(metroCode);
  if (!Number.isInteger(code)) {
    throw new Error('invalid metroCode');
  }

  // 1) 광역시 1건
  const sqlMetro = `
    SELECT
      rb.region_code AS regionCode,
      rb.name        AS regionName,
      lpi.series     AS seriesJson
    FROM region_meta AS rm
    JOIN region_base AS rb
      ON rb.region_code = rm.region_code
    JOIN land_price_index AS lpi
      ON lpi.region_code = rm.region_code
    WHERE rm.code_depth = 1
      AND rm.region_code = ${code}
  `;

  const metroRows = await query(sqlMetro);

  if (!metroRows || metroRows.length === 0) {
    return null;
  }

  const metroRow = metroRows[0];
  let metroSeries = parseSeriesJson(metroRow.seriesJson);
  metroSeries = keepRecent3Years(metroSeries);

  const metroIndexValues = extractIndexValues(metroSeries);
  const metroAvgIndex = average(metroIndexValues);

  const metro = {
    regionCode: Number(metroRow.regionCode),
    name: String(metroRow.regionName),
    series: metroSeries,
    avgIndex: metroAvgIndex,
  };

  // ym -> point 맵 (편차/밴드 계산용)
  const metroMap = {};
  for (const pt of metroSeries) {
    metroMap[pt.ym] = pt;
  }

  // 2) 하위 구들 (code_depth = 2)
  const sqlChildren = `
    SELECT
      rb.region_code AS regionCode,
      rb.name        AS regionName,
      lpi.series     AS seriesJson
    FROM region_meta AS rm
    JOIN region_base AS rb
      ON rb.region_code = rm.region_code
    JOIN region_parent AS rp
      ON rp.region_code = rm.region_code
    JOIN land_price_index AS lpi
      ON lpi.region_code = rm.region_code
    WHERE rm.code_depth = 2
      AND rp.parent_code = ${code}
    ORDER BY rb.region_code
  `;

  const childRows = await query(sqlChildren);

  const children = [];
  const childMaps = []; // band 계산용 ym → point 맵

  for (const row of childRows) {
    let series = parseSeriesJson(row.seriesJson);
    series = keepRecent3Years(series);

    const childMap = {};
    for (const pt of series) {
      childMap[pt.ym] = pt;
    }

    // 광역시와 겹치는 ym 에 대해서만 통계 계산
    let sumIndex = 0;
    let sumDev = 0;
    let cnt = 0;

    for (const pt of series) {
      const base = metroMap[pt.ym];
      if (!base) continue;

      const v = Number(pt.indexValue);
      const mv = Number(base.indexValue);
      if (!Number.isFinite(v) || !Number.isFinite(mv)) continue;

      sumIndex += v;
      sumDev += Math.abs(v - mv);
      cnt += 1;
    }

    const avgIndex = cnt ? sumIndex / cnt : null;
    const totalDeviation = cnt ? sumDev : null;
    const avgDeviation = cnt ? sumDev / cnt : null;

    const child = {
      regionCode: Number(row.regionCode),
      name: String(row.regionName),
      series,
      avgIndex,
      avgDiff:
        typeof avgIndex === 'number' && typeof metroAvgIndex === 'number'
          ? avgIndex - metroAvgIndex
          : null,
      totalDeviation,
      avgDeviation,
    };

    children.push(child);
    childMaps.push(childMap);
  }

  // 3) 상단 볼린저 밴드용 HIGH / LOW 라인 계산
  const bandHigh = [];
  const bandLow = [];

  for (const metroPt of metroSeries) {
    const ym = metroPt.ym;

    let maxVal = null;
    let maxChild = null;

    let minVal = null;
    let minChild = null;

    for (let i = 0; i < children.length; i += 1) {
      const child = children[i];
      const map = childMaps[i];
      const pt = map[ym];
      if (!pt) continue;

      const v = Number(pt.indexValue);
      if (!Number.isFinite(v)) continue;

      if (maxVal === null || v > maxVal) {
        maxVal = v;
        maxChild = child;
      }
      if (minVal === null || v < minVal) {
        minVal = v;
        minChild = child;
      }
    }

    bandHigh.push({
      ym,
      indexValue: maxVal,
      regionCode: maxChild ? maxChild.regionCode : null,
      regionName: maxChild ? maxChild.name : null,
    });

    bandLow.push({
      ym,
      indexValue: minVal,
      regionCode: minChild ? minChild.regionCode : null,
      regionName: minChild ? minChild.name : null,
    });
  }

  const band = {
    high: bandHigh,
    low: bandLow,
  };

  // 4) 하단 카드용 정렬: totalDeviation (편차 합) 큰 순
  const childrenSorted = children.slice().sort((a, b) => {
    const aDev =
      typeof a.totalDeviation === 'number' ? a.totalDeviation : -1;
    const bDev =
      typeof b.totalDeviation === 'number' ? b.totalDeviation : -1;
    return bDev - aDev;
  });

  return {
    metro,
    band,
    children: childrenSorted,
  };
}
