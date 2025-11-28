// src/services/landPriceIndex/loggerBase.js
'use strict';

import {
  SID,
  PID,
  INTERNAL_STATUS,
  EXTERNAL_STATUS,
  createLog,
} from '../../libs/log_spec.js';

/**
 * 공통: SYNC_START 로그
 */
export function logSyncStartBase({ cid, fromYm, toYm, totalRegions, mode }) {
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
        mode,
      },
    }),
  );
}

/**
 * 공통: 지역 단위 에러 로그
 */
export function logRegionErrorBase({ cid, regionCode, reason }) {
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

/**
 * 공통: SYNC_DONE 로그
 * - extraBuffer 로 full/update 개별 필드를 확장
 */
export function logSyncDoneBase({
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
  mode,
  extraBuffer = {},
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
        mode,
        fromYm,
        toYm,
        totalRegions,
        successRegions,
        failRegions,
        fetched,
        saved,
        elapsedMs,
        ...extraBuffer,
      },
    }),
  );
}
