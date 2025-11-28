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

    // ← 여기 ext_status 초기값 유지
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

        // 🔥 수정된 부분: 외부 오류가 처음 발생한 순간 ext_status 저장
        if (result.ext_status !== EXTERNAL_STATUS.OK) {
          if (ext_status === EXTERNAL_STATUS.OK) {
            ext_status = result.ext_status;   // ← 버그 수정된 핵심 라인
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

    const summary = {
      cid,
      mode: 'full',
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

    logSyncDone(summary);

    return {
      period: { fromYm, toYm },
      target: { totalRegions, successRegions, failRegions },
      fetched: totalFetched,
      saved: totalSaved,
      errorRegions,
      ext_status,
    };
  } finally {
    conn.release();
  }
}
