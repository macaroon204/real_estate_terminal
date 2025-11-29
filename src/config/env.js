// src/config/env.js
import path from 'path';
import dotenv from 'dotenv';

const dotenvPath = path.resolve(process.cwd(), '.env');
const result = dotenv.config({ path: dotenvPath });

if (result.error) {
  console.error('❌ dotenv load failed:', result.error);
  throw result.error;
}

export const env = {
  app: {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: Number(process.env.PORT ?? 3000),
    sysNo: String(process.env.SYS_NO ?? '100'),
  },
  db: {
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: Number(process.env.DB_PORT ?? 3307),
    user: process.env.DB_USER ?? 'root',
    pass: process.env.DB_PASS ?? '0000',
    name: process.env.DB_NAME ?? 'realestate',
  },
  api: {
    rebKey: process.env.REB_API_KEY ?? '',
    roneKey: process.env.RONE_API_KEY ?? '',
    baseUrl:
      process.env.RONE_BASE_URL ||
      'https://www.reb.or.kr/r-one/openapi/SttsApiTblData.do',
    statblId: process.env.RONE_STATBL_ID || 'A_2024_00901',
    dtaCycleCd: process.env.RONE_DTACYCLE_CD || 'MM',
    itmId: process.env.RONE_ITM_ID || '100001',
  },
  log: {
    level: process.env.LOG_LEVEL ?? 'info',
    pretty: process.env.LOG_PRETTY === '1',
  },
};

// ======================================================
// ✅ ENV 검증 레이어 추가
// ======================================================
function validateEnv(env) {
  // 여기서 "없으면 안 되는 값"만 골라서 필수로 체크
  const required = [
    ['app.port', env.app.port],
    ['app.sysNo', env.app.sysNo],
    ['db.host', env.db.host],
    ['db.user', env.db.user],
    ['db.name', env.db.name],
    // API 키를 꼭 써야 하면 아래 주석 풀기:
    // ['api.rebKey', env.api.rebKey],
  ];

  const missing = required
    .filter(([, value]) => value === undefined || value === null || value === '')
    .map(([name]) => name);

  if (missing.length > 0) {
    console.error('❌ Missing required ENV values:');
    for (const name of missing) {
      console.error('   -', name);
    }
    console.error('💥 서버를 중지합니다. .env 설정을 확인하세요.');
    process.exit(1);
  }
}

validateEnv(env);

// ======================================================
// 기존 ENV LOADED 로그 (있으면 유지해도 됨)
// ======================================================
console.log('\n============================================');
console.log('✅ ENV LOADED');
console.log('✅ PORT   =', env.app.port);
console.log('✅ SYS_NO =', env.app.sysNo);
console.log(
  '✅ DB     =',
  env.db.user,
  '@',
  `${env.db.host}:${env.db.port}/${env.db.name}`,
);
console.log('============================================\n');
