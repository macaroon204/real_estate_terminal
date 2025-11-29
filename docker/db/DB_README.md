# DATA_API --- Database Design & Source Walkthrough

이 문서는 DATA_API 프로젝트의 DB 아키텍처 전반과\
이를 실제로 구현한 **SQL 소스 코드의 구조와 동작 흐름**을 설명한다.

> 본 문서는 실행 가이드가 아니다.\
> 설치/실행/점검 명령어는 Root README에서 관리하며,\
> 본 문서는 **설계 철학 · 데이터 모델 · SQL 구현 상세 워크스루**
> 중심으로 기술한다.

------------------------------------------------------------------------

## 1. 데이터 모델 개요

### 테이블 구조

```text
region_base      ┐
region_parent    ├── 행정구역 정규화 구조
region_meta      ┘

land_price_index           ── 지역별 JSON 시계열 테이블
sp_merge_land_price_index ── 시계열 병합 저장 프로시저
```

---

### 설계 방향

#### 행정구역
- 완전 정규화 구조
- 기본 / 부모 / 메타 테이블 분리

#### 시계열 데이터
- 지역 1건 = ROW 1건
- 월별 데이터는 JSON 배열로 비정규화 저장

#### 업데이트 전략
- 지역 단위 **UPSERT**
- 신규 데이터 + 기존 데이터 **전체 시계열 병합**


------------------------------------------------------------------------

## 2. 테이블 설계

### region_base

행정구역 기준 테이블

``` sql
CREATE TABLE region_base (
  region_code INT UNSIGNED PRIMARY KEY,
  name VARCHAR(100),
  lawd_code INT UNSIGNED
);
```

-   모든 지역 데이터의 Root 테이블

------------------------------------------------------------------------

### region_parent

행정구역 계층 구조 관리

``` sql
CREATE TABLE region_parent (
  region_code INT UNSIGNED PRIMARY KEY,
  parent_code INT UNSIGNED DEFAULT 0
);
```

단일 부모 구조의 트리 구조

------------------------------------------------------------------------

### region_meta

계층 캐시 테이블

``` sql
CREATE TABLE region_meta (
  region_code INT UNSIGNED PRIMARY KEY,
  full_name VARCHAR(200),
  name_depth TINYINT,
  code_depth TINYINT,
  children_count INT,
  has_children BOOLEAN
);
```

-   depth·부모·전체명 캐싱 목적

------------------------------------------------------------------------

### land_price_index

실제 핵심 데이터 테이블

``` sql
CREATE TABLE land_price_index (
  region_code INT UNSIGNED PRIMARY KEY,
  series JSON,
  created_at DATETIME,
  updated_at DATETIME
);
```

JSON 구조:

``` json
[
  { "ym":"202201","index_value":102.34,"change_rate":0.012 },
  { "ym":"202202","index_value":102.65,"change_rate":0.003 }
]
```

------------------------------------------------------------------------

## 3. CSV 시딩

초기 기준 데이터는 Docker 컨테이너 기동 시 **CSV 파일을 이용해 자동 적재**된다.

### CSV → 테이블 매핑

| CSV 파일 | 대상 테이블 |
|-----------|----------------|
| `REGION_BASE.csv` | `region_base` |
| `REGION_PARENT.csv` | `region_parent` |
| `REGION_META.csv` | `region_meta` |

- 모든 CSV는 `docker/db/seed_csv` 디렉토리에 위치
- 재시작 시 항상 기준 데이터가 동일하게 초기화됨

------------------------------------------------------------------------

## 4. 저장 프로시저 구조

프로시저:

``` sql
CREATE PROCEDURE sp_merge_land_price_index(
   p_region_code BIGINT,
   p_new_series_json LONGTEXT
);
```

동작 흐름:

    기존 JSON 조회
    신규 JSON 검증
    임시 테이블(tmp_lpi_series) 생성
    기존/신규 JSON 파싱 삽입
    UPSERT 병합
    JSON 재정렬
    land_price_index UPSERT

------------------------------------------------------------------------

## 5. 병합 핵심 SQL

### 임시 테이블

``` sql
CREATE TEMPORARY TABLE tmp_lpi_series (
  ym CHAR(6) PRIMARY KEY,
  index_value DECIMAL,
  change_rate DECIMAL
);
```

-   ym 기준 중복 자동 제거

------------------------------------------------------------------------

### 기존 JSON 파싱

``` sql
INSERT INTO tmp_lpi_series
SELECT ...
FROM JSON_TABLE(v_existing_json);
```

------------------------------------------------------------------------

### 신규 JSON 병합

``` sql
INSERT INTO tmp_lpi_series
SELECT ...
FROM JSON_TABLE(v_new_json)
ON DUPLICATE KEY UPDATE
 index_value = VALUES(index_value),
 change_rate = VALUES(change_rate);
```

------------------------------------------------------------------------

### JSON 재조합

``` sql
SELECT JSON_ARRAYAGG(JSON_OBJECT(...) ORDER BY ym)
INTO v_merged_json;
```

------------------------------------------------------------------------

### 최종 반영

``` sql
INSERT INTO land_price_index(region_code, series)
VALUES(...)
ON DUPLICATE KEY UPDATE
 series = VALUES(series);
```

------------------------------------------------------------------------

## 6. 데이터 흐름

    외부 API
       ↓
    JSON 파싱
       ↓
    sp_merge_land_price_index
       ↓
    JSON 병합
       ↓
    land_price_index 저장
       ↓
    API 응답

------------------------------------------------------------------------

## 7. 설계 요약

-   행정구역 정규화 + 시계열 JSON 비정규화 결합 모델
-   모든 업데이트는 **전체 병합 방식**
-   JOIN/부분 UPDATE 없음
-   조회는 지역 단위 최적화

------------------------------------------------------------------------

## 8. SQL 파일 분류

### 역할별 SQL 스크립트 구성

| 파일 | 역할 |
|------------------------------|----------------|
| `00_schema.sql` | 테이블 정의 (DDL) |
| `10_seed.sql` | CSV 시딩 처리 |
| `20_proc_land_price_index.sql` | JSON 병합 저장 프로시저 정의 |

- 실행 순서:
  1. `00_schema.sql`
  2. `10_seed.sql`
  3. `20_proc_land_price_index.sql`

- Docker 초기 구동 시 위 순서대로 자동 실행됨

------------------------------------------------------------------------

# END
