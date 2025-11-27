DROP PROCEDURE IF EXISTS sp_merge_land_price_index;
DELIMITER $$

CREATE PROCEDURE sp_merge_land_price_index (
  IN p_region_code      BIGINT,
  IN p_new_series_json  LONGTEXT  -- '[{ "ym": "YYYYMM", "index_value": 123.45, "change_rate": 0.1234 }, ... ]'
)
BEGIN
  DECLARE v_existing_json LONGTEXT;
  DECLARE v_new_json      LONGTEXT;
  DECLARE v_merged_json   LONGTEXT;

  -- 기존 series가 없을 때 대비
  DECLARE CONTINUE HANDLER FOR NOT FOUND
    SET v_existing_json = '[]';

  -- 1) 기존 시계열 JSON 읽기 (행이 없으면 핸들러에서 '[]' 세팅)
  SET v_existing_json = NULL;

  SELECT series
    INTO v_existing_json
    FROM land_price_index
   WHERE region_code = p_region_code
   FOR UPDATE;

  -- NULL 또는 invalid JSON → 빈 배열로 초기화
  IF v_existing_json IS NULL OR JSON_VALID(v_existing_json) = 0 THEN
    SET v_existing_json = '[]';
  ELSEIF JSON_TYPE(v_existing_json) <> 'ARRAY' THEN
    SET v_existing_json = '[]';
  END IF;

  -- 2) 신규 JSON 파라미터도 로컬 변수로 옮겨서 방어
  SET v_new_json = p_new_series_json;

  IF v_new_json IS NULL OR JSON_VALID(v_new_json) = 0 THEN
    SET v_new_json = '[]';
  ELSEIF JSON_TYPE(v_new_json) <> 'ARRAY' THEN
    SET v_new_json = '[]';
  END IF;

  -- 3) 임시 테이블 준비 (기존 + 신규 모두 여기로 모음)
  DROP TEMPORARY TABLE IF EXISTS tmp_lpi_series;

  CREATE TEMPORARY TABLE tmp_lpi_series (
    ym           CHAR(6)        NOT NULL,
    index_value  DECIMAL(18,10) NOT NULL,
    change_rate  DECIMAL(18,10) NOT NULL,
    PRIMARY KEY (ym)
  ) ENGINE = MEMORY;

  -- 3-1) 기존 JSON → 임시 테이블로 풀기
  INSERT INTO tmp_lpi_series (ym, index_value, change_rate)
  SELECT
    jt.ym,
    jt.index_value,
    jt.change_rate
  FROM JSON_TABLE(
         v_existing_json,
         '$[*]' COLUMNS (
           ym           CHAR(6)        PATH '$.ym',
           index_value  DECIMAL(18,10) PATH '$.index_value',
           change_rate  DECIMAL(18,10) PATH '$.change_rate'
         )
       ) AS jt
  WHERE jt.ym IS NOT NULL
    AND jt.index_value IS NOT NULL;

  -- 3-2) 신규 JSON → 기존 값을 덮어쓰는 형태로 merge
  INSERT INTO tmp_lpi_series (ym, index_value, change_rate)
  SELECT
    jt.ym,
    jt.index_value,
    jt.change_rate
  FROM JSON_TABLE(
         v_new_json,
         '$[*]' COLUMNS (
           ym           CHAR(6)        PATH '$.ym',
           index_value  DECIMAL(18,10) PATH '$.index_value',
           change_rate  DECIMAL(18,10) PATH '$.change_rate'
         )
       ) AS jt
  WHERE jt.ym IS NOT NULL
    AND jt.index_value IS NOT NULL
  ON DUPLICATE KEY UPDATE
    index_value = VALUES(index_value),
    change_rate = VALUES(change_rate);

  -- 4) ym 기준 정렬해서 다시 JSON 배열로 합치기
  SELECT
    IFNULL(
      JSON_ARRAYAGG(
        JSON_OBJECT(
          'ym',          ym,
          'index_value', index_value,
          'change_rate', change_rate
        ) ORDER BY ym
      ),
      JSON_ARRAY()
    )
  INTO v_merged_json
  FROM tmp_lpi_series;

  -- 5) land_price_index에 UPSERT
  INSERT INTO land_price_index (region_code, series)
  VALUES (p_region_code, v_merged_json)
  ON DUPLICATE KEY UPDATE
    series = VALUES(series);

  -- 6) 임시 테이블 정리
  DROP TEMPORARY TABLE IF EXISTS tmp_lpi_series;
END$$

DELIMITER ;
