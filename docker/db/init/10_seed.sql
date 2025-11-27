-- ========================================================
-- 10_seed.sql
-- CSV 데이터 삽입
-- ========================================================

USE realestate;

-- --------------------------------------------------------
-- 1) REGION_BASE
-- --------------------------------------------------------
LOAD DATA LOCAL INFILE '/seed_csv/REGION_BASE.csv'
INTO TABLE region_base
CHARACTER SET utf8mb4
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 LINES
(region_code, name, lawd_code);


-- --------------------------------------------------------
-- 2) REGION_PARENT
--  - parent_code = 0 이면 "부모 없음"
-- --------------------------------------------------------
LOAD DATA LOCAL INFILE '/seed_csv/REGION_PARENT.csv'
INTO TABLE region_parent
CHARACTER SET utf8mb4
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 LINES
(region_code, parent_code);


-- --------------------------------------------------------
-- 3) REGION_META
--  - has_children: 0/1
-- --------------------------------------------------------
LOAD DATA LOCAL INFILE '/seed_csv/REGION_META.csv'
INTO TABLE region_meta
CHARACTER SET utf8mb4
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 LINES
(region_code, full_name, name_depth, code_depth, children_count, has_children);
