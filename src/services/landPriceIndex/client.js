// src/services/landPriceIndex/client.js
'use strict';

import axios from 'axios';

const BASE = 'https://www.reb.or.kr/r-one/openapi/SttsApiTblData.do';

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
// (필요시) 변화율 필드 추출 - 현재는 없으면 null 유지
// ------------------------------------------------------------
function pickChangeRate(row) {
  if (row.CHANGE_RATE !== undefined) return Number(row.CHANGE_RATE);
  if (row.CHANGE_RT !== undefined) return Number(row.CHANGE_RT);
  if (row.change !== undefined) return Number(row.change);
  return null;
}

// ------------------------------------------------------------
// R-ONE "통계 조회 조건 설정" API 호출
//   - STATBL_ID: (월) 지역별 지가지수 → A_2024_00901
//   - DTACYCLE_CD: MM (월)
//   - CLS_ID: 지역 코드(명세서 기준 코드와 현재 region_code 매핑 필요)
//   - ITM_ID: 항목 ID (예: 100001: 전체/종합 지수 등)
//   - START_WRTTIME / END_WRTTIME: YYYYMM (또는 YYYYMMDD)
// ------------------------------------------------------------
export async function fetchLandPriceIndex({ fromYm, toYm, regionCode }) {
  let pIndex = 1;
  const pSize = 1000;
  const all = [];
  let ext_status = 0;

  const apiKey =
    process.env.REB_API_KEY || process.env.RONE_API_KEY || '';

  if (!apiKey) {
    console.warn('[R-ONE] REB_API_KEY / RONE_API_KEY 환경 변수가 비어 있습니다.');
  }

  try {
    while (true) {
      const { data } = await axios.get(BASE, {
        params: {
          KEY: apiKey,
          Type: 'json',

          // 통계표/주기/지역/항목 설정
          STATBL_ID: 'A_2024_00901', // (월) 지역별 지가지수
          DTACYCLE_CD: 'MM',
          CLS_ID: regionCode,        // ⚠ 실제 명세서 기준 지역 코드와 매핑 필요
          ITM_ID: '100001',          // ⚠ 엑셀 명세에서 원하는 항목 ID로 조정

          START_WRTTIME: fromYm,
          END_WRTTIME: toYm,

          pIndex,
          pSize,
        },
        timeout: 10000,
      });

      // 공식 가이드 기준: jsonData.SttsApiTblData[1].row
      const rows = data?.SttsApiTblData?.[1]?.row ?? [];

      const normalized = rows
        .map((r) => {
          const ym = pickYm(r);
          if (!ym) return null;

          return {
            ym,                              // YYYYMM
            index_value: Number(r.DTA_VAL),  // 통계 자료값
            change_rate: pickChangeRate(r),  // 현재는 대부분 null
            _raw: r,                         // 디버깅용(원치 않으면 삭제 가능)
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

  return { rows: all, ext_status };
}
