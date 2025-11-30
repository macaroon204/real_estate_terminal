'use strict';

import { getSubRegionSeries } from '../../../../services/front/center/subregion/service.js';
import {
  createLog,
  PID,
  INTERNAL_STATUS,
  EXTERNAL_STATUS,
} from '../../../../libs/log_spec.js';

export async function getSubregionDetailHandler(req, res) {
  const startedAt = Date.now();
  const cid = req.cid;
  const { metroCode, subRegionCode } = req.params;

  try {
    const result = await getSubRegionSeries({
      metroCode,
      subRegionCode,
      years: 3
    });

    if (!result) {
      const log = createLog({
        pid: PID.ERROR,
        cid,
        value1: INTERNAL_STATUS.BAD_REQUEST,
        buffer: {
          path: req.originalUrl,
          method: req.method,
          metroCode,
          subRegionCode,
          message: 'Subregion not found'
        }
      });

      console.log(log);

      return res.status(404).json({ message: 'sub region not found' });
    }

    // ✅ 정상 Summary Log (PID=10)
    const log = createLog({
      pid: PID.REQ_PARSED,
      cid,
      value1: INTERNAL_STATUS.OK,
      value2: EXTERNAL_STATUS.OK,
      buffer: {
        path: req.originalUrl,
        method: req.method,
        metroCode: Number(metroCode),
        subRegionCode: Number(subRegionCode),
        months: result.series?.length ?? 0,
        elapsedMs: Date.now() - startedAt,
      },
    });

    console.log(log);

    return res.json(result);

  } catch (err) {
    const log = createLog({
      pid: PID.ERROR,
      cid,
      value1: INTERNAL_STATUS.INTERNAL_ERROR,
      buffer: {
        path: req.originalUrl,
        method: req.method,
        metroCode,
        subRegionCode,
        message: err?.message ?? String(err),
      },
    });

    console.log(log);
    return res.status(500).json({ message: 'failed to load subregion summary' });
  }
}
