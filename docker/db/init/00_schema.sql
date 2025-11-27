-- ========================================================
-- 00_schema.sql
-- 지역 코드 3테이블 + land_price_index (기존 유지)
-- ========================================================

-- --------------------------------------------------------
-- 1) REGION_BASE
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS region_base (
  region_code INT UNSIGNED NOT NULL,            -- 내부 지역 코드 (PK)
  name        VARCHAR(100) NOT NULL DEFAULT '', -- 지역 이름
  lawd_code   INT UNSIGNED NOT NULL DEFAULT 0,  -- 법정동 코드

  PRIMARY KEY (region_code)
);


-- --------------------------------------------------------
-- 2) REGION_PARENT
--  - 계층 구조 정보
--  - parent_code = 0 → 루트 의미
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS region_parent (
  region_code INT UNSIGNED NOT NULL,
  parent_code INT UNSIGNED NOT NULL DEFAULT 0, -- 0 = 부모 없음(루트)

  PRIMARY KEY (region_code),

  -- region_code는 region_base에 반드시 존재해야 함
  CONSTRAINT fk_region_parent_region
    FOREIGN KEY (region_code)
    REFERENCES region_base(region_code),

  INDEX idx_parent_code (parent_code)
  -- parent_code는 0 허용 → FK 연결 안 함
);


-- --------------------------------------------------------
-- 3) REGION_META
--  - depth, full_name, 자식 수 등 메타
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS region_meta (
  region_code     INT UNSIGNED NOT NULL,
  full_name       VARCHAR(200) NOT NULL DEFAULT '',
  name_depth      TINYINT UNSIGNED NOT NULL DEFAULT 0,
  code_depth      TINYINT UNSIGNED NOT NULL DEFAULT 0,  -- 요청 반영
  children_count  INT UNSIGNED NOT NULL DEFAULT 0,
  has_children    TINYINT(1) UNSIGNED NOT NULL DEFAULT 0,  -- 0/1

  PRIMARY KEY (region_code),

  CONSTRAINT fk_region_meta_region
    FOREIGN KEY (region_code)
    REFERENCES region_base(region_code)
);


-- --------------------------------------------------------
-- 4) land_price_index (JSON 버전 — 지역별 시계열 저장)
--  - region_code 1개당 1행(총 5,443행 예상)
--  - series 컬럼에 월별 지가지수 시계열을 JSON 배열로 저장
--    예) [
--      { "ym": "202201", "index": 102.3456, "change": 0.0123 },
--      { "ym": "202202", "index": 102.6543, "change": 0.0030 }
--    ]
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS land_price_index (
  region_code  INT UNSIGNED NOT NULL,   -- 지역 코드 (PK, FK)
  series       JSON NOT NULL,           -- 월별 지가지수 시계열(JSON 배열)
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (region_code),

  CONSTRAINT fk_land_price_index_region
    FOREIGN KEY (region_code)
    REFERENCES region_base(region_code)
);