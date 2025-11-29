// src/config/log.js
'use strict';

import { env } from './env.js';

/**
 * 로그/시스템 관련 환경 설정
 * - SID_API : .env 의 SYS_NO 기반 (없으면 100)
 * - LOG_LEVEL, LOG_PRETTY : 나중에 활용 가능
 */
export const LOG_ENV = {
  SID_API: env.app.sysNo,

  LOG_LEVEL: env.log.level,
  LOG_PRETTY: env.log.pretty,
};
