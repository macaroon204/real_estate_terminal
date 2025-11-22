// src/middlewares/setup.js
import express from 'express';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

export function applyAppSetup(app) {
  // ------------------------------------------------------------
  // 전역 미들웨어(모든 요청 공통 파이프라인)
  // ------------------------------------------------------------
  app.use(morgan('dev'));    // 요청 로그
  app.use(express.json());  // JSON Body 파싱
  app.use(cookieParser());  // Cookie 파싱 (필요 없으면 나중에 제거)
}
