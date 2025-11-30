// src/routes/front/center/nationwide/handler.js
'use strict';

import { getNationwideSummary } from '../../../../services/front/center/nationwide/service.js';
import {
  createLog,
  PID,
  INTERNAL_STATUS,
  EXTERNAL_STATUS,
} from '../../../../libs/log_spec.js';

/**
 * GET /api/front/center/nationwide
 */
export async function getNationwideHandler(req, res) {
  const cid = req.cid ?? String(Date.now());
  const startedAt = Date.now();

  try {
    const items = await getNationwideSummary();

    const totalMetros = items.length;
    const totalPoints = items.reduce(
      (sum, m) => sum + (m.series ? m.series.length : 0),
      0,
    );

    const log = createLog({
      pid: PID.REQ_PARSED, // 10: 조회/변환 완료
      cid,
      value1: INTERNAL_STATUS.OK,
      value2: EXTERNAL_STATUS.OK,
      buffer: {
        path: req.originalUrl,
        method: req.method,
        totalMetros,
        totalPoints,
        elapsedMs: Date.now() - startedAt,
      },
    });

    console.log('[LOG][CENTER_NW]', log);

    // 프론트에서 mapApiItemToCard 로 가공하므로 그대로 전달
    return res.json({ items });
  } catch (e) {
    const errLog = createLog({
      pid: PID.ERROR,
      cid,
      value1: INTERNAL_STATUS.INTERNAL_ERROR,
      value2: EXTERNAL_STATUS.OK,
      buffer: {
        path: req.originalUrl,
        method: req.method,
        message: e?.message ?? String(e),
      },
    });

    console.error('[ERR][CENTER_NW]', errLog);
    console.error('[CENTER_NW ERROR]', e);

    return res.status(500).json({
      message: 'failed to load nationwide summary',
    });
  }
}
