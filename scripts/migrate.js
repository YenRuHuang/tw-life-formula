const { connectDatabase, executeQuery } = require('../config/database');
const logger = require('../utils/logger');

// 資料庫遷移腳本
const migrations = [
  {
    name: '001_create_users_table',
    sql: `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        preferences JSON DEFAULT '{}',
        INDEX idx_session_id (session_id),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  },
  {
    name: '002_create_tool_usage_table',
    sql: `
      CREATE TABLE IF NOT EXISTS tool_usage (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        tool_type VARCHAR(100) NOT NULL,
        input_data JSON NOT NULL,
        result_data JSON NOT NULL,
        shared BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_tool_type (tool_type),
        INDEX idx_created_at (created_at),
        INDEX idx_shared (shared)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  },
  {
    name: '003_create_share_stats_table',
    sql: `
      CREATE TABLE IF NOT EXISTS share_stats (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tool_usage_id INT NOT NULL,
        platform VARCHAR(50) NOT NULL,
        shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        clicks INT DEFAULT 0,
        conversions INT DEFAULT 0,
        FOREIGN KEY (tool_usage_id) REFERENCES tool_usage(id) ON DELETE CASCADE,
        INDEX idx_tool_usage_id (tool_usage_id),
        INDEX idx_platform (platform),
        INDEX idx_shared_at (shared_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  },
  {
    name: '004_create_tool_configs_table',
    sql: `
      CREATE TABLE IF NOT EXISTS tool_configs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tool_type VARCHAR(100) UNIQUE NOT NULL,
        display_name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(50) NOT NULL,
        input_schema JSON NOT NULL,
        calculation_logic JSON NOT NULL,
        monetization_config JSON DEFAULT '{}',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_tool_type (tool_type),
        INDEX idx_category (category),
        INDEX idx_is_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  },
  {
    name: '005_create_user_subscriptions_table',
    sql: `
      CREATE TABLE IF NOT EXISTS user_subscriptions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        tier VARCHAR(50) DEFAULT 'free',
        stripe_customer_id VARCHAR(255),
        stripe_subscription_id VARCHAR(255),
        status VARCHAR(50) DEFAULT 'active',
        current_period_start TIMESTAMP NULL,
        current_period_end TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_tier (tier),
        INDEX idx_status (status),
        INDEX idx_stripe_customer_id (stripe_customer_id),
        UNIQUE KEY unique_user_subscription (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  },
  {
    name: '006_create_ad_stats_table',
    sql: `
      CREATE TABLE IF NOT EXISTS ad_stats (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        ad_unit_id VARCHAR(100) NOT NULL,
        page_type VARCHAR(50) NOT NULL,
        impressions INT DEFAULT 0,
        clicks INT DEFAULT 0,
        revenue DECIMAL(10,4) DEFAULT 0.0000,
        date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_user_id (user_id),
        INDEX idx_ad_unit_id (ad_unit_id),
        INDEX idx_page_type (page_type),
        INDEX idx_date (date),
        UNIQUE KEY unique_daily_stat (user_id, ad_unit_id, page_type, date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  },
  {
    name: '007_create_usage_limits_table',
    sql: `
      CREATE TABLE IF NOT EXISTS usage_limits (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        date DATE NOT NULL,
        tool_usage_count INT DEFAULT 0,
        daily_limit INT DEFAULT 10,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_date (date),
        UNIQUE KEY unique_daily_usage (user_id, date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  },
  {
    name: '008_create_migration_history_table',
    sql: `
      CREATE TABLE IF NOT EXISTS migration_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        migration_name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_migration_name (migration_name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  }
];

async function runMigrations() {
  try {
    logger.info('開始執行資料庫遷移...');

    // 連接資料庫
    await connectDatabase();

    // 先建立遷移歷史表
    const migrationHistoryMigration = migrations.find(m => m.name === '008_create_migration_history_table');
    if (migrationHistoryMigration) {
      await executeQuery(migrationHistoryMigration.sql);
      logger.info('遷移歷史表建立完成');
    }

    // 檢查已執行的遷移
    const executedMigrations = await executeQuery(
      'SELECT migration_name FROM migration_history'
    );
    const executedNames = executedMigrations.map(row => row.migration_name);

    // 執行未執行的遷移
    for (const migration of migrations) {
      if (!executedNames.includes(migration.name)) {
        logger.info(`執行遷移: ${migration.name}`);

        try {
          await executeQuery(migration.sql);

          // 記錄遷移歷史
          await executeQuery(
            'INSERT INTO migration_history (migration_name) VALUES (?)',
            [migration.name]
          );

          logger.info(`遷移完成: ${migration.name}`);
        } catch (error) {
          logger.error(`遷移失敗: ${migration.name}`, error);
          throw error;
        }
      } else {
        logger.info(`跳過已執行的遷移: ${migration.name}`);
      }
    }

    logger.info('所有資料庫遷移執行完成！');

    // 顯示資料庫狀態
    await showDatabaseStatus();

  } catch (error) {
    logger.error('資料庫遷移失敗:', error);
    process.exit(1);
  }
}

async function showDatabaseStatus() {
  try {
    logger.info('=== 資料庫狀態 ===');

    // 顯示所有表格
    const tables = await executeQuery('SHOW TABLES');
    logger.info(`資料表數量: ${tables.length}`);

    for (const table of tables) {
      const tableName = Object.values(table)[0];
      const count = await executeQuery(`SELECT COUNT(*) as count FROM ${tableName}`);
      logger.info(`- ${tableName}: ${count[0].count} 筆記錄`);
    }

  } catch (error) {
    logger.error('無法顯示資料庫狀態:', error);
  }
}

// 如果直接執行此腳本
if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations, migrations };
