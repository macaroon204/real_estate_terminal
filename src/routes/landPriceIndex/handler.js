// src/routes/landPriceIndex/handler.js
'use strict';

import {
  get_req_url,
  sx_ret__create,
  sx_ret__write_data,
} from '../../libs/my_lib.js';

import {
  SID,
  PID,
  INTERNAL_STATUS,
  EXTERNAL_STATUS,
  createLog,
} from '../../libs/log_spec.js';

import { syncFull } from '../../services/landPriceIndex/full/syncFull.js';
import { syncUpdate } from '../../services/landPriceIndex/update/syncUpdate.js';

// CID 결정: 헤더 우선, 없으면 timestamp
function resolveCid(req) {
  const headerCid = req.headers['x-cid'] || req.headers['X-CID'];
  if (headerCid) return String(headerCid);
  return String(Date.now());
}

// 공통: 요청 수신 로그 + REQ_RECEIVED 로그
function logRequest(req, cid) {
  const reqRet = get_req_url(req);

  // 원본 req 정보 + cid 그대로 한 번 찍기
  console.log('[REQ]', {
    ...reqRet,
    cid,
  });

  const recvBuffer = {};
  const buf = reqRet.buffer || {};
  const dto = req.dto || {};

  // 요청 메타 정보
  if (buf.dest_url_path) recvBuffer.path = buf.dest_url_path;
  if (buf.src_ip)        recvBuffer.src_ip = buf.src_ip;
  if (buf.src_port)      recvBuffer.src_port = buf.src_port;
  recvBuffer.method = req.method;

  // 파라미터
  if (dto.fromYm) recvBuffer.fromYm = dto.fromYm;
  if (dto.toYm)   recvBuffer.toYm   = dto.toYm;

  console.log(
    '[LOG]',
    createLog({
      sid: SID.API,
      pid: PID.REQ_RECEIVED,
      cid,
      value1: INTERNAL_STATUS.OK,
      value2: EXTERNAL_STATUS.OK,
      buffer: recvBuffer,
    }),
  );
}

// 공통: 성공 응답 포맷
function sendOk(res, cid, result = {}) {
  const ret = sx_ret__create(1, cid);
  ret.value1 = INTERNAL_STATUS.OK;
  ret.value2 = result.ext_status ?? EXTERNAL_STATUS.OK;

  sx_ret__write_data(ret, {
    period: result.period ?? null,
    target: result.target ?? null,
    fetched: result.fetched ?? 0,
    saved: result.saved ?? 0,
    errorRegions: result.errorRegions ?? [],
  });

  return res.json(ret);
}

// 공통: 에러 응답 포맷
function sendError(res, cid, err) {
  console.error('[SYNC ERROR]', err);

  const ret = sx_ret__create(1, cid);
  ret.value1 = INTERNAL_STATUS.INTERNAL_ERROR;
  ret.value2 = EXTERNAL_STATUS.OK; // 외부 에러 코드가 있다면 나중에 확장 가능

  sx_ret__write_data(ret, {
    msg: 'sync failed',
    error: String(err),
  });

  return res.status(500).json(ret);
}

// 공통 실행 래퍼: 서비스 로직은 건드리지 않고, 흐름만 공통화
async function handleSync(req, res, serviceFn) {
  const cid = resolveCid(req);
  logRequest(req, cid);

  try {
    const dto = req.dto || {};
    const result = await serviceFn({ ...dto, cid });
    return sendOk(res, cid, result);
  } catch (e) {
    return sendError(res, cid, e);
  }
}

// 전체 수신 핸들러
export async function syncFullHandler(req, res) {
  return handleSync(req, res, syncFull);
}

// 업데이트(증분) 핸들러
export async function syncUpdateHandler(req, res) {
  return handleSync(req, res, syncUpdate);
}
