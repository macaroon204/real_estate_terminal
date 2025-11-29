// src/libs/log_spec.js
'use strict';

import { LOG_ENV } from '../config/log.js';
import { sx_ret__create, sx_ret__write_data } from './my_lib.js'

/**
 * SID: 어떤 시스템의 로그인지 구분
 * - API 는 .env 의 SYS_NO를 그대로 사용
 */
export const SID = {
  API: LOG_ENV.SID_API, // ★ env 기반 SID
  FRONT: '200',
  AI: '300',
  JOB: '400',
};

/**
 * PID: 처리 단계 구분
 */
export const PID = {
  REQ_RECEIVED: 0, // 요청 수신
  REQ_PARSED: 10,  // 파라미터 검증 완료
  SYNC_START: 20,  // 동기화 시작
  SYNC_REGION: 21, // 지역 단위 처리
  SAVE_DB: 30,     // DB 저장
  SYNC_DONE: 90,   // 전체 완료
  ERROR: 99,       // 에러 발생
};

/**
 * 내부 상태코드(value1): 내부 처리 결과
 */
export const INTERNAL_STATUS = {
  OK: 0,             // 정상
  BAD_REQUEST: -1,   // 파라미터 오류
  BUSINESS_FAIL: -2, // 조건 불충족
  DB_ERROR: -3,      // DB 오류
  INTERNAL_ERROR: -4,// 내부 예외
  INTERNAL_TIMEOUT: -5, // 내부 타임아웃
};

/**
 * 외부 상태코드(value2): 외부 시스템 처리 결과
 */
export const EXTERNAL_STATUS = {
  OK: 0,          // 외부 정상
  HTTP_FAIL: -1,  // HTTP 요청 실패
  HTTP_STATUS: -2,// HTTP 상태코드 문제
  PARSE_ERROR: -3,// 외부 응답 파싱 실패
  TIMEOUT: -4,    // 외부 타임아웃
};

/**
 * 공통 로그 생성기
 * - my_lib에서 그릇 생성 후
 * - 여기에 SID/PID/STATUS/BUFFER만 채움
 */
export function createLog({
  pid,
  cid,
  sid = SID.API,
  value1 = INTERNAL_STATUS.OK,
  value2 = EXTERNAL_STATUS.OK,
  buffer = {},
} = {}) {
  const ret = sx_ret__create(pid, cid);

  ret.sid = sid;
  ret.value1 = value1;
  ret.value2 = value2;

  sx_ret__write_data(ret, buffer);

  return ret;
}
