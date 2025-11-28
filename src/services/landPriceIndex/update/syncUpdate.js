// src/services/landPriceIndex/update/syncUpdate.js
'use strict';

import { fetchLandPriceIndex } from '../client.js';
import {
  getConn,
  loadAllRegions,
  loadAllLastYm,
  mergeSeries,
} from './db.js';
import { logSyncStart, logSyncDone, logRegionError } from './logger.js';
import { EXTERNAL_STATUS } from '../../../libs/log_spec.js';

// YYYYMM → 다음달
function nextMonth(ym) {
  let y = Math.floor(ym / 100);
  let m = ym % 100;
  m++;
  if (m === 13) {
    y++;
    m = 1;
  }
  return y * 100 + m;
}

export async function syncUpdate({ cid, fromYm, toYm }) {
  const startTime = Date.now();
  const conn = await getConn();
  const mode = 'update';

  try {
    const regions = await loadAllRegions(conn);

    // 모든 지역의 lastYm을 한 번에 조회해서 Map으로 사용
    const lastYmMap = await loadAllLastYm(conn);

    logSyncStart({
      cid,
      fromYm,
      toYm,
      totalRegions: regions.length,
    });

    let successRegions = 0;
    let failRegions = 0;
    let fetched = 0;
    let saved = 0;

    let overallExtStatus = EXTERNAL_STATUS.OK;

    for (const r of regions) {
      const rc = r.region_code;

      try {
        const lastYm = lastYmMap.get(rc) ?? null;

        let effectiveFromYm = fromYm;
        if (lastYm !== null) {
          const next = nextMonth(Number(lastYm));
          if (next > effectiveFromYm) effectiveFromYm = next;
        }

        if (effectiveFromYm > toYm) {
          successRegions++;
          continue;
        }

        const { rows, ext_status } = await fetchLandPriceIndex({
          fromYm: effectiveFromYm,
          toYm,
          regionCode: rc,
        });

        if (ext_status !== EXTERNAL_STATUS.OK) {
          failRegions++;
          overallExtStatus = ext_status;
          logRegionError({
            cid,
            regionCode: rc,
            reason: `EXT_STATUS=${ext_status}`,
          });
          continue;
        }

        if (!rows || rows.length === 0) {
          successRegions++;
          continue;
        }

        let series = [];
        let prev = null;

        for (const row of rows) {
          const idx = Number(row.index_value);
          let rate = 0;

          if (prev !== null && prev !== 0) {
            rate = Number((((idx - prev) / prev) * 100).toFixed(4));
          }

          series.push({
            ym: row.ym,
            index_value: idx,
            change_rate: rate,
          });

          prev = idx;
        }

        await mergeSeries(conn, rc, JSON.stringify(series));

        fetched += rows.length;
        saved++;
        successRegions++;
      } catch (err) {
        failRegions++;
        logRegionError({ cid, regionCode: rc, reason: String(err) });
      }
    }

    const elapsedMs = Date.now() - startTime;

    // ✅ 요약 객체: 로그 + 응답 공통 포맷
    const summary = {
      cid,
      fromYm,
      toYm,
      totalRegions: regions.length,
      successRegions,
      failRegions,
      fetched,
      saved,
      elapsedMs,
      ext_status: overallExtStatus,
    };

    // 로그는 summary 기반
    logSyncDone(summary);

    // 응답도 summary 기반으로 생성
    return buildUpdateResponseFromSummary(summary);
  } finally {
    conn.release();
  }
}

// summary → API 응답 포맷 매핑
function buildUpdateResponseFromSummary(summary) {
  const {
    fromYm,
    toYm,
    totalRegions,
    successRegions,
    failRegions,
    fetched,
    saved,
    ext_status,
  } = summary;

  return {
    period: { fromYm, toYm },
    target: {
      totalRegions,
      successRegions,
      failRegions,
    },
    fetched,
    saved,
    // update는 에러 지역 리스트를 따로 모으지 않는다
    errorRegions: [],
    ext_status,
  };
}
