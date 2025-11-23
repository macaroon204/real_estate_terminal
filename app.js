// src/app.js
'use strict';

import express from 'express';

import { loadEnv } from './src/config/env.js';
import { applyAppSetup } from './src/middlewares/setup.js';
import { notFound } from './src/middlewares/notFound.js';

import aliveRouter from './src/routes/alive/router.js';

import landPriceIndexRouter from "./src/routes/landPriceIndex/router.js";

loadEnv();

const app = express();

// 전역 미들웨어 + 404 처리 세팅
applyAppSetup(app);

// 라우터 장착
app.use('/alive', aliveRouter);
app.use("/land-price-index", landPriceIndexRouter);

// 404는 반드시 라우터 뒤에
app.use(notFound);

export default app;
