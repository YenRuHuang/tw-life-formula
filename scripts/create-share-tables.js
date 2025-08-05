require('dotenv').config();
const { connectDatabase, executeQuery } = require('../config/database');
const logger = require('../utils/logger');

/**
 * 創建分享相關的資料庫表
 */
async function createShareTables() {
  try {
    logger.info('開始創建分享相關資料庫表...');
    
    // 先初始化資料庫連接
    await connectDatabase();
    logger.info('資料庫連接初始化完成');

    // 創建分享統計表
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS share_stats (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id VARCHAR(36) NULL,
        tool_type VARCHAR(50) NOT NULL,
        platform VARCHAR(20) NOT NULL,
        action VARCHAR(20) NOT NULL DEFAULT 'generate',
        ip_address VARCHAR(45) NULL,
        user_agent TEXT NULL,
        referrer VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        INDEX idx_tool_type (tool_type),
        INDEX idx_platform (platform),
        INDEX idx_action (action),
        INDEX idx_created_at (created_at),
        INDEX idx_composite (tool_type, platform, action)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    logger.info('✅ share_stats 表創建成功');

    // 創建分享內容快取表
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS share_cache (
        id INT PRIMARY KEY AUTO_INCREMENT,
        tool_type VARCHAR(50) NOT NULL,
        platform VARCHAR(20) NOT NULL,
        result_hash VARCHAR(64) NOT NULL,
        image_path VARCHAR(255) NOT NULL,
        content TEXT NULL,
        hashtags JSON NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        UNIQUE KEY unique_cache (tool_type, platform, result_hash),
        INDEX idx_expires (expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    logger.info('✅ share_cache 表創建成功');

    // 檢查表是否創建成功
    const shareStatsCheck = await executeQuery("SHOW TABLES LIKE 'share_stats'");
    const shareCacheCheck = await executeQuery("SHOW TABLES LIKE 'share_cache'");

    if (shareStatsCheck.length === 0) {
      throw new Error('share_stats 表創建失敗');
    }

    if (shareCacheCheck.length === 0) {
      throw new Error('share_cache 表創建失敗');
    }

    logger.info('🎉 所有分享相關資料庫表創建完成！');
    
    return {
      success: true,
      tables: ['share_stats', 'share_cache']
    };

  } catch (error) {
    logger.error('創建分享相關資料庫表失敗:', error);
    throw error;
  }
}

// 如果直接執行此腳本
if (require.main === module) {
  createShareTables()
    .then((result) => {
      console.log('✅ 資料庫表創建成功:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 資料庫表創建失敗:', error);
      process.exit(1);
    });
}

module.exports = createShareTables;
