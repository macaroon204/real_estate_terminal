# DATA_API --- Logging System Design (`src/libs`)

이 문서는 DATA_API(API 서버)의 **로그 체계 설계와 구현 코드 구조**를
설명한다.

-   공통 로그 포맷
-   SID / PID / Status 코드 규칙
-   `log_spec.js` · `log_spec_check.js` · `my_lib.js` 의 역할
-   Handler / Service 단계에서 어떻게 사용하는지 흐름

본 문서는 실행 가이드가 아닌 **설계·구조 설명 문서**이다.

------------------------------------------------------------------------

## 1. 공통 로그 구조

``` json
{
  "sid": "100",
  "pid": 20,
  "cid": "1764187582151",
  "value1": 0,
  "value2": 0,
  "bufflen": 4,
  "buffer": {
    "...": "..."
  }
}
```

| 필드 | 설명 |
|------|------|
| `sid` | 시스템 ID |
| `pid` | 처리 단계 ID |
| `cid` | 요청 추적 ID |
| `value1` | 내부 상태 코드 |
| `value2` | 외부 상태 코드 |
| `bufflen` | `buffer` key 수 |
| `buffer` | 부가 정보 |

------------------------------------------------------------------------

## 2. SID / PID / Status

### SID

``` js
export const SID = {
  API: LOG_ENV.SID_API,
  FRONT: '200',
  AI: '300',
  JOB: '400',
};
```

API 서버는 항상 `SID.API` 사용.

------------------------------------------------------------------------

### PID

``` js
export const PID = {
  REQ_RECEIVED: 0,
  REQ_PARSED: 10,
  SYNC_START: 20,
  SYNC_REGION: 21,
  SAVE_DB: 30,
  SYNC_DONE: 90,
  ERROR: 99,
};
```

------------------------------------------------------------------------

### Status

``` js
export const INTERNAL_STATUS = {
  OK: 0,
  BAD_REQUEST: -1,
  BUSINESS_FAIL: -2,
  DB_ERROR: -3,
  INTERNAL_ERROR: -4,
  INTERNAL_TIMEOUT: -5,
};

export const EXTERNAL_STATUS = {
  OK: 0,
  HTTP_FAIL: -1,
  HTTP_STATUS: -2,
  PARSE_ERROR: -3,
  TIMEOUT: -4,
};
```

------------------------------------------------------------------------

## 3. createLog

``` js
export function createLog({ pid, cid, sid = SID.API,
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
```

-   공통 로그 생성 함수
-   한 줄로 로그 그릇 구성

------------------------------------------------------------------------

## 4. my_lib.js

### sx_ret\_\_create

``` js
export function sx_ret__create(pid, cid) {
  return {
    sid: LOG_ENV.SID_API,
    pid,
    cid,
    value1: 0,
    value2: 0,
    bufflen: -1,
    buffer: null,
  };
}
```

------------------------------------------------------------------------

### sx_ret\_\_write_data

``` js
export function sx_ret__write_data(sx_ret, data) {
  sx_ret.buffer = structuredClone(data);

  if (typeof data === 'object' && data !== null)
      sx_ret.bufflen = Object.keys(data).length;
  else
      sx_ret.bufflen = 0;
}
```

------------------------------------------------------------------------

## 5. log_spec_check.js

``` js
export function runLogSpecChecks() {
  assert(SID.API === LOG_ENV.SID_API);
  assert(INTERNAL_STATUS.OK === 0);
  assert(EXTERNAL_STATUS.OK === 0);
}
```

-   로그 스펙 무결성 부팅 시 검사
-   위반 시 서버 중단

------------------------------------------------------------------------

## 6. 흐름 패턴 요약

정상 처리:

``` text
pid: 0  → 요청 시작
pid: 20 → 동기화 시작
pid: 21 → 지역 처리(선택)
pid: 30 → DB 저장
pid: 90 → 전체 완료 요약
```

에러 처리: `pid: 99`

------------------------------------------------------------------------

## 7. 운영 규칙

-   SYNC_DONE(pid 90)는 **Service에서 1회만 출력**
-   buffer에 null/undefined 포함 금지
-   elapsedMs 필드 요약 로그 포함
-   로그 Fragment 출력 금지 (항상 createLog 단건 출력)

------------------------------------------------------------------------

## 8. 설계 요약

-   공통 포맷: sid + pid + cid 중심 구조
-   env SYS_NO와 SID.API 강한 연계
-   util 함수로 로그 생성 일원화
-   스펙 검증으로 fail-fast 보증

------------------------------------------------------------------------

# END
