// src/libs/log_spec.js
'use strict';

import { sx_ret__create, sx_ret__write_data } from './my_lib.js';

/**
 * SID: 어떤 시스템의 로그인지 구분
 */
export const SID = {
  API: '100',   // API 서버
  FRONT: '200', // 프론트엔드
  AI: '300',    // AI 서버
  JOB: '400',   // 배치/작업
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


// // src/libs/log_spec.js
// 'use strict';

// /**
//  * 📌 SID (Service/System ID)
//  *  - 어느 컴포넌트에서 나온 로그인지 구분
//  */
// export const SID = {
//   API: '100',     // API 서버 (지금 이 프로젝트)
//   FRONT: '200',   // 프론트엔드 (React/Vite)
//   EXT: '210',     // 외부 컴포넌트 (부동산 통계 사이트 등)
//   AI: '300',      // AI 모델 서버/가상환경
// };

// /**
//  * 📌 PID (Process/Phase ID)
//  *  - 요청/작업의 어느 단계인지 구분
//  *  - 공통으로 쓸 수 있는 기본 세트
//  */
// export const PID = {
//   REQ_RECEIVED: 0,   // 요청 들어옴
//   REQ_PARSED: 10,    // 파라미터 파싱/검증 완료
//   SYNC_START: 20,    // 동기화/주요 작업 시작
//   SYNC_REGION: 21,   // 지역/단일 단위 작업 중
//   SAVE_DB: 30,       // DB 저장 단계
//   SYNC_DONE: 90,     // 작업 정상 종료
//   ERROR: 99,         // 예외/에러 발생
// };

// /**
//  * 📌 내부 상태 코드 (value1)
//  *  - 우리 서버/비즈니스 로직 기준 상태
//  */
// export const INTERNAL_STATUS = {
//   OK: 0,             // 정상
//   BAD_REQUEST: -1,   // 요청/파라미터 오류
//   BUSINESS_FAIL: -2, // 비즈니스 조건 실패
//   DB_ERROR: -3,      // DB 관련 에러
//   INTERNAL_ERROR: -4,// 예측 못한 내부 예외
//   INTERNAL_TIMEOUT: -5, // 내부 타임아웃/중단
// };

// /**
//  * 📌 외부 상태 코드 (value2)
//  *  - 외부 시스템 기준 상태
//  *  - 양수: 외부에서 받은 코드 그대로 (예: R-ONE 290, 336 등)
//  *  - 음수: 우리가 정의한 외부 에러
//  */
// export const EXTERNAL_STATUS = {
//   OK: 0,            // 외부 문제 없음
//   HTTP_FAIL: -1,    // HTTP 요청 자체 실패
//   HTTP_STATUS: -2,  // HTTP status 200 아님
//   PARSE_ERROR: -3,  // 응답 파싱 실패
//   TIMEOUT: -4,      // 외부 타임아웃
// };

// /**
//  * 📌 공통 로그 객체 생성기
//  *  - sid/pid/cid/value1/value2 규칙 적용해서
//  *    동일 포맷으로 로그 만들기
//  */
// export function createLog({ sid, pid, cid, value1, value2, buffer }) {
//   const buf = buffer || {};
//   return {
//     sid,             // 어디 컴포넌트인지
//     pid,             // 어느 단계인지
//     cid,             // 어떤 요청/트랜잭션인지
//     value1,          // 내부 상태 코드
//     value2,          // 외부 상태 코드
//     bufflen: Object.keys(buf).length,
//     buffer: buf,
//   };
// }
