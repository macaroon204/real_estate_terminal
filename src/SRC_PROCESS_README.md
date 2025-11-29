# DATA_API --- API Process & SRC Structure Mapping

이 문서는 DATA_API 프로젝트의 **API 처리 프로세스**를\
`요청 → 처리 → 응답` 모델에 따라 설명하고,\
이를 실제 `src` 디렉터리의 코드 구조와 1:1로 매핑한다.

------------------------------------------------------------------------

## 0. 한 번의 요청이 지나가는 전체 경로

``` text
Client (curl / 프론트 / 다른 서버)
   ↓
[수신]
  bin/www                 # 포트 listen
  app.js                  # Express 앱 생성, 미들웨어/라우터 장착
   ↓
[식별 + 정형/구성]
  src/middlewares/setup.js             # 공통 미들웨어 (morgan, json 등)
   ↓
  src/routes/landPriceIndex/router.js  # URL로 기능 분기 (full / update)
   ↓
  src/routes/landPriceIndex/mw.js      # /sync 공통 파라미터 정형화·검증
   ↓
[기능 실행 + 결과 생성]
  src/routes/landPriceIndex/handler.js # 서비스 호출 + 결과 수신
   ↓
  src/services/landPriceIndex/full/syncFull.js
  src/services/landPriceIndex/update/syncUpdate.js
   ↓
  src/services/landPriceIndex/client.js     # 외부 R-ONE API
  src/services/landPriceIndex/update/db.js  # DB 조회/병합
   ↓
[해석 + 생성 + 전송]
  src/routes/landPriceIndex/handler.js      # 응답 포맷(sx_ret) 생성 + res.json()
   ↓
  (라우트 없음 시) src/middlewares/notFound.js  # 404 응답
```

------------------------------------------------------------------------

## 1. 요청 단계 --- 수신 · 식별 · 정형/구성

### 1-1. 수신: bin/www + app.js

**역할**\
네트워크에서 들어오는 HTTP 요청을 받아들일 준비를 하는 계층.

-   `bin/www`
    -   일반적인 Express 패턴으로 `app.listen(PORT)` 호출
    -   TCP 포트 오픈, HTTP 요청 수신 시작
-   `app.js`
    -   Express 인스턴스 생성
    -   설정/환경 로딩 (`src/config/env.js`, 로그 스펙 체크 등)
    -   전역 미들웨어/라우터/404 연결

요청은 여기서부터 `src` 내부 파이프라인으로 흘러 들어간다.

------------------------------------------------------------------------

### 1-2. 식별: routes --- 어떤 기능을 호출했는지 구분

**역할**\
URL/HTTP 메서드에 따라 **어느 기능 파이프라인으로 보낼지** 결정.

-   `src/routes/alive/router.js`

    ``` js
    router.get('/', getAlive);
    ```

    -   `GET /alive` → alive 핸들러

-   `src/routes/landPriceIndex/router.js`

    ``` js
    router.get('/sync/full',  parseSyncReq, syncFullHandler);
    router.get('/sync/update', parseSyncReq, syncUpdateHandler);
    ```

    -   `/land-price-index/sync/full` → FULL 동기화 파이프라인
    -   `/land-price-index/sync/update` → UPDATE 동기화 파이프라인

라우터는 **경로 매핑만 담당**하고 비즈니스 로직은 포함하지 않는다.

------------------------------------------------------------------------

### 1-3. 정형·구성: mw.js --- Request DTO 생성

**역할**\
클라이언트 입력을 **처리가 이해할 수 있는 Request 타입으로 변환**하고,\
형식 검증/기본값 설정까지 책임지는 계층.

-   파일: `src/routes/landPriceIndex/mw.js`

주요 함수:

``` js
function isValidYm(str) {
  return /^[0-9]{6}$/.test(str);  // YYYYMM 형식 체크
}

export function parseSyncReq(req, res, next) {
  let fromYm = req.query.fromYm ? String(req.query.fromYm) : '';
  let toYm   = req.query.toYm   ? String(req.query.toYm)   : '';

  // 기본값: fromYm = 200501, toYm = 전월
  // ...

  if (!isValidYm(fromYm) || !isValidYm(toYm)) {
    // BAD_REQUEST 응답 생성(400)
    // sx_ret 포맷으로 에러 반환
    return res.status(400).json(ret);
  }

  // ✅ 이후 계층에서 사용할 정규화된 DTO
  req.dto = { fromYm, toYm };
  return next();
}
```

이 단계 이후:

-   Handler/Service는 `req.dto`만 신뢰하면 되며,
-   잘못된 입력은 이 미들웨어에서 이미 걸러진다.

