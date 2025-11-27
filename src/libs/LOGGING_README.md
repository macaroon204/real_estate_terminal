# 📘 Logging Specification (로그 체계 README)

본 문서는 **API 서버(template-core)** 에서 사용하는 로그 체계의 통일된
규칙을 정의한다.\
모든 로그는 공통 필드 구조를 따르며, 요청 → 처리 → 외부 연동 → 완료까지\
**전체 트랜잭션을 추적(correlation)** 할 수 있도록 설계한다.

------------------------------------------------------------------------

# 1. 📦 로그 공통 구조

모든 로그는 아래 공통 JSON 형식을 따른다.

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

  ------------------------------------------------------------------------
  필드명                     타입                   설명
  -------------------------- ---------------------- ----------------------
  `sid`                      string                 **System ID** -- 어느
                                                    시스템/컴포넌트의
                                                    로그인지

  `pid`                      number                 **Process Phase ID**
                                                    -- 요청 처리 단계

  `cid`                      string/number          **Correlation ID** --
                                                    동일 요청 흐름을
                                                    추적하기 위한 ID

  `value1`                   number                 **내부 상태
                                                    코드**(Internal Status
                                                    Code)

  `value2`                   number                 **외부 상태
                                                    코드**(External Status
                                                    Code)

  `bufflen`                  number                 buffer 내용 길이(선택)

  `buffer`                   object                 상세 정보(상황별
                                                    payload)
  ------------------------------------------------------------------------

------------------------------------------------------------------------

# 2. 🏷 sid 규칙 (System ID)

  sid     컴포넌트     설명
  ------- ------------ -------------------------
  `100`   API 서버     Node.js 기반 data_api
  `200`   FRONT        React / Vite 프론트엔드
  `300`   AI 서버      AI 연동/추론 모듈
  `400`   JOB/WORKER   배치 처리, 비동기 작업

------------------------------------------------------------------------

# 3. 🔄 pid 규칙 (Process Phase ID)

  pid   단계 이름        설명
  ----- ---------------- --------------------
  0     `REQ_RECEIVED`   요청 수신
  10    `REQ_PARSED`     파라미터 검증 완료
  20    `SYNC_START`     동기화 시작
  21    `SYNC_REGION`    지역 처리 중
  30    `SAVE_DB`        DB 저장
  90    `SYNC_DONE`      전체 완료
  99    `ERROR`          예외 처리

------------------------------------------------------------------------

# 4. 🔗 cid 규칙 (Correlation ID)

요청 단위로 끝까지 이어지는 추적용 ID.

------------------------------------------------------------------------

# 5. ✔ value1 규칙 (Internal Status Code)

  value1   의미
  -------- ---------------
  0        정상
  -1       파라미터 오류
  -2       조건 불충족
  -3       DB 오류
  -4       내부 예외
  -5       내부 타임아웃

------------------------------------------------------------------------

# 6. 🌐 value2 규칙 (External Status Code)

  value2   의미
  -------- -----------------------
  0        외부 정상
  \>0      외부 시스템 에러 코드
  \<0      사용자 정의 외부 에러

------------------------------------------------------------------------

# 7. 🗂 buffer 예시

``` json
{
  "src_ip": "1.2.3.4",
  "fromYm": "200501",
  "toYm": "202511",
  "regionCode": 500007
}
```

------------------------------------------------------------------------

# 8. 📑 정상/에러 예시

## 정상

``` json
{
  "value1": 0,
  "value2": 0
}
```

## 파라미터 오류

``` json
{
  "value1": -1,
  "value2": 0
}
```

## 외부 인증 오류

``` json
{
  "value1": -1,
  "value2": 290
}
```

------------------------------------------------------------------------

# 9. 📌 로그 체계 핵심 요약

  항목     의미
  -------- -----------------
  sid      어떤 시스템인가
  pid      어떤 단계인가
  cid      어떤 요청인가
  value1   내부 성공/실패
  value2   외부 성공/실패
  buffer   상세 정보


---

