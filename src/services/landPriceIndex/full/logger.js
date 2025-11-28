// src/services/landPriceIndex/full/logger.js
'use strict';

import {
  logSyncStartBase,
  logRegionErrorBase,
  logSyncDoneBase,
} from '../loggerBase.js';

/**
 * 전체 동기화 시작 로그 (full)
 */
export function logSyncStart({ cid, fromYm, toYm, totalRegions }) {
  return logSyncStartBase({
    cid,
    fromYm,
    toYm,
    totalRegions,
    mode: 'full',
  });
}

/**
 * 지역 단위 에러 로그 (full)
 */
export const logRegionError = logRegionErrorBase;

/**
 * 전체 동기화 완료 로그 (full)
 * - full 은 errorRegions 를 추가로 남긴다.
 */
export function logSyncDone(args) {
  const {
    errorRegions = [],
    // 나머지는 그대로 넘김
    ...rest
  } = args;

  return logSyncDoneBase({
    ...rest,
    mode: 'full',
    extraBuffer: { errorRegions },
  });
}
