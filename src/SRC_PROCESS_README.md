# SRC 전체 프로세스 구조 정리 (개념 + 코드 매핑)


> **요청 → 처리 → 응답**
> (요청: 수신–식별–정형·구성 / 처리: 기능 실행–결과 생성 / 응답: 해석–생성–전송)

이걸 그대로 이 프로젝트의 API 서버에 대입해서 정리해보면:

---

## 0. 전체 큰 그림 – SRC 구조를 “계층”으로 보면

SRC 쪽은 개념적으로 이렇게 4개의 레이어로 나눌 수 있어:

1. **입구 레이어 (요청 쪽)**

   * 네트워크에서 온 HTTP 요청을 받음
   * “이게 어떤 요청인지” 판단 + 표준화된 형태로 바꿔줌
   * *중심 개념: 수신 · 식별 · 정형/구성*

2. **도메인 레이어 (처리 쪽)**

   * “무슨 작업을 할지”에 대한 비즈니스 로직
   * 외부 API 호출, DB 저장/병합, 성능/오류 관리
   * *중심 개념: 기능 실행 · 결과 생성*

3. **출구 레이어 (응답 쪽)**

   * 처리 결과를 “외부와 약속한 응답 포맷”으로 변환
   * HTTP 상태코드, 바디 구조, 에러 표현 정리
   * *중심 개념: 해석 · 생성 · 전송*

4. **공통 인프라 레이어 (세 레이어를 가로지르는 것들)**

   * Config(env), Logging, DB 커넥션, 공통 유틸
   * 어느 단계에서나 필요하지만, 비즈니스와는 분리된 인프라

이제 이걸 네 모델의 단계랑 1:1로 맞춰 보자.

---

## 1. 요청(요청자가 보낸 HTTP 요청을 “처리 가능한 요청”으로 바꾸는 단계)

### 1-1. **수신** – “요청이 들어왔다”를 시스템이 인지하는 단계

**개념적으로 하는 일**

1. HTTP 포트 열고 listen
2. 외부 클라이언트(curl, 프론트, 다른 서버)가 네트워크로 보낸 요청을 소켓에서 수신
3. “이건 어떤 메서드/URL/헤더/바디/쿠키를 가진 요청이다” 라는 형태로 추상화

**이 프로젝트 기준**

* Express 앱이 포트를 열고 클라이언트의 HTTP 요청을 받는 부분
* 아직 “이건 무슨 기능을 하는 요청이다”는 모른다.
  그냥 “GET /land-price-index/sync/full?fromYm=…&toYm=…” 라는 **원시 요청**일 뿐.

**포인트**

* **네트워크/프로토콜 관점에서의 수신**에 집중
* 비즈니스랑 완전히 분리된 레벨

---

### 1-2. **식별** – “어떤 대상(Target)과 어떤 행위(Operation)을 요청했는가?”

**개념적으로 하는 일**

1. URL/HTTP Method를 기반으로

   * “토지가격지수 기능인가?”
   * “전체 동기화인가(full) / 증분 동기화인가(update)?” 를 판별
2. 이 요청을 **어느 파이프라인**으로 보낼지 결정

   * 예: “/land-price-index/sync/full → landPriceIndex Full Sync 파이프라인”

**이 프로젝트 기준**

* 라우터 계층이 하는 역할
* 요청 하나가 다음과 같이 분류됨:

  * `/alive` → 헬스체크 파이프라인
  * `/land-price-index/sync/full` → “토지가격지수 · 전체 동기화” 파이프라인
  * `/land-price-index/sync/update` → “토지가격지수 · 증분 동기화” 파이프라인
* 아직 파라미터 검증이나 비즈니스는 들어가지 않고,
  **“어디로 보내야 할지”만 결정**하는 단계

**포인트**

* 이 단계의 관심사는 **“라우팅”**
* 비즈니스 진입 전, 파이프라인 선택용 스위치 같은 느낌

---

### 1-3. **정형·구성** – 처리기가 이해할 수 있는 Request 타입으로 변환

**개념적으로 하는 일**

1. 클라이언트가 보낸 다양한 입력 형태:

   * query string (`fromYm`, `toYm`)
   * headers (`X-CID`, auth, 등)
   * body(JSON)
   * path params

2. 이걸 **서버 내부에서 쓰기 좋은 “요청 DTO” 구조로 정리**

