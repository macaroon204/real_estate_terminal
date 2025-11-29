# DATA_API --- Config Layer Design (src/config)

이 문서는 DATA_API 프로젝트의 **환경 설정(config) 레이어**가\
어떻게 구성되어 있고, 실제 소스 코드가 어떤 흐름으로 동작하는지를
설명한다.

> 실행/점검 명령어는 Root README에서 관리한다.\
> 본 문서는 **.env → env.js → db.js / log.js → 앱 전체 연동 구조**에
> 집중한다.

------------------------------------------------------------------------

## 1. Config 레이어 역할

  파일     역할
  -------- ---------------------------------------------
  env.js   dotenv 로드, 환경 변수 구조화 및 검증
  db.js    MariaDB 커넥션 풀 생성 및 쿼리 헬퍼 제공
  log.js   로그/시스템 환경 브릿지 (SID, LOG_LEVEL 등)

------------------------------------------------------------------------

## 2. env.js

-   `.env` 파일 로드 및 실패 시 서버 중단
-   환경변수 그룹 구조화

``` js
env = {
  app: { nodeEnv, port, sysNo },
  db: { host, port, user, pass, name },
  api: { rebKey, baseUrl, ... },
  log: { level, pretty }
}
```

-   `validateEnv()` 실행으로 필수값 누락 방지
-   ENV LOADED 콘솔 요약 출력

------------------------------------------------------------------------

## 3. db.js

MariaDB Pool 구성:

``` js
const pool = mariadb.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.pass,
  database: env.db.name,
  connectionLimit: 5,
});
```

### 헬퍼

-   `getConnection()` -- 트랜잭션용
-   `query(sql, params)` -- 단순 쿼리용

자동 release 보장.

------------------------------------------------------------------------

## 4. log.js

``` js
export const LOG_ENV = {
  SID_API: env.app.sysNo,
  LOG_LEVEL: env.log.level,
  LOG_PRETTY: env.log.pretty,
}
```

-   시스템 ID(SID) 및 로그 옵션 단일 제공

------------------------------------------------------------------------

## 5. 전체 흐름

    .env
      ↓
    env.js (구조화 & 검증)
      ↓
     ├─ db.js → DB 풀 생성
     └─ log.js → LOG_ENV 구성

    → App 전역에서 env / LOG_ENV 참조

------------------------------------------------------------------------

## 6. 설계 요약

-   process.env 직접 접근 금지 → 항상 env.js를 통해 사용
-   설정 검증으로 fail-fast 운영
-   역할 분리로 가독성 및 확장성 확보

------------------------------------------------------------------------

# END
