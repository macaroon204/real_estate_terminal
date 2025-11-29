# DATA_API --- landPriceIndex Routing Layer (`src/routes/landPriceIndex`)

이 문서는 **토지가격지수 동기화 엔드포인트**를 담당하는\
`src/routes/landPriceIndex` 라우팅 계층의 설계와 소스 구조를 설명합니다.

실행/점검 명령은 Root README에서 다루며,\
본 문서는 **router → mw → handler → service** 흐름과 코드 레벨 책임
분리에 집중합니다.

------------------------------------------------------------------------

## 1. 디렉터리 구조

``` text
src/routes/landPriceIndex/
 ├─ router.js   # 실제 라우팅 정의
 ├─ mw.js       # /sync 요청 공통 파라미터 파싱·검증
 └─ handler.js  # 비즈니스 서비스 호출 + 응답 포맷 공통화
```

------------------------------------------------------------------------

## 2. 요청 흐름 개요

``` text
HTTP GET /land-price-index/sync/full?fromYm=YYYYMM&toYm=YYYYMM
HTTP GET /land-price-index/sync/update?fromYm=YYYYMM&toYm=YYYYMM

   ↓ (Express)
router.js
   ↓
parseSyncReq (mw.js)
   ↓
syncFullHandler / syncUpdateHandler (handler.js)
   ↓
syncFull / syncUpdate Service
   ↓
DB / 외부 API / Logging
```

------------------------------------------------------------------------

## 3. router.js --- 엔드포인트 정의

`router.js`는 **URL → 미들웨어 → 핸들러**를 연결하는 책임만 가진다.

``` js
const router = Router();

// 전체 수신 (full sync)
router.get('/sync/full', parseSyncReq, syncFullHandler);

// 업데이트(증분) 수신
router.get('/sync/update', parseSyncReq, syncUpdateHandler);

export default router;
```

핵심 포인트:

-   `parseSyncReq` 미들웨어는 **두 엔드포인트에서 공통 사용**
-   **비즈니스 로직은 전혀 포함하지 않고**, 경로와 체인만 정의

------------------------------------------------------------------------

## 4. mw.js --- /sync 공통 파라미터 파싱·검증

### 4-1. isValidYm()

``` js
function isValidYm(str) {
  return /^[0-9]{6}$/.test(str);
}
```

-   `YYYYMM` 형식(숫자 6자리)만 허용
-   날짜 유효성(존재하는 월인지)은 별도 검증 없이 포맷만 체크

------------------------------------------------------------------------

### 4-2. parseSyncReq(req, res, next)

``` js
export function parseSyncReq(req, res, next) {
  try {
    let fromYm = req.query.fromYm ? String(req.query.fromYm) : '';
    let toYm   = req.query.toYm   ? String(req.query.toYm)   : '';

    // 기본 기간 설정
    const now = new Date();
    now.setMonth(now.getMonth() - 1);   // 전월
    const defaultTo = `${now.getFullYear()}${String(
      now.getMonth() + 1,
    ).padStart(2, '0')}`;

    if (!toYm)   toYm   = defaultTo;
    if (!fromYm) fromYm = '200501';

    // 형식 검증 실패 시 400
    if (!isValidYm(fromYm) || !isValidYm(toYm)) {
      const ret = sx_ret__create(0, 0);
      ret.value1 = INTERNAL_STATUS.BAD_REQUEST;
      ret.value2 = EXTERNAL_STATUS.OK;

      sx_ret__write_data(ret, {
        msg: 'bad ym format',
        fromYm,
        toYm,
      });

      return res.status(400).json(ret);
    }

    // 검증된 값을 DTO로 적재
    req.dto = { fromYm, toYm };
    return next();
  } catch (e) {
    const ret = sx_ret__create(0, 0);
    ret.value1 = INTERNAL_STATUS.INTERNAL_ERROR;
    ret.value2 = EXTERNAL_STATUS.OK;

    sx_ret__write_data(ret, {
      msg: 'middleware error',
      error: String(e),
    });

    return res.status(500).json(ret);
  }
}
```