3. 동시에 유효성 검증까지 수행:

   * 값이 존재하는지?
   * 포맷(YYYYMM)이 맞는지?
   * 범위가 말이 되는지?

4. 검증 실패 시:

   * 이 단계에서 바로 **에러 응답(400)** 생성하고 종료
   * 뒤에 복잡한 서비스 로직은 아예 들어오지 못하게 막음

**이 프로젝트 기준**

* “/sync” 계열 요청에 대해서:

  * `fromYm`, `toYm`을 문자열로 정리
  * 없을 경우 기본값 채움 (`fromYm = 200501`, `toYm = 전월`)
  * YYYYMM 포맷인지 정규식으로 체크
  * 최종적으로 `req.dto = { fromYm, toYm }` 같은 **정규화된 DTO**로 설정
* 이후 레이어(핸들러·서비스)는 `req.dto`만 신뢰하면 됨

**포인트**

* 이 단계가 **“입력에 대한 모든 방어 로직”**을 담당하면,
  뒤에 나오는 비즈니스 로직은 “깨끗한 입력”만 다룰 수 있어서 깔끔해진다.
* 네가 말한 “처리가 이해할 수 있는 Request 타입으로 변환”이 정확히 이 역할.

---

## 2. 처리(실제 기능을 수행해서 “처리 결과”를 만드는 단계)

요청 과정에서 **“이건 전체 동기화 요청이고, fromYm/toYm은 OOO이다”** 같은 형태로 정리되면, 이제부터는 **“그 일을 직접 해내는 계층”**이다.

### 2-1. **기능 실행** – Target/Operation을 실제 수행

**개념적으로 하는 일**

1. 위에서 정리된 Request 타입(예: `{ fromYm, toYm, cid }`)을 받아서:
2. 내부 비즈니스 로직 구성 요소들 호출:

   * 외부 API 클라이언트
   * DB 조회/저장/병합
   * 도메인 규칙(지수 계산 / 증분 판단 등)
3. 여러 하위 작업들을 **“한 번의 동기화”라는 큰 시나리오로 오케스트레이션**

**이 프로젝트 기준 – 예: FULL Sync**

* “전체 지역 목록을 가져온다”
* 각 지역에 대해:

  * 외부 API에서 해당 기간의 지수를 가져옴
  * 월별 index 값들을 시계열 배열로 만든다
  * `change_rate` 계산 로직을 적용
  * `sp_merge_land_price_index`를 통해 DB에 병합
* 이 모든 과정에서:

  * 어떤 지역에서 실패했는지
  * 얼마나 오래 걸렸는지
  * 몇 건을 가져오고 저장했는지
    등을 계속 누적/기록

**이 프로젝트 기준 – 예: UPDATE Sync**

* 먼저 DB에서 **각 지역별 마지막 월(lastYm)** 을 조회
* 각 지역마다 “이 지역은 어디까지 들어있나?”를 확인하고:

  * 이미 최신이면 아무 것도 안 함
  * 부족한 구간만 API에 요청
* 이후 시계열 구성/병합은 FULL과 비슷하지만
  **요청 범위를 “필요한 부분만”으로 줄이는** 로직이 핵심

**포인트**

* 이 레이어는 이미 “검증된 · 정제된 입력”을 받기 때문에
  **오롯이 도메인 로직에 집중**할 수 있다.
* “외부 API를 어떻게 부를까?”, “DB에 어떻게 저장할까?”, “성능/장애를 어떻게 다룰까?”가 주 관심사.

---

### 2-2. **결과 생성** – 기능 실행 결과(처리 값)를 만드는 단계

**개념적으로 하는 일**

1. 위의 기능 실행 과정에서 발생한 다양한 상태·통계를 정리해서
   **“요청자에게 의미 있는 결과 구조”**를 만든다.
2. 예:

   * 기간 정보 (어떤 기간을 동기화했나?)
   * 대상 정보 (총 몇 지역, 그중 몇 개 성공/실패?)
   * 데이터 건수 (얼마나 가져왔나, 얼마나 저장됐나?)
   * 오류 리스트 (어떤 지역에서 실패했나?)
3. 이 구조는 나중에 “응답 생성” 단계에서 바로 사용할 수 있게 설계됨.

**이 프로젝트 기준**

