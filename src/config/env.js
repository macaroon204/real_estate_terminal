// src/config/env.js
import path from 'path';
import dotenv from 'dotenv';

export function loadEnv() {
  const dotenv_path = path.join(process.cwd(), './.env');
  const result = dotenv.config({ path: dotenv_path });
  if (result.error) throw result.error;

  console.log('\n\n');
  console.log('Listening on port ' + process.env.PORT);
  console.log('🚀 Server listening → http://localhost:' + process.env.PORT);
  console.log('\n\n');
}
