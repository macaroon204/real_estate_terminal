'use strict';

import mariadb from "mariadb";
import { fetchLandPriceIndex } from "./client.js";

const pool = mariadb.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: process.env.DB_PORT || 3307,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "0000",
  database: process.env.DB_NAME || "realestate",
  connectionLimit: 5,
});

export async function syncLandPriceIndex({ regionCode, fromYm, toYm }) {
  const conn = await pool.getConnection();
  try {
    // 1) region 존재 검증만 (extra_code 안 씀)
    const regionRows = await conn.query(
      "SELECT region_code FROM region WHERE region_code=?",
      [regionCode]
    );
    if (!regionRows[0]) throw new Error("invalid regionCode");

    // 2) 외부 수집 (client가 ym/index_value로 정규화해서 넘김)
    const { rows: rawRows, ext_status } = await fetchLandPriceIndex({
      regionCode,
      fromYm,
      toYm,
    });

    if (ext_status !== 0) {
      return {
        period: { fromYm, toYm },
        fetched: rawRows.length,
        saved: 0,
        ext_status,
      };
    }

    // 3) 정규화: client 표준 필드 사용
    const entities = rawRows.map(r => ({
      region_code: regionCode,
      ym: r.ym,                     // ✅ 이미 표준화됨
      index_value: r.index_value,   // ✅ 이미 표준화됨
    }));

    // 4) upsert 저장
    const upsertSql = `
      INSERT INTO land_price_index(region_code, ym, index_value)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE
        index_value = VALUES(index_value),
        updated_at = NOW()
    `;

    let saved = 0;
    for (const e of entities) {
      const ret = await conn.query(upsertSql, [e.region_code, e.ym, e.index_value]);
      saved += ret.affectedRows;
    }

    return {
      period: { fromYm, toYm },
      fetched: rawRows.length,
      saved,
      ext_status: 0,
    };
  } finally {
    conn.release();
  }
}