* FULL/UPDATE 둘 다 **summary 객체**를 만든다 (개념적으로):

  ```ts
  {
    period: { fromYm, toYm },
    target: { totalRegions, successRegions, failRegions },
    fetched,    // 외부 API에서 가져온 row 수
    saved,      // DB에 실제 write된 지역 수
    errorRegions, // (FULL에서) 실패 지역 목록
    ext_status, // 외부 API 전반 상태(OK/HTTP_FAIL 등)
    elapsedMs,  // 전체 수행 시간
  }
  ```

* 이 summary는:

  * **로그 요약(SYNC_DONE 로그)** 에 쓰이고
  * **핸들러에서 HTTP 응답 바디로 변환할 때**도 그대로 활용됨

**포인트**

* 이 단계에서 **“숫자/상태/리스트” 같은 가공된 결과**만 준비하고,
  아직 HTTP 포맷(JSON 응답)으로 만들진 않는다.
* 즉, “서비스 결과”와 “HTTP 응답”을 분리해둔 구조.

---

## 3. 응답(처리 결과를 외부가 이해할 수 있는 응답으로 바꾸는 단계)

이제 도메인 서비스가 만든 summary(결과)를 가지고,
**“API 계약에 맞는 HTTP 응답”**을 만드는 부분이다.

### 3-1. **해석** – 처리 결과를 외부 관점에서 의미 있는 정보로 해석

**개념적으로 하는 일**

1. 서비스 결과(summary)를 보고:

   * 이게 성공인가? 실패인가?
   * 부분 성공/부분 실패라면 어떻게 표현할까?
   * 어떤 HTTP status를 써야 할까? (200, 400, 500 등)
2. “이 결과를 클라이언트가 어떻게 이해하면 좋을까?”라는 관점에서
   의미 있는 필드만 추려내거나, 구조를 재조합

**이 프로젝트 기준**

* Handler에서:

  * Service가 던져준 `{ period, target, fetched, saved, errorRegions, ext_status }`를 보고
  * 내부 status → HTTP status로 매핑:

    * 내부 자체 에러(예외) → 500
    * 파라미터 잘못 → 이미 앞단 미들웨어에서 400 처리
    * 그 외 정상 → 200
  * 로그 관점에서:

    * summary 기반으로 SYNC_DONE 로그에 `elapsedMs`, `target`, `fetched`, `errorRegions` 등을 넣어
      **운영자가 문제를 바로 파악할 수 있는 관점**으로 재구성

**포인트**

* 처리 결과를 **“시스템 내부 입장”에서 보는 것이 아니라**,
  **“요청을 보낸 쪽의 입장”에서 다시 정리**하는 단계라는 게 중요하다.

---

### 3-2. **생성** – 외부와 약속된 응답 형태로 구조화

**개념적으로 하는 일**

* 최종적으로 반환할 **DTO(응답 타입)를 정의**하고,
  거기에 값들을 채워 넣는다.
* 이 프로젝트의 약속은:

  * 항상 공통 응답 그릇(`sid`, `pid`, `cid`, `value1`, `value2`, `buffer`) 구조를 유지
  * 실제 비즈니스 결과는 `buffer` 안에 들어간다.

**이 프로젝트 기준**

* Handler의 `sendOk()` 가 대표적 예:

  * 내부 상태 코드 → `value1`
  * 외부 API 전반 상태 → `value2`
  * `buffer` 에:

    * `period`, `target`, `fetched`, `saved`, `errorRegions` 등을 넣어서
      클라이언트가 보기 좋은 구조로 포장
* 에러일 때는 `sendError()` 형식으로:

  * `value1 = INTERNAL_ERROR`
  * `buffer.msg = 'sync failed'`
    등으로 규격화된 에러 응답 생성

**포인트**

* “응답 생성” 단계에서 **API 계약(JSON 스키마)** 가 구체화된다.
* 서비스 쪽이 바뀌어도, 이 레이어가 “겉모습”을 유지해 주기 때문에
  클라이언트 입장에서는 안정적인 인터페이스를 보장받게 된다.

---

### 3-3. **전송** – 생성된 응답을 외부로 내보냄

**개념적으로 하는 일**

* 앞에서 만든 응답 객체를 실제 HTTP 응답으로 전송

  * `res.status(code).json(ret)`
* 네트워크 관점에서는:

  * 소켓에 바이트 스트림으로 write
  * 연결 관리(keep-alive, 종료 등)

**이 프로젝트 기준**

* Handler 마지막 줄에서:

  * 성공: `return res.json(ret);`
  * 실패: `return res.status(500).json(ret);`
