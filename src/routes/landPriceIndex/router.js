'use strict';

import { Router } from 'express';
import { parseSyncReq } from './mw.js';
import { syncHandler } from './handler.js';

const router = Router();

// [요청 단계]  /land-price-index/sync
//  - 수신 → 식별/정형화(mw) → 처리/응답(handler)
router.get('/sync', parseSyncReq, syncHandler);

export default router;
