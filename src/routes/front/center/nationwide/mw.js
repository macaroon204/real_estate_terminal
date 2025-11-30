// src/routes/front/center/nationwide/mw.js
'use strict';

import { get_req_url } from '../../../../libs/my_lib.js';
import { PID } from '../../../../libs/log_spec.js';

/**
 * /api/front/center/nationwide 공통 미들웨어
 * - CID 세팅
 * - [REQ] 로그 출력
 */
export function prepareNationwide(req, res, next) {
  // 1) CID 결정: 헤더 우선, 없으면 현재 시각 기반
  const headerCid = req.headers['x-cid'];
  const cid =
    headerCid && String(headerCid).trim().length > 0
      ? String(headerCid)
      : String(Date.now());

  // 다음 단계에서 쓰게 req 객체에 붙여두기
  req.cid = cid;

  // 2) [REQ] 로그 (src_ip, src_port, dest_url_path 등)
  const sx = get_req_url(req); // bufflen / buffer 채워진 상태
  sx.pid = PID.REQ_RECEIVED; // 0
  sx.cid = cid;

  console.log('[REQ][CENTER_NW]', sx);

  next();
}
