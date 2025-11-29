# DATA_API --- RealEstate Land Price Index API

토지가격지수 동기화 전용 Node.js API 서버입니다.

외부 통계 API 데이터를 수집하여\
MariaDB(JSON 시계열 구조)에 저장·관리합니다.

이 문서는 **"설치 → 실행 → 상세 점검 → 기능 실행"** 흐름으로 구성된\
실운영/검증 중심 가이드입니다.

------------------------------------------------------------------------

## 연관 문서 (개념·구조 설명 전용)

-   `docker/db/README.md` --- DB 구조, CSV 시딩, Collation, JSON 설계,
    프로시저 원리
-   `src/libs/LOGGING_README.md` --- 로그 체계(SID / PID / value1 /
    value2 규칙)
-   `src/config/README.md` --- 환경 변수(.env) 설명
-   `src/README.md` --- API 전체 프로세스·시퀀스 구조

------------------------------------------------------------------------

## 1. 최소 정보

-   **Server** : Node.js 18+
-   **DB** : MariaDB 11.4.8 (Docker)
-   **API PORT** : `13800`
-   **DB PORT** : `3307 → 3306`

  Endpoint                          기능
  --------------------------------- ---------------
  `/alive`                          서버 헬스체크
  `/land-price-index/sync/full`     전체 동기화
  `/land-price-index/sync/update`   증분 동기화

------------------------------------------------------------------------

## 2. 구축

``` bash
npm install
cp .env.example .env
docker compose up --build -d
```

DB 전체 초기화:

``` bash
docker compose down
docker compose up --build -d
```

------------------------------------------------------------------------

## 3. 실행

``` bash
npm start
```

------------------------------------------------------------------------

## 4. 실행 후 상세 점검

### DB 상태

``` bash
docker compose ps
```

### DB 접속

``` bash
docker exec -it realestate-mariadb mariadb -uroot -p0000 realestate
```

### 테이블

``` sql
SHOW TABLES;
DESC region_base;
DESC region_parent;
DESC region_meta;
DESC land_price_index;
```

### Collation

``` sql
SHOW CREATE DATABASE realestate;
SHOW TABLE STATUS WHERE Name IN ('region_base','region_parent','region_meta','land_price_index');
SHOW FULL COLUMNS FROM region_base;
```

### CSV 시딩

``` sql
SELECT COUNT(*) FROM region_base;
SELECT COUNT(*) FROM region_parent;
SELECT COUNT(*) FROM region_meta;
```

------------------------------------------------------------------------

### 저장 프로시저 테스트

``` sql
CALL sp_merge_land_price_index(
  500007,
  JSON_ARRAY(
    JSON_OBJECT('ym','202401','index_value',100.12,'change_rate',0.01),
    JSON_OBJECT('ym','202402','index_value',100.34,'change_rate',0.02)
  )
);
```

결과 확인:

``` sql
SELECT region_code, JSON_LENGTH(series), JSON_EXTRACT(series,'$[last]')
FROM land_price_index
WHERE region_code = 500007;
```

중복 덮어쓰기:

``` sql
CALL sp_merge_land_price_index(
  500007,
  JSON_ARRAY(
    JSON_OBJECT('ym','202402','index_value',200.99,'change_rate',0.99)
  )
);
```

부분 초기화:

``` sql
DELETE FROM land_price_index WHERE region_code = 500007;
```

------------------------------------------------------------------------

## 4-4. API 연동 점검

``` bash
curl "http://localhost:13800/land-price-index/sync/full"
curl "http://localhost:13800/land-price-index/sync/update"
```

DB 확인:

``` sql
SELECT COUNT(*) FROM land_price_index;
```

------------------------------------------------------------------------

## 4-5. 로그 확인

PID 단계:

-   0 : 요청 수신
-   20 : 동기화 시작
-   21 : 지역 에러
-   90 : 완료 요약

------------------------------------------------------------------------

## 5. Quick Reference

``` bash
npm install
cp .env.example .env
docker compose up --build -d
npm start

docker compose ps
curl http://localhost:13800/alive

curl "http://localhost:13800/land-price-index/sync/full"
curl "http://localhost:13800/land-price-index/sync/update"
```

------------------------------------------------------------------------

## 6. 구조

``` text
.
├── docker/db/README.md
├── src/config/README.md
├── src/libs/LOGGING_README.md
├── src/README.md
├── docker-compose.yml
├── app.js
└── README.md
```
