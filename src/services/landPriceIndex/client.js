// client.js
'use strict';
import axios from "axios";

const BASE = "https://www.reb.or.kr/r-one/openapi/SttsApiTblData.do";

function pickYm(row) {
  // R-ONE row에서 날짜/년월 필드명 후보들
  return (
    row.WRTTIME ||                 // 어떤 통계는 이걸 씀
    row.WRTTIME_IDTFR_ID ||        // 월별 통계에서 자주 나옴 (YYYYMM)
    row.WRTTIME_ID ||              // 간혹 이렇게 옴
    row.STDR_DE ||                 // 기준일자
    row.PRD_DE ||                  // 기간/년월
    null
  );
}

export async function fetchLandPriceIndex({ fromYm, toYm, regionCode }) {
  let pIndex = 1;
  const pSize = 100;
  const all = [];
  let ext_status = 0;

  try {
    while (true) {
      const { data } = await axios.get(BASE, {
        params: {
          KEY: process.env.REB_API_KEY,
          Type: "json",

          STATBL_ID: "A_2024_00901",
          DTACYCLE_CD: "MM",
          CLS_ID: regionCode,
          ITM_ID: "100001",

          START_WRTTIME: fromYm,
          END_WRTTIME: toYm,

          pIndex,
          pSize,
        },
        timeout: 10000,
      });

      const rows = data?.SttsApiTblData?.[1]?.row ?? [];

      // ✅ 여기서 ym + index_value 로 표준화해서 service가 그대로 저장만 하게 만듦
      const normalized = rows.map(r => ({
        ym: pickYm(r),
        index_value: Number(r.DTA_VAL),
        _raw: r, // 혹시 디버깅 필요하면 남겨둠(원치 않으면 제거)
      }))
      // ym이 없는 쓰레기 row는 제거
      .filter(x => x.ym);

      all.push(...normalized);

      if (rows.length < pSize) break;
      pIndex++;
    }
  } catch (err) {
    console.log("[R-ONE ERROR]", err?.message || err);
    ext_status = -2;
  }

  return { rows: all, ext_status };
}
