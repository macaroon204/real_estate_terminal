// src/routes/front/left/handler.js
'use strict';

import { getLeftToggles } from '../../../services/front/left/service.js';
import {
  createLog,
  PID,
  INTERNAL_STATUS,
  EXTERNAL_STATUS,
} from '../../../libs/log_spec.js';

/**
 * GET /api/front/left/toggles
 */
export async function getLeftTogglesHandler(req, res) {
  const cid = req.cid ?? String(Date.now()); // mw에서 세팅, 혹시 없으면 보정
  const startedAt = Date.now();

  try {
    const items = await getLeftToggles();

    // --- 요약 통계 (buffer 용) ---
    const totalMetros = items.length;
    const totalSubregions = items.reduce(
      (sum, m) => sum + (m.subregions ? m.subregions.length : 0),
      0,
    );

    // [LOG] 한 줄 요약
    const log = createLog({
      pid: PID.REQ_PARSED, // 10: 파라미터/조회 완료 느낌
      cid,
      value1: INTERNAL_STATUS.OK,
      value2: EXTERNAL_STATUS.OK,
      buffer: {
        path: req.originalUrl,
        method: req.method,
        totalMetros,
        totalSubregions,
        elapsedMs: Date.now() - startedAt,
      },
    });

    console.log('[LOG][LEFT_TOGGLES]', log);

    // 프론트 응답
    // items: [
    //   { code, name, subregions: [ { code, name }, ... ] },
    //   ...
    // ]
    return res.json({ items });
  } catch (e) {
    // 에러 로그 (pid: ERROR)
    const errLog = createLog({
      pid: PID.ERROR,
      cid,
      value1: INTERNAL_STATUS.INTERNAL_ERROR,
      value2: EXTERNAL_STATUS.OK, // 외부 연동 없음
      buffer: {
        path: req.originalUrl,
        method: req.method,
        message: e?.message ?? String(e),
      },
    });

    console.error('[ERR][LEFT_TOGGLES]', errLog);
    console.error('[LEFT TOGGLES ERROR]', e);

    return res.status(500).json({
      message: 'failed to load left toggles',
    });
  }
}
