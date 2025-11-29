// src/services/landPriceIndex/full/db.js
'use strict';

import { getConnection } from '../../../config/db.js';

// 커넥션 반환
export async function getConn() {
  return await getConnection();
}

// 전체 지역 조회 (full / update 공통 개념이지만 여기선 full에서만 사용)
export async function loadAllRegions(conn) {
  const rows = await conn.query(
    `SELECT region_code FROM region_base ORDER BY region_code`,
  );
  return rows;
}

// DB merge (기존 기능 그대로)
export async function mergeSeries(conn, regionCode, seriesJson) {
  await conn.query(`CALL sp_merge_land_price_index(?, ?)`, [
    regionCode,
    seriesJson,
  ]);
}
