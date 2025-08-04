require('dotenv').config();
const { connectDatabase, executeQuery } = require('../config/database');
const logger = require('../utils/logger');

async function testDatabaseConnection() {
  try {
    logger.info('開始測試資料庫連接...');

    // 測試連接
    await connectDatabase();
    logger.info('✅ 資料庫連接成功！');

    // 測試基本查詢
    const result = await executeQuery('SELECT 1 as test');
    logger.info('✅ 基本查詢測試成功:', result);

    // 檢查資料庫版本
    const version = await executeQuery('SELECT VERSION() as version');
    logger.info('📊 MySQL 版本:', version[0].version);

    // 檢查現有資料表
    const tables = await executeQuery('SHOW TABLES');
    logger.info(`📋 現有資料表數量: ${tables.length}`);

    if (tables.length > 0) {
      logger.info('現有資料表:');
      tables.forEach(table => {
        const tableName = Object.values(table)[0];
        logger.info(`  - ${tableName}`);
      });
    } else {
      logger.info('🆕 資料庫為空，準備執行遷移');
    }

    // 檢查資料庫權限
    try {
      await executeQuery('CREATE TABLE IF NOT EXISTS test_permissions (id INT)');
      await executeQuery('DROP TABLE test_permissions');
      logger.info('✅ 資料庫權限檢查通過 (可建立/刪除資料表)');
    } catch (error) {
      logger.warn('⚠️ 資料庫權限受限:', error.message);
    }

    logger.info('🎉 資料庫連接測試完成！');

  } catch (error) {
    logger.error('❌ 資料庫連接測試失敗:', error);

    // 提供常見問題的解決建議
    if (error.code === 'ENOTFOUND') {
      logger.error('💡 建議: 檢查資料庫主機地址是否正確');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      logger.error('💡 建議: 檢查用戶名稱和密碼是否正確');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      logger.error('💡 建議: 檢查資料庫名稱是否存在');
    } else if (error.code === 'ECONNREFUSED') {
      logger.error('💡 建議: 檢查資料庫服務是否啟動，端口是否正確');
    }

    process.exit(1);
  }
}

// 如果直接執行此腳本
if (require.main === module) {
  testDatabaseConnection();
}

module.exports = { testDatabaseConnection };
