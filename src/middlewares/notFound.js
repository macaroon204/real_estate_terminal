// src/middlewares/notFound.js
import * as my_lib from '../libs/my_lib.js';

export function notFound(req, res, next) {
  // my_lib.get_req_url(req)가 sx_ret 포맷을 만들어줌
  const ret = my_lib.get_req_url(req);

  console.error("[ERROR-404] status = [", 404, "], ret = ", ret);

  // ✅ 404는 여기서 바로 응답 종료 (next(err) 하지 않음)
  return res.status(404).json(ret);
}
