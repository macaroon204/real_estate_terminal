// src/libs/log_spec_check.js
'use strict';

import { LOG_ENV } from '../config/log.js';
import {
  SID,
  INTERNAL_STATUS,
  EXTERNAL_STATUS,
} from './log_spec.js';

function assert(cond, msg) {
  if (!cond) {
    throw new Error('[LOG_SPEC_CHECK] ' + msg);
  }
}

// 부팅 시 한 번만 호출하면 되는 검증 함수
export function runLogSpecChecks() {
  // 1. SID 규칙
  assert(
    SID.API === LOG_ENV.SID_API,
    'SID.API must equal LOG_ENV.SID_API (env SYS_NO)',
  );

  // 2. INTERNAL_STATUS 기본 규칙
  assert(
    INTERNAL_STATUS.OK === 0,
    'INTERNAL_STATUS.OK must be 0',
  );

  // 3. EXTERNAL_STATUS 기본 규칙
  assert(
    EXTERNAL_STATUS.OK === 0,
    'EXTERNAL_STATUS.OK must be 0',
  );

  // 필요하면 여기에 규칙 더 추가 가능:
  // - INTERNAL_STATUS 에러 값은 전부 0이 아닌 값이어야 한다
  // - EXTERNAL_STATUS 실패 코드는 전부 0이 아니어야 한다 등
  //   (지금은 기본 OK=0만 체크)
}
