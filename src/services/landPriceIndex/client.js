// src/services/landPriceIndex/client.js
'use strict';

import axios from 'axios';
import { env } from '../../config/env.js';

// ------------------------------------------------------------
// 기본 설정 (모두 env 에서 관리)
// ------------------------------------------------------------
const BASE = env.api.baseUrl;

// ------------------------------------------------------------
// 년월 필드 추출 → YYYYMM 으로 정규화
// ------------------------------------------------------------
function pickYm(row) {
  const raw =
    row.WRTTIME_IDTFR_ID || // 명세서 기준 "자료작성 시점" (CHAR(8))
    row.WRTTIME ||          // 다른 통계에서 사용될 수 있음
    row.STDR_DE ||
    row.PRD_DE ||
    null;

  if (!raw) return null;

  const s = String(raw).trim();
  if (s.length >= 6) return s.slice(0, 6); // YYYYMMDD → YYYYMM

  return s;
}

// ------------------------------------------------------------
// (필요시) 변화율 필드 추출
// ------------------------------------------------------------
function pickChangeRate(row) {
  if (row.CHANGE_RATE !== undefined) return Number(row.CHANGE_RATE);
  if (row.CHANGE_RT !== undefined)   return Number(row.CHANGE_RT);
  if (row.change !== undefined)      return Number(row.change);
  return null;
}

// ------------------------------------------------------------
// R-ONE API 호출
// ------------------------------------------------------------
export async function fetchLandPriceIndex({ fromYm, toYm, regionCode }) {
  let pIndex = 1;
  const pSize = 1000;
  const all = [];

  let ext_status = 0;

  // ----------------------------------------------------------
  // API Key (env 기준)
  // ----------------------------------------------------------
  const apiKey = env.api.rebKey || env.api.roneKey;

  if (!apiKey) {
    console.warn(
      '[R-ONE] REB_API_KEY / RONE_API_KEY 환경 변수가 비어 있습니다.'
    );
  }

  // ----------------------------------------------------------
  // 통계 조회 설정 (모두 env 기준)
  // ----------------------------------------------------------
  const STATBL_ID   = env.api.statblId;
  const DTACYCLE_CD = env.api.dtaCycleCd;
  const ITM_ID      = env.api.itmId;

  try {
    while (true) {
      const { data } = await axios.get(BASE, {
        params: {
          KEY: apiKey,
          Type: 'json',

          STATBL_ID,
          DTACYCLE_CD,
          CLS_ID: regionCode,
          ITM_ID,

          START_WRTTIME: fromYm,
          END_WRTTIME: toYm,

          pIndex,
          pSize,
        },
        timeout: 10000,
      });

      // ------------------------------------------------------
      // 공식 가이드 기준: jsonData.SttsApiTblData[1].row
      // ------------------------------------------------------
      const rows = data?.SttsApiTblData?.[1]?.row ?? [];

      const normalized = rows
        .map((r) => {
          const ym = pickYm(r);
          if (!ym) return null;

          return {
            ym,
            index_value: Number(r.DTA_VAL),
            change_rate: pickChangeRate(r),
            _raw: r, // 디버깅용 (필요 없으면 삭제해도 됨)
          };
        })
        .filter(Boolean);

      all.push(...normalized);

      if (rows.length < pSize) break;
      pIndex++;
    }
  } catch (err) {
    console.error('[R-ONE ERROR]', err?.message || err);
    ext_status = -2; // 외부 연동 에러
  }

  return {
    rows: all,
    ext_status,
  };
}