#### 동작 정리

1.  `fromYm`, `toYm` 을 `query`에서 문자열로 추출
2.  값이 없으면:
    -   `toYm` → **전월(오늘 기준 1개월 전)**
    -   `fromYm` → 고정값 `200501`
3.  형식이 `YYYYMM`이 아니면:
    -   `INTERNAL_STATUS.BAD_REQUEST` / 400 응답
    -   공통 포맷(sx_ret)으로 에러 정보 반환
4.  성공 시:
    -   `req.dto = { fromYm, toYm }` 로 정규화
    -   이후 Handler/Service는 `req.query`가 아니라 **`req.dto`만 신뢰**

> ➜ 라우트별 파라미터 처리 로직을 하나의 미들웨어로 모으고,\
> 이후 계층에서는 "이미 검증된 DTO"만 바라보도록 설계되어 있다.

------------------------------------------------------------------------

## 5. handler.js --- 공통 핸들러 & 응답 포맷

`handler.js`는 **실제 HTTP 요청을 받아 Service를 호출하고,\
공통 응답/로그 포맷을 유지하는 계층**이다.

------------------------------------------------------------------------

### 5-1. CID 생성: resolveCid()

``` js
function resolveCid(req) {
  const headerCid = req.headers['x-cid'] || req.headers['X-CID'];
  if (headerCid) return String(headerCid);
  return String(Date.now());
}
```

-   우선순위:
    1.  클라이언트가 `X-CID` 헤더로 보낸 값
    2.  없으면 `Date.now()` 기반 timestamp 문자열
-   같은 CID가 서비스/로그 전체에 전달되어,\
    **한 요청의 전체 흐름을 추적**할 수 있게 한다.

------------------------------------------------------------------------

### 5-2. 요청 수신 로그: logRequest()

``` js
function logRequest(req, cid) {
  const reqRet = get_req_url(req);

  // 원본 요청 정보
  console.log('[REQ]', { ...reqRet, cid });

  const recvBuffer = {};
  const buf = reqRet.buffer || {};
  const dto = req.dto || {};

  // 요청 메타
  if (buf.dest_url_path) recvBuffer.path = buf.dest_url_path;
  if (buf.src_ip)        recvBuffer.src_ip = buf.src_ip;
  if (buf.src_port)      recvBuffer.src_port = buf.src_port;
  recvBuffer.method = req.method;

  // 파라미터
  if (dto.fromYm) recvBuffer.fromYm = dto.fromYm;
  if (dto.toYm)   recvBuffer.toYm   = dto.toYm;

  console.log(
    '[LOG]',
    createLog({
      sid: SID.API,
      pid: PID.REQ_RECEIVED,
      cid,
      value1: INTERNAL_STATUS.OK,
      value2: EXTERNAL_STATUS.OK,
      buffer: recvBuffer,
    }),
  );
}
```

#### 특징

-   `my_lib.get_req_url()` 결과 + CID를 **한 번 더 래핑해서 찍음**
-   실제 비즈니스 파라미터(`fromYm`, `toYm`)까지 포함한
    **REQ_RECEIVED(log)** 생성
-   이후 서비스는 별도로 "요청이 들어왔다" 로그를 만들 필요가 없음

------------------------------------------------------------------------

### 5-3. 성공 응답 포맷: sendOk()

``` js
function sendOk(res, cid, result = {}) {
  const ret = sx_ret__create(1, cid);
  ret.value1 = INTERNAL_STATUS.OK;
  ret.value2 = result.ext_status ?? EXTERNAL_STATUS.OK;

  sx_ret__write_data(ret, {
    period:       result.period ?? null,
    target:       result.target ?? null,
    fetched:      result.fetched ?? 0,
    saved:        result.saved ?? 0,
    errorRegions: result.errorRegions ?? [],
  });

  return res.json(ret);
}
```

