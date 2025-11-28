// src/routes/landPriceIndex/router.js
'use strict';

import { Router } from 'express';
import { parseSyncReq } from './mw.js';
import {
  syncFullHandler,
  syncUpdateHandler,
} from './handler.js';

const router = Router();

// 전체 수신 (full sync)
router.get('/sync/full', parseSyncReq, syncFullHandler);

// 업데이트(증분) 수신
router.get('/sync/update', parseSyncReq, syncUpdateHandler);

export default router;