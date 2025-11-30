// src/routes/front/left/router.js
'use strict';

import { Router } from 'express';
import { getLeftTogglesHandler } from './handler.js';
import { prepareLeftToggles } from './mw.js';

const router = Router();

// 최종 URL: GET /api/front/left/toggles
router.get('/toggles', prepareLeftToggles, getLeftTogglesHandler);

export default router;