------------------------------------------------------------------------

## 2. 처리 단계 --- 기능 실행 · 결과 생성

### 2-1. 기능 실행: Service 레이어

**역할**\
정규화된 Request DTO를 받아 실제 도메인 로직(동기화)을 수행.

#### (1) FULL 동기화 --- `syncFull.js`

``` js
// src/services/landPriceIndex/full/syncFull.js

export async function syncFull({ fromYm, toYm, cid }) {
  const conn = await getConn();
  const startedAt = Date.now();

  try {
    const regions = await loadAllRegions(conn);
    const totalRegions = regions.length;

    logSyncStart({ cid, fromYm, toYm, totalRegions }); // PID 20

    for (const r of regions) {
      const rc = r.region_code;
      try {
        const result = await syncOneRegion(conn, { regionCode: rc, fromYm, toYm });
        // fetched/saved/성공·실패 집계
      } catch (err) {
        // 지역 단위 에러 처리 + logRegionError() (PID 21)
      }
    }

    const elapsedMs = Date.now() - startedAt;
    const summary = { /* 기간, 대상, fetched, saved, errorRegions, ext_status 등 */ };

    logSyncDone(summary); // PID 90
    return buildFullResponseFromSummary(summary);
  } finally {
    conn.release();
  }
}
```

보조 모듈:

-   `full/syncRegion.js`
    -   한 지역에 대한 외부 API 호출 + 시계열(JSON) 생성 +
        `sp_merge_land_price_index` 호출
-   `full/db.js` (또는 update/db.js 재사용)
    -   `getConn`, `loadAllRegions`, `mergeSeries` 등 DB 전담

------------------------------------------------------------------------

#### (2) UPDATE 동기화 --- `syncUpdate.js`

``` js
// src/services/landPriceIndex/update/syncUpdate.js

export async function syncUpdate({ cid, fromYm, toYm }) {
  const startTime = Date.now();
  const conn = await getConn();

  try {
    const regions   = await loadAllRegions(conn);
    const lastYmMap = await loadAllLastYm(conn); // region별 최종 ym

    logSyncStart({ cid, fromYm, toYm, totalRegions: regions.length }); // PID 20

    for (const r of regions) {
      const rc = r.region_code;

      try {
        const lastYm = lastYmMap.get(rc) ?? null;
        const effectiveFromYm = calcEffectiveFromYm(fromYm, lastYm);

        // 이미 최신이면 API 호출 생략
        if (effectiveFromYm > toYm) {
          successRegions++;
          continue;
        }

        const { rows, ext_status } = await fetchLandPriceIndex({
          fromYm: effectiveFromYm,
          toYm,
          regionCode: rc,
        });

        // rows → series 변환 + mergeSeries(conn, rc, seriesJson)
        // fetched/saved 집계
      } catch (err) {
        failRegions++;
        logRegionError({ cid, regionCode: rc, reason: String(err) }); // PID 21
      }
    }

    const elapsedMs = Date.now() - startTime;
    const summary = { /* 기간, 대상, fetched, saved, ext_status 등 */ };

    logSyncDone(summary); // PID 90
    return buildUpdateResponseFromSummary(summary);
  } finally {
    conn.release();
  }
}
```

보조 모듈:

-   `update/db.js`
    -   `getConn()` → 공통 DB 커넥션
    -   `loadAllRegions()` → region_base 전체 조회
    -   `loadAllLastYm()` → `land_price_index.series` JSON에서 마지막 ym
        뽑기
    -   `mergeSeries()` → 저장 프로시저 호출
-   UPDATE의 특징은 `loadAllLastYm()` + `effectiveFromYm` 계산으로\
    **각 지역마다 "필요한 구간만" 요청한다는 점**.

------------------------------------------------------------------------

#### (3) 외부 API 클라이언트 --- `client.js`

``` js
// src/services/landPriceIndex/client.js

export async function fetchLandPriceIndex({ fromYm, toYm, regionCode }) {
  // env.api.* 값으로 baseUrl, key, statblId 등 설정
  // 페이지 단위로 R-ONE API 호출
  // 응답을 { ym, index_value } 등으로 정리한 rows 배열로 반환
  // 실패 시 ext_status에 외부에러 코드 설정
  return { rows, ext_status };
}
```

Service는 이 함수만 호출하고,\
실제 HTTP/쿼리 파라미터/페이징 로직은 `client.js` 내부가 책임진다.

------------------------------------------------------------------------

### 2-2. 결과 생성: summary 객체

FULL/UPDATE 서비스의 마지막에는 항상 이런 구조의 summary가 나온다:

