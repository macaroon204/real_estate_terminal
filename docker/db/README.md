# DATA_API – Docker MariaDB (realestate)

이 프로젝트는 MariaDB 11.4.8을 Docker로 실행하며, 컨테이너 최초 생성 시 초기 스키마 생성과 CSV 시딩을 자동으로 수행하는 개발용 DB 환경입니다. 데이터 볼륨을 사용하지 않아 컨테이너 삭제 시 DB가 초기화됩니다.

## 1. 구성 요약
- DBMS: MariaDB 11.4.8
- Database: realestate
- User: root / 0000
- Port: 3307 → 3306
- Init SQL 자동 실행
- Collation: utf8mb4_uca1400_as_cs

## 2. 디렉토리 구조
```
DATA_API/
├─ docker-compose.yml
└─ docker/
   └─ db/
      ├─ init/
      │  ├─ 00_schema.sql
      │  └─ 10_seed.sql
      └─ seed_csv/
         └─ region.csv
```

## 3. 실행 방법
```
docker compose up --build
```

## 4. 초기화(Reset)
```
docker compose down
docker compose up --build
```

## 5. DB 접속
```
docker exec -it realestate-mariadb mariadb -uroot -p0000 realestate
```

## 6. 상태 확인 SQL
```
SHOW CREATE DATABASE realestate;
SHOW TABLES;
DESC region;
SELECT COUNT(*) FROM region;
```
## 7.
'''
curl "http://localhost:13800/land-price-index/sync?regionCode=500007"
'''