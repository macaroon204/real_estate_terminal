// src/services/landPriceIndex/update/logger.js
'use strict';

import {
  logSyncStartBase,
  logRegionErrorBase,
  logSyncDoneBase,
} from '../loggerBase.js';

/**
 * 업데이트 동기화 시작 로그 (update)
 */
export function logSyncStart({ cid, fromYm, toYm, totalRegions }) {
  return logSyncStartBase({
    cid,
    fromYm,
    toYm,
    totalRegions,
    mode: 'update',
  });
}

/**
 * 지역 단위 에러 로그 (update)
 */
export const logRegionError = logRegionErrorBase;

/**
 * 업데이트 동기화 완료 로그 (update)
 */
export function logSyncDone(args) {
  return logSyncDoneBase({
    ...args,
    mode: 'update',
  });
}