``` js
const summary = {
  cid,
  fromYm,
  toYm,
  totalRegions,
  successRegions,
  failRegions,
  fetched,    // 가져온 건수 합
  saved,      // 실제 저장된 지역 수
  errorRegions, // FULL에서 사용 (UPDATE는 빈 배열)
  elapsedMs,
  ext_status,
};
```

-   이 summary는
    -   `loggerBase.js` / `logger.js`에서 SYNC_DONE 로그의 buffer로
        쓰이고
    -   Handler에서 HTTP 응답용 DTO로 변환할 때 재사용된다.

------------------------------------------------------------------------

## 3. 응답 단계 --- 해석 · 생성 · 전송

### 3-1. 해석 + 생성: handler.js

**역할**\
Service 결과와 내부 상태를 바탕으로,\
**외부와 약속한 응답 구조(sx_ret)**를 만드는 계층.

파일: `src/routes/landPriceIndex/handler.js`

핵심 흐름:

1.  **CID 결정**

    ``` js
    function resolveCid(req) {
      const headerCid = req.headers['x-cid'] || req.headers['X-CID'];
      return headerCid ? String(headerCid) : String(Date.now());
    }
    ```

2.  **요청 수신 로그 (PID 0)**

    ``` js
    function logRequest(req, cid) {
      const reqRet = get_req_url(req); // src_ip, src_port, path 추출

      console.log(
        '[LOG]',
        createLog({
          pid: PID.REQ_RECEIVED,
          cid,
          buffer: {
            path:   reqRet.buffer?.dest_url_path,
            src_ip: reqRet.buffer?.src_ip,
            src_port: reqRet.buffer?.src_port,
            method: req.method,
            fromYm: req.dto?.fromYm,
            toYm:   req.dto?.toYm,
          },
        }),
      );
    }
    ```

3.  **서비스 호출 + 공통 처리 래퍼**

    ``` js
    async function handleSync(req, res, serviceFn) {
      const cid = resolveCid(req);
      logRequest(req, cid);

      try {
        const dto    = req.dto || {};
        const result = await serviceFn({ ...dto, cid }); // FULL or UPDATE
        return sendOk(res, cid, result);
      } catch (e) {
        return sendError(res, cid, e);
      }
    }

    export async function syncFullHandler(req, res) {
      return handleSync(req, res, syncFull);
    }

    export async function syncUpdateHandler(req, res) {
      return handleSync(req, res, syncUpdate);
    }
    ```

4.  **성공 응답 생성 (sx_ret 포맷)**

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

      return res.json(ret);  // ← 실제 전송
    }
    ```

5.  **에러 응답 생성**

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

이렇게 Handler는:

-   Service가 만든 summary를 **클라이언트용 응답 DTO(sx_ret)**로 바꾸고,
-   HTTP status + JSON 응답 전송까지 책임진다.

------------------------------------------------------------------------

### 3-2. 전송 + 404 처리: notFound

-   정상 플로우: handler의 `res.json(ret)` / `res.status(500).json(ret)`
-   라우트 미매칭: `src/middlewares/notFound.js`

``` js
export function notFound(req, res) {
  const ret = my_lib.get_req_url(req);
  console.error('[ERROR-404]', ret);
  return res.status(404).json(ret);
}
```

모든 응답은 **공통 포맷(sx_ret 호환 구조)** 로 내려오므로,\
클라이언트 입장에서는 성공/실패/404를 한 가지 패턴으로 처리할 수 있다.

------------------------------------------------------------------------

## 4. 모델 vs 코드 최종 매핑

  ------------------------------------------------------------------------
  모델 단계              실 코드 계층 / 파일
  ---------------------- -------------------------------------------------
  **수신**               `bin/www`, `app.js`

  **식별**               `src/routes/alive/router.js`,
                         `src/routes/landPriceIndex/router.js`

  **정형·구성**          `src/middlewares/setup.js` (공통),
                         `src/routes/landPriceIndex/mw.js`
                         (`parseSyncReq`)

  **기능 실행**          `src/services/landPriceIndex/full/syncFull.js`,
                         `update/syncUpdate.js` + `client.js`,
                         `update/db.js`

  **결과 생성**          각 Service의 `summary` 생성 부분

  **해석**               `src/routes/landPriceIndex/handler.js`
                         (`handleSync`, status 결정)

  **생성**               Handler의 `sendOk` / `sendError` (sx_ret 응답
                         객체 구성)

  **전송**               `res.status(...).json(ret)`,
                         `src/middlewares/notFound.js`
  ------------------------------------------------------------------------

------------------------------------------------------------------------

# END