* notFound 같은 전역 미들웨어도 마찬가지로
  공통 포맷으로 404 응답을 만들어 전송

**포인트**

* 이 단계는 “개념적으로는 단순”하지만,
  실제 운영에선 **타임아웃, 헤더, CORS, gzip 등**이 다 여기 얹히게 된다.
* 현재 프로젝트에선 최대한 단순하게 유지해서
  도메인 로직과 응답 전송을 분리하는 방향으로 설계되어 있음.

---

## 4. 공통 인프라(전 단계에 걸쳐 작동하는 것들)

네 모델엔 직접 쓰진 않았지만, 실제 SRC 전체를 보면
모든 단계에 **간접적으로 영향을 주는 레이어**들이 있다.

### 4-1. Config

* `.env` → `env.js` 로 한 번만 읽고 구조화
* DB/외부 API/로그 레벨 등 모든 설정값들의 단일 출처
* 어떤 단계에서든 **직접 `process.env` 를 보지 않고, `env` 객체만 사용**
  → 설정 변경/검증/로그 출력이 중앙화됨.

### 4-2. DB Layer

* `config/db.js`에서 Pool 및 `query()/getConnection()` 제공
* 서비스에서 트랜잭션이나 쿼리 실행할 때 사용하는 공통 접점
* FULL/UPDATE 둘 다 이 레이어를 통해 DB와 통신

### 4-3. Logging

* `log_spec.js` / `my_lib.js` / `loggerBase.js`
* 요청 수신, 동기화 시작/종료, 지역 단위 에러 등
  **모든 주요 이벤트를 동일한 포맷으로 로그**
* Handler/Service 수준에서 pid/sid/cid/value1/value2/buffer를 헷갈리지 않고 쓸 수 있게 해 줌.

---

## 5. 정리 – 네 모델과 SRC 구조의 1차 매핑 (개념만)

모델의 각 박스를 SRC 구조에 개념적으로 매핑하면:

| 모델 단계 | SRC 개념 레이어                                    |
| ----- | --------------------------------------------- |
| 수신    | Express 서버(포트 listen, HTTP 수신)                |
| 식별    | Router – URL/메서드 기준으로 파이프라인 선택                |
| 정형·구성 | 파라미터 검증/DTO 생성 미들웨어(요청 DTO 만들기)               |
| 기능 실행 | Service 레이어 – FULL/UPDATE 동기화 시나리오 실행         |
| 결과 생성 | Service 레이어 – summary 구조 생성, 통계/상태 정리         |
| 해석    | Handler – summary를 보고 성공/실패, status 결정        |
| 생성    | Handler – 공통 응답 포맷(sx_ret)로 JSON 구성           |
| 전송    | Handler/미들웨어 – `res.status().json()` 으로 실제 전송 |

지금은 **이 표처럼 “개념 레벨”까지만 맞춘 상태**고,
다음 단계에서 네가 말한 것처럼:

> “모델링과 대응되는 코드를 중심으로”
> → 각 단계별로 실제 어떤 파일/함수들이 있는지,
> `src` 아래 구조랑 1:1 매핑해서 보여주면 된다.

그때는 이 구조를 기반으로:

* “수신 = app.js / www에서 Express 세팅 코드”
* “식별 = src/routes/.../router.js”
* “정형·구성 = src/routes/.../mw.js”
* “기능 실행·결과 생성 = src/services/...”
* “해석·생성·전송 = src/routes/.../handler.js + middlewares/notFound.js”

이렇게 구체적으로 매 달아주면, **모델 ↔ 실제 코드 맵**이 완성될 거야.

원하면 다음 턴에서 바로 “코드 대응 버전”으로 이어서 해줄게.

---

---

좋아, 이제 **“코드랑 1:1로 매핑된 버전”** 간다.
방금까지 만든 개념 단계(수신 → 식별 → 정형/구성 → 기능 실행 → 결과 생성 → 해석 → 생성 → 전송)를 기준으로,
**SRC 아래 실제 파일/함수들이 어디에 해당하는지**를 단계별로 꽉 채워서 설명할게.

---

## 0. SRC 전체 프로세스 – 코드 기준으로 다시 그리기

먼저, “한 번의 FULL / UPDATE 요청”이 SRC 내부에서 어떻게 흐르는지
**코드 파일 이름 기준**으로 크게 그리면 이렇게 된다:

