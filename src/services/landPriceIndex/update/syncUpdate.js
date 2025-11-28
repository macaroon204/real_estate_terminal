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

// YYYYMM → 다음달 (utils.js 없이 사용)
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

    // 전체 외부 상태 요약: 기본은 OK, 한 번이라도 실패나면 갱신
    let overallExtStatus = EXTERNAL_STATUS.OK;

    for (const r of regions) {
      const rc = r.region_code;

      try {
        // DB 최신 YM (미리 조회해 둔 Map에서 사용)
        const lastYm = lastYmMap.get(rc) ?? null;

        // 요청 시작 YM 계산
        let effectiveFromYm = fromYm;
        if (lastYm !== null) {
          const next = nextMonth(Number(lastYm));
          if (next > effectiveFromYm) effectiveFromYm = next;
        }

        // 최신이면 skip
        if (effectiveFromYm > toYm) {
          successRegions++;
          continue;
        }

        // 외부통신
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

        // 시계열 변환
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

        // DB merge
        await mergeSeries(conn, rc, JSON.stringify(series));
        successRegions++;
        fetched += rows.length;

        // 저장 건수는 지역단위가 아니라 "저장된 행(row) 수" 기준으로 카운트
        saved += rows.length;
      } catch (err) {
        failRegions++;
        logRegionError({
          cid,
          regionCode: rc,
          reason: String(err),
        });
      }
    }

    const elapsedMs = Date.now() - startTime;

    logSyncDone({
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
    });

    return {
      ok: true,
      mode,
      successRegions,
      failRegions,
    };
  } finally {
    conn.release();
  }
}
