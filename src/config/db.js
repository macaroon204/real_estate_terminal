// src/config/db.js
'use strict';

import mariadb from 'mariadb';
import { env } from './env.js';

/**
 * 공통 MariaDB 커넥션 풀
 */
const pool = mariadb.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.pass,
  database: env.db.name,
  connectionLimit: 5,
});

export async function getConnection() {
  return pool.getConnection();
}

export async function query(sql, params = []) {
  const conn = await getConnection();
  try {
    return await conn.query(sql, params);
  } finally {
    conn.release();
  }
}
