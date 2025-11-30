// src/routes/front/center/nationwide/router.js
'use strict';

import { Router } from 'express';
import { prepareNationwide } from './mw.js';
import { getNationwideHandler } from './handler.js';

const router = Router();

// GET /api/front/center/nationwide
router.get('/', prepareNationwide, getNationwideHandler);

export default router;
