# DATA_API — Docker MariaDB (realestate)

Docker 기반 **MariaDB 11.4.8** 개발용 데이터베이스 환경입니다.  
컨테이너 실행 시 자동으로 **스키마 생성 → CSV 시딩 → 저장 프로시저 생성**까지 진행됩니다.

DB는 볼륨을 사용하지 않아 **컨테이너 삭제 시 항상 초기화**됩니다.

---

# 1. 기본 정보

- **DBMS**: MariaDB 11.4.8  
- **Database**: `realestate`  
- **User**: `root` / `0000`  
- **Port**: `3307` → 내부 `3306`

## 1-1. 문자셋 & Collation

- 문자셋: **utf8mb4**
- Collation: **utf8mb4_uca1400_as_cs**

| 옵션 | 설명 |
|------|------|
| uca1400 | Unicode Collation Algorithm 14.0 |
| as | accent-sensitive (악센트 구분) |
| cs | case-sensitive (대소문자 구분) |

---

# 2. 디렉토리 구조

```
docker/
 └─ db/
     ├─ init/
     │   ├─ 00_schema.sql
     │   ├─ 10_seed.sql
     │   └─ 20_proc_land_price_index.sql   # 저장 프로시저
     └─ seed_csv/
         ├─ REGION_BASE.csv
         ├─ REGION_PARENT.csv
         └─ REGION_META.csv
```

---

# 3. 실행

```bash
docker compose up --build
```

컨테이너 최초 실행 시 자동으로:

1) DB 생성  
2) 테이블 생성  
3) CSV 데이터 적재  
4) 저장 프로시저 생성

---

# 4. 초기화(Reset)

```bash
docker compose down
docker compose up --build
```

컨테이너 재생성 시 항상 초기 상태로 돌아갑니다.

---

# 5. DB 접속

```bash
docker exec -it realestate-mariadb mariadb -uroot -p0000 realestate
```

또는 GUI에서:

```
Host: 127.0.0.1
Port: 3307
User: root
Pass: 0000
DB: realestate
```

---

# 6. 상태 점검  
컨테이너 실행 직후 **DB 상태 + CSV 시딩 + Collation + 저장 프로시저 정상 여부**를 점검합니다.

---

## 6-1. 기본 테이블 점검

```sql
SHOW TABLES;

DESC region_base;
DESC region_parent;
DESC region_meta;
DESC land_price_index;
```

---

## 6-2. Collation 점검

```sql
SHOW CREATE DATABASE realestate;
SHOW TABLE STATUS WHERE Name = 'region_base';
SHOW FULL COLUMNS FROM region_base;
```

모두 `utf8mb4_uca1400_as_cs` 이어야 정상.

---

## 6-3. 초기 데이터(CSV) 시딩 확인

```sql
SELECT COUNT(*) FROM region_base;
SELECT COUNT(*) FROM region_parent;
SELECT COUNT(*) FROM region_meta;
SELECT COUNT(*) FROM land_price_index;
```

`land_price_index`는 처음에는 0건일 수 있음.

---

## 6-4. 저장 프로시저 점검 (sp_merge_land_price_index)

### 1) 프로시저 존재 확인

```sql
SHOW PROCEDURE STATUS
WHERE Db='realestate' AND Name='sp_merge_land_price_index';
```

### 2) CREATE 내용 확인

```sql
SHOW CREATE PROCEDURE sp_merge_land_price_index\G
```

### 3) 동작 테스트

```sql
CALL sp_merge_land_price_index(
  1111010100,
  JSON_ARRAY(
    JSON_OBJECT('ym','202401','index_value',100.12,'change_rate',0.01),
    JSON_OBJECT('ym','202402','index_value',100.34,'change_rate',0.02)
  )
);
```

### 4) 병합 결과 확인

```sql
SELECT
  region_code,
  JSON_LENGTH(series) AS len,
  JSON_EXTRACT(series, '$[last]') AS last_item
FROM land_price_index
WHERE region_code = 500007;
```

---

# 7. API 연동 테스트  

## 7-1. 전 지역 실행 (Full Sync)

```bash
curl "http://localhost:13800/land-price-index/sync/full"

curl "http://localhost:13800/land-price-index/sync/update"
```

### 확인

```sql
SELECT COUNT(*) FROM land_price_index;
```

---

## 7-4. API → 저장 프로시저 연동 검증

```sql
SELECT region_code, JSON_EXTRACT(series, '$[last]')
FROM land_price_index
ORDER BY updated_at DESC
LIMIT 5;
```

---

# 9. land_price_index 구조(상세)

## 테이블 구조

| 컬럼 | 타입 | 설명 |
|------|------|------|
| region_code | INT UNSIGNED | PK |
| series | JSON | 월별 시계열 |
| created_at | DATETIME | 생성 |
| updated_at | DATETIME | 갱신 |

---

## JSON 구조 예시

```json
[
  { "ym": "202201", "index": 102.34, "change": 0.012 },
  { "ym": "202202", "index": 102.65, "change": 0.003 }
]
```

---

# 10. JSON 구조 사용 시 주의사항

| 기능 | 적합성 |
|------|--------|
| 전체 그래프용 | ⭐ 최적 |
| tooltip/hover | ⭐ 문제 없음 |
| 특정 월 조회 | ⚠ SQL 비효율 |
| 평균·통계 분석 | ⚠ 직접 처리 필요 |
| 중복 ym 방지 | ⚠ 앱 레벨 체크 |

---

# 11. 저장 프로시저 상세 설명

## 11-1. 시계열 병합 절차 요약

1) 기존 JSON 시계열 조회  
2) 신규 JSON 파싱  
3) 임시 테이블에 합치기  
4) `ym` 기준 병합 (신규 우선)  
5) 정렬 후 JSON 재생성  
6) UPSERT 저장

---

## 11-2. 직접 실행 예시

```sql
CALL sp_merge_land_price_index(
  1111010100,
  JSON_ARRAY(
    JSON_OBJECT('ym','202401','index_value',102.3456,'change_rate',0.0123),
    JSON_OBJECT('ym','202402','index_value',102.6543,'change_rate',0.0030)
  )
);
```

---

## 11-3. 결과 검증 예시

```sql
SELECT
  region_code,
  JSON_LENGTH(series),
  JSON_EXTRACT(series, '$[0]'),
  JSON_EXTRACT(series, '$[last]')
FROM land_price_index
WHERE region_code = 1111010100;
```

---

# END
