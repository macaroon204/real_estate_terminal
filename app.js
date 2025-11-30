// app.js
'use strict';

import './src/config/env.js';                           // ✅ ENV 로드 + ENV 검증
import { runLogSpecChecks } from './src/libs/log_spec_check.js'; // ✅ SID/LOG 규칙 검증

import express from 'express';

import { applyAppSetup } from './src/middlewares/setup.js';
import { notFound } from './src/middlewares/notFound.js';

import aliveRouter from './src/routes/alive/router.js';
import landPriceIndexRouter from './src/routes/landPriceIndex/router.js';

// 🔽 좌측 TOGGLE/리스트 영역
import leftFrontRouter from './src/routes/front/left/router.js';

// 🔽 센터(그래프) 영역: nationwide / metro / subregion
import centerFrontRouter from './src/routes/front/center/router.js';


// ─────────────────────────────────────────────
// ✅ 서버 기동 전 규칙 검증
// ─────────────────────────────────────────────
runLogSpecChecks();

const app = express();

// 전역 미들웨어 + 404 처리 세팅
applyAppSetup(app);

// ─────────────────────────────────────────────
// 라우터 장착
// ─────────────────────────────────────────────

// 헬스체크
app.use('/alive', aliveRouter);

// (기존) 지가지수 원본/관리용 API
app.use('/land-price-index', landPriceIndexRouter);

// 좌측 메인 토글/리스트
// 최종 엔드포인트 예시: GET /api/front/left/main/toggles
app.use('/api/front/left', leftFrontRouter);

// 센터(그래프) 영역
// 최종 엔드포인트 예시:
//   - GET /api/front/center/nationwide
//   - GET /api/front/center/metro/:metroCode
//   - GET /api/front/center/subregion/:metroCode
app.use('/api/front/center', centerFrontRouter);

// 404는 반드시 라우터 뒤에
app.use(notFound);

export default app;
