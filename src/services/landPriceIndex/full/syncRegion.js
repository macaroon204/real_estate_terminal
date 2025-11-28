// src/services/landPriceIndex/full/syncRegion.js
'use strict';

import { fetchLandPriceIndex } from '../client.js';
import { mergeSeries } from './db.js';
import { EXTERNAL_STATUS } from '../../../libs/log_spec.js';

export async function syncOneRegion(conn, { regionCode, fromYm, toYm }) {
  const { rows, ext_status } = await fetchLandPriceIndex({
    fromYm,
    toYm,
    regionCode,
  });

  if (ext_status !== EXTERNAL_STATUS.OK) {
    return {
      fetched: 0,
      saved: false,
      ext_status,
    };
  }

  if (!rows || rows.length === 0) {
    return {
      fetched: 0,
      saved: false,
      ext_status: EXTERNAL_STATUS.OK,
    };
  }

  // change_rate 계산 + JSON 시리즈 구성
  const series = [];
  let prevIndex = null;

  for (const r of rows) {
    const idx = Number(r.index_value);
    let change;

    if (prevIndex === null || prevIndex === 0) {
      change = 0;
    } else {
      const raw = ((idx - prevIndex) / prevIndex) * 100;
      change = Number(raw.toFixed(4));
    }

    series.push({
      ym: r.ym,
      index_value: idx,
      change_rate: change,
    });

    prevIndex = idx;
  }

  await mergeSeries(conn, regionCode, JSON.stringify(series));

  return {
    fetched: rows.length,
    saved: true,
    ext_status: EXTERNAL_STATUS.OK,
  };
}
