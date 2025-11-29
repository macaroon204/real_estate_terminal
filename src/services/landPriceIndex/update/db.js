// src/services/landPriceIndex/update/db.js
'use strict';

import { getConnection } from '../../../config/db.js';

// 커넥션 반환
export async function getConn() {
  return await getConnection();
}

// 전체 지역 조회
export async function loadAllRegions(conn) {
  const rows = await conn.query(
    `SELECT region_code FROM region_base ORDER BY region_code`,
  );
  return rows;
}

// UPDATE 개선을 위한 lastYm 조회 (단일 지역용 — 다른 곳에서 쓸 수 있으니 남겨둠)
export async function getLastYm(conn, regionCode) {
  const sql = `
    SELECT MAX(j.ym) AS lastYm
    FROM land_price_index
    CROSS JOIN JSON_TABLE(
      series,
      '$[*]' COLUMNS (
        ym CHAR(6) PATH '$.ym'
      )
    ) AS j
    WHERE region_code = ?
  `;
  const rows = await conn.query(sql, [regionCode]);
  return rows[0]?.lastYm ?? null;
}

// 모든 지역의 lastYm을 한 번에 조회해서 Map으로 반환
export async function loadAllLastYm(conn) {
  const sql = `
    SELECT t.region_code, MAX(t.ym) AS lastYm
    FROM (
      SELECT lpi.region_code,
             jt.ym
      FROM land_price_index AS lpi
      CROSS JOIN JSON_TABLE(
        lpi.series,
        '$[*]' COLUMNS (
          ym CHAR(6) PATH '$.ym'
        )
      ) AS jt
    ) AS t
    GROUP BY t.region_code
  `;
  const rows = await conn.query(sql);

  const map = new Map();
  for (const row of rows) {
    if (row.lastYm != null) {
      map.set(row.region_code, row.lastYm);
    }
  }
  return map;
}

// DB merge (기존 기능 그대로)
export async function mergeSeries(conn, regionCode, seriesJson) {
  await conn.query(`CALL sp_merge_land_price_index(?, ?)`, [
    regionCode,
    seriesJson,
  ]);
}
