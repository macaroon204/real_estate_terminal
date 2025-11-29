// app.js
'use strict';

import './src/config/env.js';                           // ✅ ENV 로드 + ENV 검증
import { runLogSpecChecks } from './src/libs/log_spec_check.js'; // ✅ SID/LOG 규칙 검증

import express from 'express';

import { applyAppSetup } from './src/middlewares/setup.js';
import { notFound } from './src/middlewares/notFound.js';

import aliveRouter from './src/routes/alive/router.js';
import landPriceIndexRouter from './src/routes/landPriceIndex/router.js';

// ─────────────────────────────────────────────
// ✅ 서버 기동 전 규칙 검증
// ─────────────────────────────────────────────
runLogSpecChecks();

const app = express();

// 전역 미들웨어 + 404 처리 세팅
applyAppSetup(app);

// 라우터 장착
app.use('/alive', aliveRouter);
app.use('/land-price-index', landPriceIndexRouter);

// 404는 반드시 라우터 뒤에
app.use(notFound);

export default app;
