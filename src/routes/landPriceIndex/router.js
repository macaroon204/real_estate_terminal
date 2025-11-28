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


// 'use strict';

// import { Router } from 'express';
// import { parseSyncReq } from './mw.js';
// import { syncHandler } from './handler.js';

// const router = Router();

// // [요청 단계]  /land-price-index/sync
// //  - 수신 → 식별/정형화(mw) → 처리/응답(handler)
// router.get('/sync', parseSyncReq, syncHandler);

// export default router;
