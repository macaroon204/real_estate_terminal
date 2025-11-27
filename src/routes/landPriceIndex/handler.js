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

import { syncLandPriceIndex } from '../../services/landPriceIndex/service.js';

function resolveCid(req) {
  const headerCid = req.headers['x-cid'] || req.headers['X-CID'];
  if (headerCid) return String(headerCid);
  return String(Date.now());
}

export async function syncHandler(req, res, next) {
  const cid = resolveCid(req);

  const reqLog = get_req_url(req);
  console.log('[REQ /land-price-index/sync]', {
    ...reqLog,
    cid,
  });

  const recvBuffer = {};
  if (reqLog.dest_url_path) recvBuffer.path = reqLog.dest_url_path;
  if (reqLog.src_ip) recvBuffer.src_ip = reqLog.src_ip;
  if (reqLog.src_port) recvBuffer.src_port = reqLog.src_port;
  if (req.dto?.fromYm) recvBuffer.fromYm = req.dto.fromYm;
  if (req.dto?.toYm) recvBuffer.toYm = req.dto.toYm;
  if (req.dto?.regionCode != null) recvBuffer.regionCode = req.dto.regionCode;

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

  try {
    const result = await syncLandPriceIndex({ ...req.dto, cid });

    const internalStatus = INTERNAL_STATUS.OK;
    const externalStatus = result.ext_status ?? EXTERNAL_STATUS.OK;

    const ret = sx_ret__create(1, cid);
    ret.value1 = internalStatus;
    ret.value2 = externalStatus;

    sx_ret__write_data(ret, {
      period: result.period,
      target: result.target,
      fetched: result.fetched,
      saved: result.saved,
      errorRegions: result.errorRegions,
    });

    return res.json(ret);
  } catch (e) {
    console.error('[SYNC ERROR]', e);

    console.error(
      '[LOG]',
      createLog({
        sid: SID.API,
        pid: PID.ERROR,
        cid,
        value1: INTERNAL_STATUS.INTERNAL_ERROR,
        value2: EXTERNAL_STATUS.OK,
        buffer: {
          route: '/land-price-index/sync',
          msg: 'sync failed',
          error: String(e),
        },
      }),
    );

    const ret = sx_ret__create(1, cid);
    ret.value1 = INTERNAL_STATUS.INTERNAL_ERROR;
    ret.value2 = EXTERNAL_STATUS.OK;

    sx_ret__write_data(ret, {
      msg: 'sync failed',
      error: String(e),
    });

    return res.status(500).json(ret);
  }
}
