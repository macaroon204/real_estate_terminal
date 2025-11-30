'use strict';

import { Router } from 'express';
import { prepareSubregion } from './mw.js';
import { getSubregionDetailHandler } from './handler.js';

const router = Router();

/**
 * GET /api/front/center/subregion/:metroCode/:subRegionCode
 */
router.get('/:metroCode/:subRegionCode', prepareSubregion, getSubregionDetailHandler);

export default router;
