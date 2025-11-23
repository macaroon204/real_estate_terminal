'use strict';

import { sx_ret__create, sx_ret__write_data } from '../../libs/my_lib.js';

function toYYYYMM(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}${m}`;
}

function addMonths(yyyymm, diff) {
  const y = Number(yyyymm.slice(0, 4));
  const m = Number(yyyymm.slice(4, 6));
  const date = new Date(y, m - 1, 1);
  date.setMonth(date.getMonth() + diff);
  return toYYYYMM(date);
}

export function parseSyncReq(req, res, next) {
  try {
    const regionCode = Number(req.query.regionCode);
    let fromYm = req.query.fromYm ? String(req.query.fromYm) : "";
    let toYm   = req.query.toYm   ? String(req.query.toYm)   : "";

    if (!regionCode) {
      const ret = sx_ret__create(0, 0);
      ret.value1 = -1;          // 내부 파라미터 에러
      ret.value2 = 0;           // 외부 상태 없음
      sx_ret__write_data(ret, { msg: "regionCode required" });
      return res.status(400).json(ret);
    }

    // 기간 없으면 최근 3개년 자동
    if (!toYm) toYm = toYYYYMM(new Date());
    if (!fromYm) fromYm = addMonths(toYm, -36);

    if (fromYm.length !== 6 || toYm.length !== 6) {
      const ret = sx_ret__create(0, 0);
      ret.value1 = -1;          // 내부 파라미터 에러
      ret.value2 = 0;
      sx_ret__write_data(ret, { msg: "bad ym format", fromYm, toYm });
      return res.status(400).json(ret);
    }

    req.dto = { regionCode, fromYm, toYm };
    next();
  } catch (e) {
    const ret = sx_ret__create(0, 0);
    ret.value1 = -1;
    ret.value2 = 0;
    sx_ret__write_data(ret, { msg: "middleware error", error: String(e) });
    return res.status(500).json(ret);
  }
}