-   Service는
    `{ period, target, fetched, saved, errorRegions, ext_status }` 같은
    구조의 객체만 반환
-   Handler가 **공통 응답 포맷(sx_ret)** 으로 감싸서 내려준다.
-   이렇게 하면:
    -   Service는 HTTP/Express에 독립적인 **순수 비즈니스 함수**로 유지
    -   응답 스펙 변경도 Handler 한 곳에서 관리 가능

------------------------------------------------------------------------

### 5-4. 에러 응답 포맷: sendError()

``` js
function sendError(res, cid, err) {
  console.error('[SYNC ERROR]', err);

  const ret = sx_ret__create(1, cid);
  ret.value1 = INTERNAL_STATUS.INTERNAL_ERROR;
  ret.value2 = EXTERNAL_STATUS.OK;

  sx_ret__write_data(ret, {
    msg: 'sync failed',
    error: String(err),
  });

  return res.status(500).json(ret);
}
```

-   예상치 못한 예외 발생 시 사용
-   5xx + 공통 포맷으로 응답

------------------------------------------------------------------------

### 5-5. 공통 실행 래퍼: handleSync()

``` js
async function handleSync(req, res, serviceFn) {
  const cid = resolveCid(req);
  logRequest(req, cid);

  try {
    const dto = req.dto || {};
    const result = await serviceFn({ ...dto, cid });
    return sendOk(res, cid, result);
  } catch (e) {
    return sendError(res, cid, e);
  }
}
```

-   **Sync 계열 엔드포인트의 공통 패턴을 캡슐화**한 함수
-   Handler는 serviceFn만 바꿔서 넘기면 된다.

------------------------------------------------------------------------

### 5-6. 실제 핸들러: syncFullHandler / syncUpdateHandler

``` js
export async function syncFullHandler(req, res) {
  return handleSync(req, res, syncFull);
}

export async function syncUpdateHandler(req, res) {
  return handleSync(req, res, syncUpdate);
}
```

-   **핸들러 자체에는 로직이 거의 없다.**
-   "어떤 서비스를 호출할지"만 결정하고 나머지는 `handleSync`에 위임

------------------------------------------------------------------------

## 6. 요약 시퀀스 (Full Sync 예시)

``` text
1) GET /land-price-index/sync/full?fromYm=&toYm=

2) router.js
   - parseSyncReq → syncFullHandler 체인 선택

3) mw.js(parseSyncReq)
   - fromYm / toYm 기본값 및 형식 검증
   - req.dto = { fromYm, toYm }

4) handler.js(syncFullHandler)
   - cid = resolveCid(req)
   - logRequest(req, cid) → PID.REQ_RECEIVED 로그
   - result = syncFull({ fromYm, toYm, cid })
   - sendOk(res, cid, result)

5) Service(syncFull)
   - 실제 동기화 / DB 병합 / PID 20, 21, 30, 90 로그 출력

6) Handler
   - sx_ret 포맷 JSON 응답
```

------------------------------------------------------------------------

## 7. 설계 핵심 정리

1.  **router.js**
    -   URL과 미들웨어·핸들러를 연결하는 역할만 수행\
    -   비즈니스 로직 없음
2.  **mw.js(parseSyncReq)**
    -   `/sync/*` 엔드포인트의 파라미터·기본값·형식 검증을 한 곳에서
        처리\
    -   이후 계층은 `req.dto`만 바라본다.
3.  **handler.js**
    -   CID 부여, 요청 수신 로그 생성, Service 호출, 응답 포맷 공통화\
    -   Service는 Express에 독립적인 로직으로 유지
4.  **logging 시스템과 자연스럽게 결합**
    -   PID.REQ_RECEIVED는 handler 레벨에서 한 번만 찍음\
    -   Service 레벨에서는 `PID.SYNC_START / SYNC_DONE` 등 비즈니스
        단계만 관리

------------------------------------------------------------------------

# END
