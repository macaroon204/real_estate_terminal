CREATE TABLE IF NOT EXISTS region (
  region_code     INT UNSIGNED NOT NULL,
  name            VARCHAR(100) NOT NULL,
  extra_code      INT UNSIGNED NOT NULL,
  true_level      TINYINT UNSIGNED NOT NULL,
  parent_code     INT UNSIGNED NOT NULL,
  child_count     INT UNSIGNED NOT NULL,
  min_child_level TINYINT UNSIGNED NOT NULL,
  max_child_level TINYINT UNSIGNED NOT NULL,

  PRIMARY KEY (region_code),
  INDEX idx_parent (parent_code),
  INDEX idx_level (true_level)
);


CREATE TABLE land_price_index (
  region_code  INT UNSIGNED NOT NULL,   -- 내부 region PK 참조
  ym           CHAR(6) NOT NULL,        -- YYYYMM
  index_value  DECIMAL(10,4) NOT NULL,  -- 지가지수 값
  change_rate  DECIMAL(10,4) NULL,      -- (있으면) 월 변동률
  base_ym      CHAR(6) NULL,            -- (있으면) 기준시점
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY(region_code, ym),
  FOREIGN KEY(region_code) REFERENCES region(region_code)
);
