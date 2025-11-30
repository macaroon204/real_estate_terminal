// src/services/front/center/nationwide/service.js
'use strict';

import { query } from '../../../../config/db.js';

/**
 * 전국 광역시( code_depth = 1 )별
 * 최근 3개년 지가지수 시계열 조회
 */
export async function getNationwideSummary() {
  const sql = `
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
    ORDER BY rb.region_code
  `;

  const rows = await query(sql);

  const items = [];

  for (const row of rows) {
    let series = [];

    try {
      let raw;

      // ✅ 1) 드라이버가 이미 JSON을 파싱해준 경우 (배열/객체)
      if (Array.isArray(row.seriesJson)) {
        raw = row.seriesJson;
      } else if (
        row.seriesJson &&
        typeof row.seriesJson === 'object'
      ) {
        // 혹시 객체 한 덩어리로 오는 경우
        raw = [row.seriesJson];
      } else if (typeof row.seriesJson === 'string') {
        // ✅ 2) 문자열이면 JSON.parse
        raw = JSON.parse(row.seriesJson || '[]');
      } else {
        raw = [];
      }

      // raw: [{ ym:'202201', index_value:..., change_rate:... }, ...]
      const allPoints = (raw ?? []).map((p) => ({
        ym: String(p.ym),
        indexValue: Number(p.index_value),
        changeRate:
          p.change_rate != null ? Number(p.change_rate) : 0,
      }));

      // --- 최근 3개년만 필터링 ---
      let filtered = allPoints;
      if (allPoints.length > 0) {
        const years = allPoints.map((pt) =>
          Number(String(pt.ym).slice(0, 4)),
        );
        const latestYear = Math.max(...years);
        const minYear = latestYear - 2; // 최근 3개년

        filtered = allPoints.filter((pt) => {
          const y = Number(String(pt.ym).slice(0, 4));
          return y >= minYear;
        });
      }

      series = filtered;
    } catch (e) {
      // 디버깅용으로 한 번 찍어보자 (나중에 필요 없으면 지워도 됨)
      // eslint-disable-next-line no-console
      console.error(
        '[CENTER_NW][PARSE_ERROR]',
        typeof row.seriesJson,
        e?.message ?? e,
      );
      series = [];
    }

    items.push({
      regionCode: Number(row.regionCode),
      name: String(row.regionName),
      series,
    });
  }

  return items;
}
