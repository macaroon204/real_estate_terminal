// src/routes/front/center/router.js
'use strict';

import { Router } from 'express';
import nationwideRouter from './nationwide/router.js';
import metroRouter from './metro/router.js';
import subregionRouter from './subregion/router.js'; // 🔹 추가

const router = Router();

// 최종 URL: GET /api/front/center/nationwide
router.use('/nationwide', nationwideRouter);

// 광역시 단위 상세
router.use('/metro', metroRouter);

// 🔹 하위 지역(구/군) 단위 시계열
// 최종 URL: GET /api/front/center/subregion/:metroCode
router.use('/subregion', subregionRouter);

export default router;
