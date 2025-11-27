# DATA_API -- Docker MariaDB (realestate)

이 프로젝트는 **MariaDB 11.4.8**을 Docker 컨테이너로 실행하며,\
초기 실행 시 자동으로 스키마 생성 및 CSV 데이터를 삽입하는 개발용 DB
환경입니다.

DB는 볼륨을 사용하지 않기 때문에 **컨테이너 삭제 시 항상 초기화**됩니다.

------------------------------------------------------------------------

# 1. 기본 정보

-   **DBMS**: MariaDB 11.4.8\
-   **Database**: `realestate`\
-   **User**: `root` / `0000`\
-   **Port**: `3307 → 3306`

## 1-1. 문자셋 & Collation 설명

-   문자셋(Character Set): **utf8mb4**
-   Collation: **utf8mb4_uca1400_as_cs**

  옵션          의미
  ------------- ----------------------------------
  **uca1400**   Unicode Collation Algorithm 14.0
  **as**        accent-sensitive (악센트 구분)
  **cs**        case-sensitive (대소문자 구분)

> 즉, 문자열 비교 시 **악센트 구분 + 대소문자 구분** 규칙을 적용합니다.

------------------------------------------------------------------------

# 2. 디렉토리 구조

    docker/
     └─ db/
         ├─ init/
         │   ├─ 00_schema.sql        # 스키마 정의
         │   └─ 10_seed.sql          # CSV 초기 데이터 삽입
         └─ seed_csv/
             ├─ REGION_BASE.csv
             ├─ REGION_PARENT.csv
             └─ REGION_META.csv

------------------------------------------------------------------------

# 3. 실행

``` bash
docker compose up --build
```

컨테이너 최초 실행 시 자동으로:

1.  DB 생성\
2.  테이블 생성\
3.  CSV 데이터 적재

------------------------------------------------------------------------

# 4. 초기화(Reset)

``` bash
docker compose down
docker compose up --build
```

컨테이너를 다시 올리면\
**항상 초기 상태(스키마 + CSV 시딩)**로 돌아갑니다.

------------------------------------------------------------------------

# 5. DB 접속

``` bash
docker exec -it realestate-mariadb mariadb -uroot -p0000 realestate
```

또는 GUI DB 툴에서:

-   Host: `127.0.0.1`
-   Port: `3307`
-   User: `root`
-   Password: `0000`
-   DB: `realestate`

------------------------------------------------------------------------

# 6. 상태 점검

## 6-1. 기본 테이블 점검

``` sql
SHOW TABLES;

DESC region_base;
DESC region_parent;
DESC region_meta;
DESC land_price_index;
```

## 6-2. Collation 점검

``` sql
SHOW CREATE DATABASE realestate;
SHOW TABLE STATUS WHERE Name = 'region_base';
SHOW FULL COLUMNS FROM region_base;
```

------------------------------------------------------------------------

# 7. 데이터 건수 확인

``` sql
SELECT COUNT(*) FROM region_base;
SELECT COUNT(*) FROM region_parent;
SELECT COUNT(*) FROM region_meta;
SELECT COUNT(*) FROM land_price_index;
```

> `land_price_index`는 API 동기화 실행 후 데이터가 쌓입니다.

------------------------------------------------------------------------

# 8. API 연동 테스트

``` bash
curl "http://localhost:13800/land-price-index/sync"
```

지역별 지가지수 데이터를 가져와\
`land_price_index` 테이블(JSON 버전)에 저장합니다.

------------------------------------------------------------------------

# 9. land_price_index (JSON 버전) 구조 설명

> **지역 1개 → 행 1개**, `series` JSON에 모든 시계열을 저장하는 구조

### 📌 테이블 구조

  컬럼명        타입           설명
  ------------- -------------- ------------------------
  region_code   INT UNSIGNED   PK, 지역코드
  series        JSON           월별 시계열 배열(JSON)
  created_at    DATETIME       생성 시각
  updated_at    DATETIME       갱신 시각

------------------------------------------------------------------------

## 9-1. series JSON 구조 예시

``` json
[
  { "ym": "202201", "index": 102.3456, "change": 0.0123 },
  { "ym": "202202", "index": 102.6543, "change": 0.0030 },
  { "ym": "202203", "index": 102.8300, "change": 0.0017 }
]
```

------------------------------------------------------------------------

## 9-2. 특징

-   지역별로 행이 1개 → 전체 행 개수 = 지역 수(5443)
-   그래프에 바로 사용할 수 있는 구조 (프론트 최적화)
-   정규화 대신 **front-end visualization 최적화 모델**

------------------------------------------------------------------------

# 10. 참고: JSON 구조 사용 시 주의사항

  기능                      JSON 구조 적합성
  ------------------------- --------------------
  전체 그래프 출력          ⭐ 최적
  hover/tooltip 표시        ⭐ 문제 없음
  특정 월 조회              ⚠ SQL에서 불리
  통계/분석(전국 평균 등)   ⚠ 직접 구현 필요
  중복 ym 방지              ⚠ 앱 레벨에서 체크

------------------------------------------------------------------------

# END
