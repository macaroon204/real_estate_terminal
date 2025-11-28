// src/services/landPriceIndex/full/syncFull.js
'use strict';

import { getConn, loadAllRegions } from './db.js';
import { syncOneRegion } from './syncRegion.js';
import { logSyncStart, logSyncDone, logRegionError } from './logger.js';
import { EXTERNAL_STATUS } from '../../../libs/log_spec.js';

export async function syncFull({ fromYm, toYm, cid }) {
  const conn = await getConn();
  const startedAt = Date.now();

  try {
    const regions = await loadAllRegions(conn);
    const totalRegions = regions.length;

    logSyncStart({ cid, fromYm, toYm, totalRegions });

    let successRegions = 0;
    let failRegions = 0;
    let totalFetched = 0;
    let totalSaved = 0;

    let ext_status = EXTERNAL_STATUS.OK;
    const errorRegions = [];

    for (const r of regions) {
      const rc = r.region_code;

      try {
        const result = await syncOneRegion(conn, {
          regionCode: rc,
          fromYm,
          toYm,
        });

        if (result.ext_status !== EXTERNAL_STATUS.OK) {
          if (ext_status === EXTERNAL_STATUS.OK) {
            ext_status = result.ext_status;
          }

          failRegions++;
          errorRegions.push({
            region_code: rc,
            reason: `external status=${result.ext_status}`,
          });
          continue;
        }

        totalFetched += result.fetched;

        if (result.saved) {
          totalSaved++;
          successRegions++;
        }
      } catch (err) {
        failRegions++;
        logRegionError({ cid, regionCode: rc, reason: String(err) });
        errorRegions.push({
          region_code: rc,
          reason: String(err),
        });
      }
    }

    const elapsedMs = Date.now() - startedAt;

    // ✅ 요약 객체: 로그 + 응답 공통 포맷
    const summary = {
      cid,
      fromYm,
      toYm,
      totalRegions,
      successRegions,
      failRegions,
      fetched: totalFetched,
      saved: totalSaved,
      elapsedMs,
      errorRegions,
      ext_status,
    };

    // 로그는 summary 기반
    logSyncDone(summary);

    // 응답도 summary 기반으로 생성
    return buildFullResponseFromSummary(summary);
  } finally {
    conn.release();
  }
}

// summary → API 응답 포맷 매핑
function buildFullResponseFromSummary(summary) {
  const {
    fromYm,
    toYm,
    totalRegions,
    successRegions,
    failRegions,
    fetched,
    saved,
    errorRegions,
    ext_status,
  } = summary;

  return {
    period: { fromYm, toYm },
    target: { totalRegions, successRegions, failRegions },
    fetched,
    saved,
    errorRegions,
    ext_status,
  };
}