```text
[수신]
  bin/www (포트 Listen)
      ↓
  app.js (Express 앱 생성 + 전역 미들웨어 + 라우터 장착)

[식별 + 정형/구성]
      ↓
  src/middlewares/setup.js (morgan, json parser, cookie parser)
      ↓
  src/routes/landPriceIndex/router.js      ← URL 로 기능 분리 (full / update)
      ↓
  src/routes/landPriceIndex/mw.js          ← 쿼리 파라미터 정형화

[기능 실행 + 결과 생성]
      ↓
  src/routes/landPriceIndex/handler.js     ← 서비스 호출 진입점
      ↓
  src/services/landPriceIndex/full/syncFull.js
  src/services/landPriceIndex/update/syncUpdate.js
      ↓
  src/services/landPriceIndex/client.js    ← 외부 API
  src/services/landPriceIndex/update/db.js ← DB 조회/병합
  ( + syncRegion.js / loggerBase.js / logger.js )

[해석 + 생성 + 전송]
      ↓
  src/routes/landPriceIndex/handler.js     ← 응답 포맷(sx_ret) 생성 + res.json()
      ↓
  (라우트 없을 땐) src/middlewares/notFound.js
```

이제 이 흐름을 네가 만든 모델의 각 단계에 맞춰,
**“어떤 파일의 어떤 코드가 그 역할을 담당하는지”** 단계별로 보자.

---

## 1. 요청 단계 – 수신 / 식별 / 정형·구성

### 1-1. 수신: `bin/www` + `app.js`

**역할 요약**

> “외부 요청이 네트워크를 통해 들어왔다는 사실을 시스템이 인지하는 단계”

* **`bin/www`**

  * Node 서버가 실제로 `app.listen(PORT, ...)` 하는 곳(일반적인 Express 패턴)
  * TCP 포트 열고 HTTP 요청을 수신
* **`app.js`**

  ```js
  import './src/config/env.js';
  import { runLogSpecChecks } from './src/libs/log_spec_check.js';
  import express from 'express';

  import { applyAppSetup } from './src/middlewares/setup.js';
  import { notFound } from './src/middlewares/notFound.js';

  import aliveRouter from './src/routes/alive/router.js';
  import landPriceIndexRouter from './src/routes/landPriceIndex/router.js';

  const app = express();

  applyAppSetup(app);          // 전역 미들웨어
  app.use('/alive', aliveRouter);
  app.use('/land-price-index', landPriceIndexRouter);
  app.use(notFound);           // 404 처리

  export default app;
  ```

  * Express 인스턴스를 만들고
  * **전역 미들웨어 + 라우터 + 404 미들웨어**를 연결
  * 여기까지가 “요청이 들어올 준비를 끝낸 상태”

> 이 레이어에서는 아직 “어떤 기능을 요청했는지”는 신경 안 쓰고,
> **그냥 HTTP 서버를 열어두고 받을 준비를 하는 역할**이다.

---

### 1-2. 식별: `routes` – 어떤 기능이 호출됐는지 라우팅

**역할 요약**

> “어떤 Target / Operation 을 요청했는지 구분하는 단계”

#### (1) Alive 라우터 예시 – `src/routes/alive/router.js`

```js
import { Router } from 'express';
import * as h from './handler.js';

const router = Router();
router.get('/', h.getAlive);
export default router;
```

* `GET /alive` 요청이 들어오면 → `getAlive` 핸들러로 보내는 역할만 한다.

#### (2) landPriceIndex 라우터 – `src/routes/landPriceIndex/router.js` (구조)

컨셉은 alive와 같고, 동기화용 두 엔드포인트를 분리:

```js
const router = Router();

// FULL 동기화
router.get('/sync/full',  parseSyncReq, syncFullHandler);

// UPDATE 동기화
router.get('/sync/update', parseSyncReq, syncUpdateHandler);

export default router;
```

* 여기서 **“/sync/full vs /sync/update”를 구분**해서
  두 개의 서로 다른 서비스 파이프라인으로 분기한다.
* 라우터에는 비즈니스 로직이 없고,
  **“길 안내” 역할만 맡기도록 설계**되어 있다.

---

### 1-3. 정형·구성: `mw.js` – Request DTO 만드는 단계

**역할 요약**

> “라우트별로 필요한 파라미터를 정리/검증하고,
> 처리기가 이해하는 형태(Request 타입)로 변환하는 단계”

