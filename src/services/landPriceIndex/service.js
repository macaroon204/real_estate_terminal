// src/services/landPriceIndex/service.js
'use strict';

import mariadb from 'mariadb';
import { fetchLandPriceIndex } from './client.js';

import {
  SID,
  PID,
  INTERNAL_STATUS,
  EXTERNAL_STATUS,
  createLog,
} from '../../libs/log_spec.js';

// -----------------------------------------------------------------------------
// DB Pool
// -----------------------------------------------------------------------------
const pool = mariadb.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || '3307'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '0000',
  database: process.env.DB_NAME || 'realestate',
  connectionLimit: 5,
});

// -----------------------------------------------------------------------------
// 대상 region 목록 로딩
//   - regionCode가 있으면 그 코드만
//   - 없으면 region_base 전부
// -----------------------------------------------------------------------------
async function loadRegions(conn) {
  const rows = await conn.query(
    `
    SELECT region_code
      FROM region_base
     ORDER BY region_code
    `,
  );
  return rows;
}

// -----------------------------------------------------------------------------
// 지가지수 동기화
//   - regionCode: 특정 지역만 동기화하고 싶을 때 사용 (없으면 전체)
//   - fromYm / toYm: 'YYYYMM' 문자열
//   - cid: 로그용 correlation id
// -----------------------------------------------------------------------------
export async function syncLandPriceIndex({ regionCode, fromYm, toYm, cid }) {
  const conn = await pool.getConnection();
  const startedAt = Date.now();

  let totalFetched = 0;           // 외부에서 가져온 row 수 합계
  let totalSaved = 0;             // 저장 프로시저 호출 성공 지역 수
  let ext_status = EXTERNAL_STATUS.OK;
  const errorRegions = [];        // { region_code, reason }

  try {
    // 1) 대상 region 목록
    let regions;
    if (regionCode) {
      regions = [{ region_code: Number(regionCode) }];
    } else {
      regions = await loadRegions(conn);
    }
    const totalRegions = regions.length;

    // 시작 로그
    console.log(
      '[LOG]',
      createLog({
        sid: SID.API,
        pid: PID.SYNC_START,
        cid,
        value1: INTERNAL_STATUS.OK,
        value2: EXTERNAL_STATUS.OK,
        buffer: {
          fromYm,
          toYm,
          totalRegions,
          regionMode: regionCode ? 'single' : 'all',
        },
      }),
    );

    let successRegions = 0;
    let failRegions = 0;

    // 2) region 단위 처리
    for (const region of regions) {
      const rc = region.region_code;

      try {
        // 2-1) 외부 API 호출
        const { rows, ext_status: es } = await fetchLandPriceIndex({
          fromYm,
          toYm,
          regionCode: rc,
        });

        // 외부 서비스 에러면 그대로 에러 처리
        if (es !== EXTERNAL_STATUS.OK) {
          ext_status = ext_status || es;

          console.error(
            '[LOG]',
            createLog({
              sid: SID.API,
              pid: PID.SYNC_REGION,
              cid,
              value1: INTERNAL_STATUS.BUSINESS_FAIL,
              value2: es,
              buffer: {
                region_code: rc,
                msg: 'external service error',
              },
            }),
          );

          errorRegions.push({
            region_code: rc,
            reason: `external status=${es}`,
          });
          failRegions += 1;
          continue;
        }

        // rows가 아예 없으면 조용히 스킵 (로그 X)
        if (!rows || rows.length === 0) {
          continue;
        }

        totalFetched += rows.length;

        // 2-2) change_rate 계산 + JSON 포맷 맞추기
        // rows: { ym, index_value } (또는 change_rate 포함)
        const series = [];
        let prevIndex = null;

        for (const r of rows) {
          const idx = Number(r.index_value);
          let change;

          if (prevIndex === null || prevIndex === 0) {
            change = 0;
          } else {
            const raw = ((idx - prevIndex) / prevIndex) * 100;
            change = Number(raw.toFixed(4)); // 예: 소수 4자리
          }

          series.push({
            ym: r.ym,
            index_value: idx,    // 프로시저/테이블과 동일한 키 이름
            change_rate: change, // 항상 숫자
          });

          prevIndex = idx;
        }

        const seriesJson = JSON.stringify(series);

        // 2-3) 저장 프로시저 호출 → DB 안에서 merge
        await conn.query('CALL sp_merge_land_price_index(?, ?)', [
          rc,
          seriesJson,
        ]);

        totalSaved += 1;
        successRegions += 1;
      } catch (errRegion) {
        console.error('[SYNC REGION ERROR]', rc, errRegion);

        console.error(
          '[LOG]',
          createLog({
            sid: SID.API,
            pid: PID.SYNC_REGION,
            cid,
            value1: INTERNAL_STATUS.DB_ERROR,
            value2: EXTERNAL_STATUS.OK,
            buffer: {
              region_code: rc,
              msg: 'internal region sync error',
            },
          }),
        );

        errorRegions.push({
          region_code: rc,
          reason: errRegion.message || String(errRegion),
        });
        failRegions += 1;
      }
    }

    // 3) 종료/요약 로그
    const finalInternalStatus =
      failRegions > 0 ? INTERNAL_STATUS.BUSINESS_FAIL : INTERNAL_STATUS.OK;

    const elapsedMs = Date.now() - startedAt;

    console.log(
      '[LOG]',
      createLog({
        sid: SID.API,
        pid: PID.SYNC_DONE,
        cid,
        value1: finalInternalStatus,
        value2: ext_status || EXTERNAL_STATUS.OK,
        buffer: {
          fromYm,
          toYm,
          totalRegions,
          successRegions,
          failRegions,
          fetched: totalFetched,
          saved: totalSaved,
          elapsedMs,
          errorRegions,
        },
      }),
    );

    // 4) 응답용 데이터
    return {
      period: { fromYm, toYm },
      target: { totalRegions, successRegions, failRegions },
      fetched: totalFetched,
      saved: totalSaved,
      ext_status,
      errorRegions,
    };
  } finally {
    conn.release();
  }
}
