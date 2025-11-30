'use strict';

import { getConnection } from '../../../../config/db.js';

/**
 * 단일 하위 지역 3개년 시계열 조회
 */
export async function getSubRegionSeries({ metroCode, subRegionCode, years = 3 }) {
  const conn = await getConnection();

  try {
    const rows = await conn.query(
      `
      SELECT
        rb.region_code  AS regionCode,
        rb.name         AS regionName,
        rm.name_depth  AS nameDepth,
        rp.parent_code AS parentRegionCode,
        lpi.series      AS seriesJson

      FROM region_base rb
      JOIN region_parent rp
        ON rb.region_code = rp.region_code

      JOIN region_meta rm
        ON rb.region_code = rm.region_code

      JOIN land_price_index lpi
        ON rb.region_code = lpi.region_code

      WHERE rm.name_depth = 2
        AND rp.parent_code = ?
        AND rb.region_code = ?

      LIMIT 1
      `,
      [ Number(metroCode), Number(subRegionCode) ]
    );

    if (rows.length === 0) return null;

    let series = rows[0].seriesJson;
    if (typeof series === 'string') {
      try { series = JSON.parse(series); }
      catch { series = []; }
    }

    const months = years * 12;

    return {
      regionCode: rows[0].regionCode,
      regionName: rows[0].regionName,
      parentRegionCode: rows[0].parentRegionCode,
      nameDepth: rows[0].nameDepth,
      series: pickLastN(series, months),
    };

  } finally {
    conn.release();
  }
}

function pickLastN(series, limit) {
  if (!Array.isArray(series)) return [];

  const sorted = [...series].sort(
    (a,b) => Number(a.ym) - Number(b.ym)
  );

  return sorted.slice(-limit);
}