파일: `src/routes/landPriceIndex/mw.js`

#### (1) YYYYMM 형식 검증

```js
function isValidYm(str) {
  return /^[0-9]{6}$/.test(str);
}
```

* 단순하지만, “문자 6자리 숫자”가 아니면 바로 컷.

#### (2) `parseSyncReq` – FULL/UPDATE 공통 미들웨어

```js
export function parseSyncReq(req, res, next) {
  try {
    let fromYm = req.query.fromYm ? String(req.query.fromYm) : '';
    let toYm   = req.query.toYm   ? String(req.query.toYm)   : '';

    // 기본값 계산 (전월, 200501 등)
    // ...

    // 형식 검증 실패 → 여기서 바로 400
    if (!isValidYm(fromYm) || !isValidYm(toYm)) {
      const ret = sx_ret__create(0, 0);
      ret.value1 = INTERNAL_STATUS.BAD_REQUEST;
      ret.value2 = EXTERNAL_STATUS.OK;

      sx_ret__write_data(ret, { msg: 'bad ym format', fromYm, toYm });
      return res.status(400).json(ret);
    }

    // ✅ Handler/Service가 사용할 DTO
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

**이 코드가 하는 핵심 일**

1. **입력 파싱**: `req.query`에서 `fromYm`, `toYm` 꺼내기
2. **기본값 설정**: 값이 없으면 `fromYm=200501`, `toYm=전월` 등으로 채움
3. **형식 검증**: YYYYMM 아니면 바로 400 응답 리턴 → 뒤로 안 보냄
4. **정규화**: `req.dto = { fromYm, toYm }` – 이후 계층에서 **이것만 신뢰**

> 즉, 이 단계 끝나고 나면 Service는
> “반드시 유효한 형태의 `{ fromYm, toYm }`를 받는다”라고 가정할 수 있게 된다.

---

## 2. 처리 단계 – 기능 실행 / 결과 생성

### 2-1. 기능 실행: Service 레이어

**역할 요약**

> “정규화된 Request DTO를 받아 실제 비즈니스 로직을 실행하는 단계”

여기서 핵심은 **FULL**과 **UPDATE** 두 서비스다.

---

#### (1) FULL 동기화 – `src/services/landPriceIndex/full/syncFull.js`

```js
import { getConn, loadAllRegions } from './db.js';
import { syncOneRegion } from './syncRegion.js';
import { logSyncStart, logSyncDone, logRegionError } from './logger.js';
import { EXTERNAL_STATUS } from '../../../libs/log_spec.js';

export async function syncFull({ fromYm, toYm, cid }) {
  const conn = await getConn();
  const startedAt = Date.now();

  try {
    const regions = await loadAllRegions(conn);
    const totalRegions = regions.length;

    logSyncStart({ cid, fromYm, toYm, totalRegions });

    // 지역 루프 돌면서 각 지역 처리
    for (const r of regions) {
      const rc = r.region_code;
      try {
        const result = await syncOneRegion(conn, { regionCode: rc, fromYm, toYm });
        // fetched / saved / 성공/실패 집계
      } catch (err) {
        // 지역 단위 에러 처리 + logRegionError()
      }
    }

    const elapsedMs = Date.now() - startedAt;
    const summary = { /* 기간 / 대상 / fetched / saved / 등등 */ };

    logSyncDone(summary);
    return buildFullResponseFromSummary(summary);
  } finally {
    conn.release();
  }
}
```

* `getConn()` / `loadAllRegions()` 은 `update/db.js` 쪽에 구현됨.
* `syncOneRegion()` 은 `syncRegion.js`에서 **한 지역에 대한 전체 처리** 담당.
* 이 함수는 “한 번의 FULL 동기화”라는 **큰 기능의 오케스트레이터** 역할.

---

#### (2) UPDATE 동기화 – `src/services/landPriceIndex/update/syncUpdate.js`

```js
import { fetchLandPriceIndex } from '../client.js';
import {
  getConn,
  loadAllRegions,
  loadAllLastYm,
  mergeSeries,
} from './db.js';
import { logSyncStart, logSyncDone, logRegionError } from './logger.js';

