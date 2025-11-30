'use strict';

import { getMetroDetail } from '../../../../services/front/center/metro/service.js';
import { createLog, PID } from '../../../../libs/log_spec.js';

export async function getMetroDetailHandler(req, res) {
  const cid = req.cid ?? String(Date.now());
  const start = Date.now();

  try {
    const metroCode = Number(req.params.metroCode);

    // ----- 파라미터 오류 -----
    if (!Number.isInteger(metroCode)) {
      console.log(createLog({
        pid: PID.ERROR,
        cid,
        buffer: {
          path: req.originalUrl,
          method: req.method,
          reason: 'invalid metroCode',
          metroCode: req.params.metroCode,
        },
      }));

      return res.status(400).json({
        cid,
        message: 'invalid metro code',
      });
    }

    // ----- 서비스 호출 -----
    const data = await getMetroDetail(metroCode);

    if (!data) {
      console.log(createLog({
        pid: PID.ERROR,
        cid,
        buffer: {
          path: req.originalUrl,
          method: req.method,
          reason: 'metro not found',
          metroCode,
        },
      }));

      return res.status(404).json({
        cid,
        message: 'metro region not found',
      });
    }

    // ✅ ----- 정상 완료 요약 로그 (pid:10) -----
    console.log(createLog({
      pid: PID.REQ_PARSED,
      cid,
      buffer: {
        path          : req.originalUrl,
        method        : req.method,
        metroCode     : metroCode,
        months        : data.metro.series.length,
        totalChildren : data.children.length,
        elapsedMs     : Date.now() - start,
      },
    }));

    return res.status(200).json({
      cid,
      data,
    });

  } catch (err) {
    console.error(err);

    console.log(createLog({
      pid: PID.ERROR,
      cid,
      buffer: {
        path: req.originalUrl,
        method: req.method,
        reason: 'internal exception',
        message: err?.message ?? String(err),
        elapsedMs: Date.now() - start,
      },
    }));

    return res.status(500).json({
      cid,
      message: 'failed to load metro summary',
    });
  }
}
