USE realestate;

LOAD DATA LOCAL INFILE '/seed_csv/region.csv'
INTO TABLE region
CHARACTER SET utf8mb4
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 LINES
(region_code, name, extra_code, true_level, parent_code, child_count, min_child_level, max_child_level);