export async function syncUpdate({ cid, fromYm, toYm }) {
  const startTime = Date.now();
  const conn = await getConn();

  try {
    const regions = await loadAllRegions(conn);
    const lastYmMap = await loadAllLastYm(conn);

    logSyncStart({ cid, fromYm, toYm, totalRegions: regions.length });

    for (const r of regions) {
      const rc = r.region_code;
      try {
        const lastYm = lastYmMap.get(rc) ?? null;

        // ⬇️ 각 지역의 실제 시작월 계산
        const effectiveFromYm = calcEffectiveFromYm(fromYm, lastYm);

        // 이미 최신이면 continue
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
        logRegionError({ cid, regionCode: rc, reason: String(err) });
      }
    }

    const elapsedMs = Date.now() - startTime;
    const summary = { /* 기간 / 대상 / fetched / saved / ext_status ... */ };

    logSyncDone(summary);
    return buildUpdateResponseFromSummary(summary);
  } finally {
    conn.release();
  }
}
```

* 여기서는 추가로 `loadAllLastYm()` 을 이용해 **증분 범위 계산**을 한다.
* 핵심 차이:

  * FULL: 항상 `(fromYm ~ toYm)` 전체 호출
  * UPDATE: 각 지역별 `(lastYm+1 ~ toYm)` 만 호출

---

#### (3) 외부 API 클라이언트 – `src/services/landPriceIndex/client.js`

```js
import axios from 'axios';
import { env } from '../../config/env.js';

const BASE = env.api.baseUrl;

export async function fetchLandPriceIndex({ fromYm, toYm, regionCode }) {
  let all = [];
  let ext_status = 0;
  let pIndex = 1;

  try {
    while (true) {
      const res = await axios.get(BASE, { params: { /* 키, 기간, 지역, 페이지 */ } });
      const rows = normalizeRows(res.data); // ym/index_value 로 정돈
      all = all.concat(rows);

      if (rows.length < pSize) break;
      pIndex++;
    }
  } catch (err) {
    console.error('[R-ONE ERROR]', err?.message || err);
    ext_status = -2; // HTTP_ERROR 등
  }

  return { rows: all, ext_status };
}
```

* **처리 단계 내부에서 “외부 자원(DB가 아닌 API)”을 다루는 하위 모듈**
* Service는 이 함수를 통해서만 R-ONE API를 사용.

---

#### (4) DB 접근 – `src/services/landPriceIndex/update/db.js`

```js
import { getConnection } from '../../../config/db.js';

export async function getConn() {
  return await getConnection();
}

export async function loadAllRegions(conn) {
  return await conn.query(
    `SELECT region_code FROM region_base ORDER BY region_code`,
  );
}

export async function loadAllLastYm(conn) {
  const rows = await conn.query(`
    SELECT region_code,
           JSON_UNQUOTE(JSON_EXTRACT(series, '$[last].ym')) AS lastYm
    FROM land_price_index
  `);

  const map = new Map();
  for (const row of rows) {
    if (row.lastYm != null) map.set(row.region_code, row.lastYm);
  }
  return map;
}

export async function mergeSeries(conn, regionCode, seriesJson) {
  await conn.query(`CALL sp_merge_land_price_index(?, ?)`, [
    regionCode,
    seriesJson,
  ]);
}
```

* FULL/UPDATE 둘 다 이 DB 모듈을 사용
* **처리 단계에서 DB를 직접 만지지 않고**, 항상 이 모듈을 통해 수행 → 역할 분리.

---

#### (5) 로그 – `loggerBase.js` + `logger.js`

```js
// loggerBase.js
import { SID, PID, INTERNAL_STATUS, EXTERNAL_STATUS, createLog } from '../../libs/log_spec.js';

