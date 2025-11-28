// src/services/landPriceIndex/update/logger.js
'use strict';

import {
  SID,
  PID,
  INTERNAL_STATUS,
  EXTERNAL_STATUS,
  createLog,
} from '../../../libs/log_spec.js';

export function logSyncStart({ cid, fromYm, toYm, totalRegions }) {
  console.log(
    '[LOG]',
    createLog({
      sid: SID.API,
      pid: PID.SYNC_START,
      cid,
      value1: INTERNAL_STATUS.OK,
      value2: EXTERNAL_STATUS.OK,
      buffer: {
        fromYm,
        toYm,
        totalRegions,
        mode: 'update',
      },
    }),
  );
}

export function logRegionError({ cid, regionCode, reason }) {
  console.error(
    '[LOG]',
    createLog({
      sid: SID.API,
      pid: PID.SYNC_REGION,
      cid,
      value1: INTERNAL_STATUS.BUSINESS_FAIL,
      value2: EXTERNAL_STATUS.OK,
      buffer: {
        region_code: regionCode,
        msg: reason,
      },
    }),
  );
}

export function logSyncDone({
  cid,
  fromYm,
  toYm,
  totalRegions,
  successRegions,
  failRegions,
  fetched,
  saved,
  elapsedMs,
  ext_status,
}) {
  console.log(
    '[LOG]',
    createLog({
      sid: SID.API,
      pid: PID.SYNC_DONE,
      cid,
      value1:
        failRegions > 0
          ? INTERNAL_STATUS.BUSINESS_FAIL
          : INTERNAL_STATUS.OK,
      value2: ext_status ?? EXTERNAL_STATUS.OK,
      buffer: {
        mode: 'update',
        fromYm,
        toYm,
        totalRegions,
        successRegions,
        failRegions,
        fetched,
        saved,
        elapsedMs,
      },
    }),
  );
}
