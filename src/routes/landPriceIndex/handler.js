'use strict';

import { get_req_url, sx_ret__create, sx_ret__write_data } from '../../libs/my_lib.js';
import { syncLandPriceIndex } from '../../services/landPriceIndex/service.js';

export async function syncHandler(req, res, next) {
  // 1) 요청 로그(원하면 여기서 콘솔/파일로 기록)
  const reqLog = get_req_url(req);
  console.log("[REQ]", reqLog); 

  try {
    const result = await syncLandPriceIndex(req.dto);

    // 2) sx_ret 응답 생성
    const ret = sx_ret__create(1, 0);
    ret.value1 = 0;                 // 내부 성공
    ret.value2 = result.ext_status; // 외부 성공/실패 코드(서비스가 주는 값)
    sx_ret__write_data(ret, {
      regionCode: req.dto.regionCode,
      period: result.period,
      fetched: result.fetched,
      saved: result.saved
    });

    return res.json(ret);
  } catch (e) {
    // 내부 로직 실패
    const ret = sx_ret__create(1, 0);
    ret.value1 = -1;    // 내부 에러
    ret.value2 = 0;     // 외부 상태 불명(서비스가 throw한 경우)
    sx_ret__write_data(ret, { msg: "sync failed", error: String(e) });
    return res.status(500).json(ret);
  }
}