export function logSyncStartBase({ cid, fromYm, toYm, totalRegions, mode }) {
  console.log(
    '[SYNC-START]',
    createLog({
      pid: PID.SYNC_START,
      cid,
      buffer: { mode, fromYm, toYm, totalRegions },
    }),
  );
}
```

* 서비스 단계에서 **동기화 시작/종료/지역 에러**를 공통 포맷으로 남기는 역할
* FULL/UPDATE용 `logger.js`는 `mode: 'full' / 'update'` 정도만 바꿔서 사용

---

### 2-2. 결과 생성: summary → 응답용 DTO

서비스 끝부분에서 공통적으로 이런 형태의 객체를 만든다:

```js
return {
  period: { fromYm, toYm },
  target: { totalRegions, successRegions, failRegions },
  fetched,
  saved,
  errorRegions, // UPDATE에서는 []
  ext_status,
};
```

* 이게 바로 **“처리 결과(도메인 결과)”**이고,
* 다음 응답 단계에서 이 구조를 기반으로

  * 로그 요약(SYNC_DONE)
  * HTTP 응답 buffer
    를 만들어 낸다.

---

## 3. 응답 단계 – 해석 / 생성 / 전송

### 3-1. 해석 + 생성: `src/routes/landPriceIndex/handler.js`

**역할 요약**

> 서비스 결과를 보고 성공/실패를 판단하고,
> 공통 응답(sx_ret) 구조로 변환하는 단계

핸들러의 기본 패턴(설계 기준)은 다음과 같다:

1. **CID 결정** (X-CID 헤더 우선, 없다면 timestamp)
2. **요청 수신 로그** (PID.REQ_RECEIVED) 찍기
3. Service(syncFull / syncUpdate) 호출
4. summary 결과를 sx_ret 응답으로 포장 (`sendOk`)
5. 에러 발생 시(`catch`) → `sendError`로 500 응답 + 에러 로그

이런 형태:

```js
export async function syncFullHandler(req, res) {
  return handleSync(req, res, syncFull);
}

export async function syncUpdateHandler(req, res) {
  return handleSync(req, res, syncUpdate);
}
```

`handleSync` 내부에서:

* `resolveCid(req)` 로 cid 생성
* `logRequest(req, cid)` 로 REQ 로그 출력
* `serviceFn({ ...req.dto, cid })` 실행
* 결과 summary → `sendOk(res, cid, result)` 로 sx_ret 응답

> 즉, Handler는 “요청/응답 레이어”에 딱 맞는 책임만 가진다.
> 서비스는 HTTP를 몰라도 되고, Handler는 DB/외부 API를 모르도록 설계.

---

### 3-2. 전송: `res.json()` / `res.status().json()`

* Handler의 `sendOk` / `sendError` / 미들웨어의 400/500/404 처리에서
  마지막 줄은 항상 이런 형태:

```js
return res.status(200).json(ret);
// 또는
return res.status(400).json(ret);
```

* `ret`는 항상 `my_lib.sx_ret__create` + `sx_ret__write_data`로 만든 공통 포맷

  * `sid`, `pid`, `cid`, `value1`, `value2`, `bufflen`, `buffer`

### 3-3. 404 처리: `src/middlewares/notFound.js`

```js
import * as my_lib from '../libs/my_lib.js';

export function notFound(req, res) {
  const ret = my_lib.get_req_url(req);
  console.error("[ERROR-404] status = [", 404, "], ret = ", ret);
  return res.status(404).json(ret);
}
```

* 어떤 라우터에도 매칭되지 않은 요청은 이 미들웨어에서
  **공통 포맷으로 404 응답**을 만들고 전송.
* 이때도 `get_req_url`을 사용해서

  * src_ip / src_port / dest_url_path 등을 buffer에 담음.

---

## 4. 네 모델 vs 실제 코드 최종 매핑 표

마지막으로, 네가 정리한 **API 프로세스 모델**과
**실제 SRC 구조**를 한 표로 정리해보면:

| 모델 단계     | SRC에서 담당하는 위치 / 주요 파일                                                                                        |
| --------- | ------------------------------------------------------------------------------------------------------------ |
| **수신**    | `bin/www` (포트 listen), `app.js` (Express app 생성)                                                             |
| **식별**    | `src/routes/alive/router.js`, `src/routes/landPriceIndex/router.js` – URL/메서드로 파이프라인 선택                      |
| **정형·구성** | `src/middlewares/setup.js` (body/cookie 준비), `src/routes/landPriceIndex/mw.js` (`parseSyncReq`로 DTO 생성 & 검증) |
| **기능 실행** | `src/services/landPriceIndex/full/syncFull.js`, `update/syncUpdate.js` – 외부 API·DB 호출 포함 비즈니스 로직             |
| **결과 생성** | 위 Service들에서 만든 summary 객체 (`period`, `target`, `fetched`, `saved`, `errorRegions`, `ext_status`)            |
| **해석**    | `src/routes/landPriceIndex/handler.js` – summary를 보고 성공/실패/상태 코드 판단                                          |
| **생성**    | Handler의 `sendOk`/`sendError` – sx_ret 포맷 응답 객체 생성                                                           |
| **전송**    | `res.status(...).json(ret)` 호출, `src/middlewares/notFound.js` 포함                                             |


---

