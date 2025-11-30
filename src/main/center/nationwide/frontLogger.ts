// src/main/center/nationwide/frontLogger.ts
// 프론트 전용 로그 헬퍼
// - 백엔드 log_spec.js / my_lib.js 규칙을 최대한 가볍게 맞춘 버전
// - 브라우저 콘솔에만 찍고, 네트워크 전송은 하지 않는다.

export const SID = {
  FRONT: '200', // 프론트엔드 식별자 (SYS_NO 200 가정)
} as const;

export const PID = {
  REQ_RECEIVED: 0,   // 요청 수신
  REQ_PARSED: 10,    // 파라미터 검증 / 파싱 완료
  SYNC_START: 20,    // 동기 처리 시작
  SYNC_REGION: 21,   // 지역 단위 처리
  SAVE_DB: 30,       // DB 저장
  SYNC_DONE: 90,     // 전체 처리 완료
  ERROR: 99,         // 에러
} as const;

export const INTERNAL_STATUS = {
  OK: 0,
  ERROR: -1,
} as const;

export const EXTERNAL_STATUS = {
  OK: 0,
  HTTP_FAIL: -1,     // fetch 자체 실패 (네트워크 오류 등)
  HTTP_STATUS: -2,   // HTTP 상태코드가 200대가 아닌 경우
  PARSE_ERROR: -3,   // JSON 파싱 실패
  TIMEOUT: -4,
} as const;

export interface FrontLog {
  sid: string;
  pid: number;
  cid: string;
  value1: number;
  value2: number;
  buffer?: Record<string, unknown>;
  ts: string; // ISO 타임스탬프
}

interface CreateFrontLogParams {
  pid: number;
  cid: string;
  sid?: string;
  value1?: number;
  value2?: number;
  buffer?: Record<string, unknown>;
}

export function createFrontLog({
  pid,
  cid,
  sid = SID.FRONT,
  value1 = INTERNAL_STATUS.OK,
  value2 = EXTERNAL_STATUS.OK,
  buffer = {},
}: CreateFrontLogParams): FrontLog {
  return {
    sid,
    pid,
    cid,
    value1,
    value2,
    buffer,
    ts: new Date().toISOString(),
  };
}

/**
 * 실제 로그 출력 함수
 * - 현재는 console.log만 사용
 * - 나중에 필요하면 여기서 서버로 전송하는 코드 추가
 */
export function logFront(params: {
  pid: number;
  cid: string;
  value1?: number;
  value2?: number;
  buffer?: Record<string, unknown>;
}): void {
  const log = createFrontLog(params);
  // eslint-disable-next-line no-console
  console.log('[FRONT]', log);
}
