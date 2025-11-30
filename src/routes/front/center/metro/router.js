// src/routes/front/center/metro/router.js
'use strict';

import { Router } from 'express';
import { prepareMetro } from './mw.js';
import { getMetroDetailHandler } from './handler.js';

const router = Router();

/**
 * GET /api/front/center/metro/:metroCode
 */
router.get('/:metroCode', prepareMetro, getMetroDetailHandler);

export default router;
