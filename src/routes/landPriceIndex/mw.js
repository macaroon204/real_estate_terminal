// src/routes/landPriceIndex/mw.js
'use strict';

import { sx_ret__create, sx_ret__write_data } from '../../libs/my_lib.js';
import {
  INTERNAL_STATUS,
  EXTERNAL_STATUS,
} from '../../libs/log_spec.js';

// YYYYMM 형식 체크
function isValidYm(str) {
  return /^[0-9]{6}$/.test(str);
}

export function parseSyncReq(req, res, next) {
  try {
    let fromYm = req.query.fromYm ? String(req.query.fromYm) : '';
    let toYm   = req.query.toYm   ? String(req.query.toYm)   : '';

    // 🔁 기존 로직 유지: 기본 기간 = 2005-01 ~ 전월
    const now = new Date();
    now.setMonth(now.getMonth() - 1);   // 전월로 이동
    const defaultTo = `${now.getFullYear()}${String(
      now.getMonth() + 1,
    ).padStart(2, '0')}`;

    if (!toYm)   toYm   = defaultTo;
    if (!fromYm) fromYm = '200501';

    // 형식 검증
    if (!isValidYm(fromYm) || !isValidYm(toYm)) {
      const ret = sx_ret__create(0, 0);
      ret.value1 = INTERNAL_STATUS.BAD_REQUEST; // -1 대신 상수 사용
      ret.value2 = EXTERNAL_STATUS.OK;          // 0 대신 상수 사용

      sx_ret__write_data(ret, {
        msg: 'bad ym format',
        fromYm,
        toYm,
      });

      return res.status(400).json(ret);
    }

    // Controller/Service에서 사용할 DTO
    req.dto = {
      fromYm,
      toYm,
    };

    return next();
  } catch (e) {
    const ret = sx_ret__create(0, 0);
    ret.value1 = INTERNAL_STATUS.INTERNAL_ERROR; // -1 → 내부 에러 코드로 통일
    ret.value2 = EXTERNAL_STATUS.OK;

    sx_ret__write_data(ret, {
      msg: 'middleware error',
      error: String(e),
    });

    return res.status(500).json(ret);
  }
}
