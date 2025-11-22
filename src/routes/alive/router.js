// src/routes/alive/router.js
import { Router } from 'express';
import * as mw from './middleware.js';
import * as h from './handler.js';

const router = Router();

// 현재 로컬 미들웨어 없으니 핸들러만 연결
router.get('/', h.getAlive);

// 나중에 로컬 미들웨어 생기면 이렇게 조립
// router.get('/', mw.checkAliveHeader, h.getAlive);

export default router;
