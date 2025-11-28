// src/routes/landPriceIndex/mw.js
'use strict';

import { sx_ret__create, sx_ret__write_data } from '../../libs/my_lib.js';

// YYYYMM 형식 체크
function isValidYm(str) {
  return /^[0-9]{6}$/.test(str);
}

export function parseSyncReq(req, res, next) {
  try {
    let fromYm = req.query.fromYm ? String(req.query.fromYm) : '';
    let toYm   = req.query.toYm   ? String(req.query.toYm)   : '';

    // 기본 기간: 2005-01 ~ 현재 YYYYMM
    const now = new Date();
    now.setMonth(now.getMonth() - 1);   // 🔥 전월로 이동
    const defaultTo = `${now.getFullYear()}${String(
      now.getMonth() + 1,
    ).padStart(2, '0')}`;

    if (!toYm)   toYm   = defaultTo;
    if (!fromYm) fromYm = '200501';

    if (!isValidYm(fromYm) || !isValidYm(toYm)) {
      const ret = sx_ret__create(0, 0);
      ret.value1 = -1; // 파라미터 에러
      ret.value2 = 0;
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
    ret.value1 = -1;
    ret.value2 = 0;
    sx_ret__write_data(ret, {
      msg: 'middleware error',
      error: String(e),
    });
    return res.status(500).json(ret);
  }
}


// 'use strict';

// import { sx_ret__create, sx_ret__write_data } from '../../libs/my_lib.js';

// // YYYYMM 포맷으로 변환
// function toYYYYMM(d) {
//   const y = d.getFullYear();
//   const m = String(d.getMonth() + 1).padStart(2, '0');
//   return `${y}${m}`;
// }

// /**
//  * /land-price-index/sync 요청 파라미터 파싱/검증/정형화
//  *
//  * 지원 파라미터:
//  *   - regionCode (옵션): 특정 지역만 동기화하고 싶을 때 숫자 코드
//  *       예) 500007
//  *       없으면 "전체 지역" 대상으로 처리
//  *
//  *   - fromYm (옵션): 시작 년월, 'YYYYMM'
//  *       없으면 기본값 '200501'
//  *
//  *   - toYm (옵션): 종료 년월, 'YYYYMM'
//  *       없으면 현재 날짜 기준 YYYYMM
//  */
// export function parseSyncReq(req, res, next) {
//   try {
//     let fromYm = req.query.fromYm ? String(req.query.fromYm) : '';
//     let toYm = req.query.toYm ? String(req.query.toYm) : '';

//     // regionCode는 숫자로 파싱 (옵션)
//     let regionCode = null;
//     if (req.query.regionCode != null && req.query.regionCode !== '') {
//       const parsed = Number(req.query.regionCode);
//       if (!Number.isFinite(parsed) || parsed <= 0) {
//         const ret = sx_ret__create(0, 0);
//         ret.value1 = -1;
//         ret.value2 = 0;
//         sx_ret__write_data(ret, {
//           msg: 'bad regionCode',
//           regionCode: req.query.regionCode,
//         });
//         return res.status(400).json(ret);
//       }
//       regionCode = parsed;
//     }

//     // 기본 기간 설정
//     const now = new Date();
//     if (!toYm) {
//       toYm = toYYYYMM(now); // 기본: 현재 YYYYMM
//     }
//     if (!fromYm) {
//       fromYm = '200501'; // 기본: 2005-01
//     }

//     // YYYYMM 형식 검증
//     const ymRe = /^[0-9]{6}$/;
//     if (!ymRe.test(fromYm) || !ymRe.test(toYm)) {
//       const ret = sx_ret__create(0, 0);
//       ret.value1 = -1;
//       ret.value2 = 0;
//       sx_ret__write_data(ret, {
//         msg: 'bad ym format',
//         fromYm,
//         toYm,
//       });
//       return res.status(400).json(ret);
//     }

//     // 내부 DTO
//     //  - regionCode: null이면 service에서 "전체(all)"로 해석
//     //  - 숫자면 해당 지역 하나만 처리
//     req.dto = {
//       fromYm,
//       toYm,
//       regionCode,
//     };

//     return next();
//   } catch (e) {
//     const ret = sx_ret__create(0, 0);
//     ret.value1 = -1;
//     ret.value2 = 0;
//     sx_ret__write_data(ret, {
//       msg: 'middleware error',
//       error: String(e),
//     });
//     return res.status(500).json(ret);
//   }
// }