# 10. 🔧 로그 개선 사항 (2025 업데이트)

아래는 실제 운영 중 발견된 문제를 기반으로 추가된 개선 규칙이다.

## 10-1) PID.SYNC_DONE(90) 로그는 **서비스(Service)** 에서만 1회 출력
- 핸들러와 서비스 양쪽에서 출력하던 중복 로그 제거
- 최종 요약 로그는 서비스 계층에서만 출력하여 “요약은 단 한 번” 원칙 유지

## 10-2) buffer에 `undefined`, `null` 값은 절대 포함하지 않기
- `path: undefined`, `regionCode: null` 같은 노이즈 제거
- buffer 생성 시 조건부 필드 추가 방식 사용  
  ```js
  if (value != null) buffer.key = value;
  ```

## 10-3) SYNC 완료(pid: 90) 로그에 `elapsedMs` 추가
- 전체 동기화 시간(ms)을 로그에 포함하여 성능 추적 가능  
- 예:
  ```json
  "elapsedMs": 557850
  ```

## 10-4) 진행 중 토막 출력(log fragment) 발생 문제 해결
- logger가 중간에 객체 일부를 여러 번 출력하던 문제 제거  
- `console.log(createLog(...))` 단일 호출로 통일

## 10-5) 단계 로그 구조를 명확하게 정리
최종 구조:
1. **pid: 0** – 요청 수신  
2. **pid: 20** – 동기화 시작  
3. **pid: 21** – 지역 처리(루프 내부, 선택사항)  
4. **pid: 90** – 동기화 완료  
5. **pid: 99** – 에러

## 10-6) regionCode 필터링 개선
- `regionCode = null`일 때 buffer에 포함하지 않음  
- `"regionMode": "all"` 또는 `"single"` 로 명확히 표현

---



---

# 10. 🔧 로그 개선 사항 상세 설명 + 실제 예시

운영 과정에서 발견된 문제들을 해결하기 위해 아래와 같이 로그 규칙이 보강되었다.  
각 항목 뒤에는 **수정 전 → 수정 후** 형태의 실제 로그 예시를 포함한다.

---

## 10-1) ✔ PID.SYNC_DONE(90) 로그는 서비스(Service)에서만 1회 출력

### 🔍 문제점(수정 전)
- 핸들러와 서비스에서 모두 `pid: 90`을 찍어 **동일 요약 로그가 2번 이상 출력됨**
- 출력 중 객체 파싱이 끊겨 “value2: 0 … buffer …” 같은 **토막 로그**가 수십 줄로 출력되는 문제 발생

### ✔ 개선 후
- 최종 요약은 **service.js 내부에서 단 1번만 출력**
- 로그 구조가 매우 깔끔해짐

### 예시

#### ⛔ 수정 전 (불량)
```
[LOG] { pid: 90, ... buffer: { ... } }
value2: 0,
buffer: {
  fromYm: '200501',
(이후 토막 줄 수십 줄…)
```

#### ✅ 수정 후 (정상)
```
[LOG] {
  sid: '100',
  pid: 90,
  cid: '1764189755506',
  value1: 0,
  value2: 0,
  bufflen: 8,
  buffer: {
    fromYm: '200501',
    toYm: '202511',
    totalRegions: 5443,
    successRegions: 5443,
    failRegions: 0,
    fetched: 735978,
    saved: 5443,
    elapsedMs: 557850
  }
}
```

---

## 10-2) ✔ buffer에 `undefined`, `null` 값 제거

### 🔍 문제점(수정 전)
```
buffer: {
  path: undefined,
  src_ip: undefined,
  regionCode: null
}
```

- JSON 로그에 `undefined`는 의미가 없고 필드만 오염됨
- null 값도 실제 데이터가 없는 것처럼 보여 가독성 저하

### ✔ 개선 후
- buffer 작성 시 **조건부 필드 추가 방식**으로 재구성
- null/undefined 값은 아예 포함되지 않음

### 예시

