const mysql = require('mysql2/promise');
const logger = require('../utils/logger');

let pool = null;

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'tw_life_formula',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
};

async function connectDatabase() {
  try {
    pool = mysql.createPool(dbConfig);

    // 測試連接
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();

    logger.info('MySQL 資料庫連接成功');
    return pool;
  } catch (error) {
    logger.error('資料庫連接失敗:', error);
    throw error;
  }
}

function getPool() {
  if (!pool) {
    throw new Error('資料庫連接池尚未初始化');
  }
  return pool;
}

async function executeQuery(sql, params = []) {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    logger.error('SQL 查詢錯誤:', { sql, params, error: error.message });
    throw error;
  }
}

async function executeTransaction(queries) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const results = [];
    for (const { sql, params } of queries) {
      const [result] = await connection.execute(sql, params);
      results.push(result);
    }

    await connection.commit();
    return results;
  } catch (error) {
    await connection.rollback();
    logger.error('交易執行失敗:', error);
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  connectDatabase,
  getPool,
  executeQuery,
  executeTransaction
};