#### ⛔ 수정 전
```
buffer: {
  path: undefined,
  src_ip: undefined,
  regionCode: null,
  fromYm: '200501',
  toYm: '202511'
}
```

#### ✅ 수정 후
```
buffer: {
  fromYm: '200501',
  toYm: '202511'
}
```

---

## 10-3) ✔ SYNC_DONE(pid: 90) 로그에 `elapsedMs` 추가

### 목적
- 전체 처리 시간을 로그에서 바로 확인 가능하도록 개선  
- 성능 모니터링 및 병목 추적에 활용

### 예시

#### 이전
```
buffer: {
  fetched: 735978,
  saved: 5443
}
```

#### 이후
```
buffer: {
  fetched: 735978,
  saved: 5443,
  elapsedMs: 557850
}
```

---

## 10-4) ✔ 로그 토막(Fragment) 문제 해결

### 🔍 문제점
- console.log가 객체를 여러 번 찍으면서 중간에 잘리는 현상 발생  
예:

```
value2: 0,
buffer: {
value2: 0,
buffer: {
value2: 0,
buffer: {
```

### ✔ 개선 후
- createLog() → console.log() **한 번만 호출**
- 객체 전체가 단일 줄로 안정적으로 출력됨

---

## 10-5) ✔ 단계 로그 구조 정리 (핸들러/서비스 역할 명확화)

### 최종 로그 흐름 구조

| 단계 | pid | 담당 | 설명 |
|------|-----|--------|------|
| 요청 수신 | 0 | Handler | 원시 요청 + 파싱된 요청 로그 |
| 파라미터 검증(선택) | 10 | Handler | 필요하면 사용 |
| 동기화 시작 | 20 | Service | 전체 작업 시작 |
| 지역 처리(루프) | 21 | Service | 각 지역 데이터 처리 |
| 동기화 완료 | 90 | Service | 최종 요약 (1회) |
| 예외 발생 | 99 | Handler/Service | 에러 상태 기록 |

### 실제 예시 흐름 (정상 케이스)

```
[REQ /land-price-index/sync] { ... }

[LOG] { pid: 0, buffer: { fromYm: '200501', toYm: '202511' } }

[LOG] {
  pid: 20,
  buffer: { totalRegions: 5443, regionMode: 'all' }
}

(중간 pid: 21 로그 반복)

[LOG] {
  pid: 90,
  buffer: {
    totalRegions: 5443,
    successRegions: 5443,
    failRegions: 0,
    fetched: 735978,
    saved: 5443,
    elapsedMs: 557850
  }
}
```

---

## 10-6) ✔ regionCode 처리 규칙 개선

### 문제점
- regionCode가 null일 때 `"regionCode": null`이 찍혀 의미 중복
- `regionMode`도 명확하지 않음

### 개선 후 규칙
- regionCode가 없다면 `"single"` 대신 `"all"`
- null 값은 buffer에 포함하지 않음

### 예시

#### 이전
```
buffer: { regionCode: null }
```

#### 이후
```
buffer: { regionMode: 'all' }
```

---

## 📌 전체 개선 후 최종 로그 샘플

아래는 하나의 요청이 **완료될 때 전체 로그 예시**이다.

```
[REQ /land-price-index/sync] {
  src_ip: '1',
  src_port: 64564,
  dest_url_path: '/land-price-index/sync',
  cid: '1764189755506'
}

[LOG] {
  pid: 0,
  buffer: {
    fromYm: '200501',
    toYm: '202511'
  }
}

[LOG] {
  pid: 20,
  buffer: {
    fromYm: '200501',
    toYm: '202511',
    totalRegions: 5443,
    regionMode: 'all'
  }
}

(중간 pid:21 지역 처리 로그들…)

[LOG] {
  pid: 90,
  buffer: {
    fromYm: '200501',
    toYm: '202511',
    totalRegions: 5443,
    successRegions: 5443,
    failRegions: 0,
    fetched: 735978,
    saved: 5443,
    elapsedMs: 557850
  }
}

GET /land-price-index/sync 200 557850.779 ms - 250
```

---

