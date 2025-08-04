const { executeQuery, executeTransaction } = require('../config/database');
const logger = require('../utils/logger');

class DatabaseService {
  // 記錄分享統計
  static async recordShare(toolUsageId, platform) {
    try {
      await executeQuery(`
        INSERT INTO share_stats (tool_usage_id, platform)
        VALUES (?, ?)
      `, [toolUsageId, platform]);

      // 更新工具使用記錄的分享狀態
      await executeQuery(`
        UPDATE tool_usage SET shared = true WHERE id = ?
      `, [toolUsageId]);

      logger.info('分享統計記錄成功', { toolUsageId, platform });
    } catch (error) {
      logger.error('記錄分享統計失敗:', error);
      throw error;
    }
  }

  // 記錄分享點擊
  static async recordShareClick(shareStatsId) {
    try {
      await executeQuery(`
        UPDATE share_stats SET clicks = clicks + 1 WHERE id = ?
      `, [shareStatsId]);

      logger.info('分享點擊記錄成功', { shareStatsId });
    } catch (error) {
      logger.error('記錄分享點擊失敗:', error);
      throw error;
    }
  }

  // 記錄廣告統計
  static async recordAdStats(userId, adUnitId, pageType, impressions = 1, clicks = 0, revenue = 0) {
    try {
      const today = new Date().toISOString().split('T')[0];

      await executeQuery(`
        INSERT INTO ad_stats (user_id, ad_unit_id, page_type, impressions, clicks, revenue, date)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          impressions = impressions + VALUES(impressions),
          clicks = clicks + VALUES(clicks),
          revenue = revenue + VALUES(revenue)
      `, [userId, adUnitId, pageType, impressions, clicks, revenue, today]);

      logger.info('廣告統計記錄成功', { userId, adUnitId, pageType });
    } catch (error) {
      logger.error('記錄廣告統計失敗:', error);
      throw error;
    }
  }

  // 獲取工具使用統計
  static async getToolUsageStats(days = 30) {
    try {
      const stats = await executeQuery(`
        SELECT
          tc.tool_type,
          tc.display_name,
          tc.category,
          COUNT(tu.id) as total_usage,
          COUNT(DISTINCT tu.user_id) as unique_users,
          SUM(CASE WHEN tu.shared = true THEN 1 ELSE 0 END) as total_shares,
          AVG(CASE WHEN tu.shared = true THEN 1 ELSE 0 END) * 100 as share_rate
        FROM tool_configs tc
        LEFT JOIN tool_usage tu ON tc.tool_type = tu.tool_type
          AND tu.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        WHERE tc.is_active = true
        GROUP BY tc.tool_type, tc.display_name, tc.category
        ORDER BY total_usage DESC
      `, [days]);

      return stats;
    } catch (error) {
      logger.error('獲取工具使用統計失敗:', error);
      throw error;
    }
  }

  // 獲取用戶統計
  static async getUserStats(days = 30) {
    try {
      const stats = await executeQuery(`
        SELECT
          COUNT(DISTINCT u.id) as total_users,
          COUNT(DISTINCT CASE WHEN u.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) THEN u.id END) as new_users,
          COUNT(DISTINCT CASE WHEN u.last_active >= DATE_SUB(NOW(), INTERVAL 1 DAY) THEN u.id END) as daily_active_users,
          COUNT(DISTINCT CASE WHEN u.last_active >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN u.id END) as weekly_active_users,
          COUNT(DISTINCT us.user_id) as premium_users
        FROM users u
        LEFT JOIN user_subscriptions us ON u.id = us.user_id AND us.tier = 'premium' AND us.status = 'active'
      `, [days]);

      return stats[0];
    } catch (error) {
      logger.error('獲取用戶統計失敗:', error);
      throw error;
    }
  }

  // 獲取廣告收益統計
  static async getAdRevenueStats(days = 30) {
    try {
      const stats = await executeQuery(`
        SELECT
          SUM(impressions) as total_impressions,
          SUM(clicks) as total_clicks,
          SUM(revenue) as total_revenue,
          AVG(clicks / NULLIF(impressions, 0)) * 100 as avg_ctr,
          COUNT(DISTINCT user_id) as unique_users
        FROM ad_stats
        WHERE date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      `, [days]);

      return stats[0];
    } catch (error) {
      logger.error('獲取廣告收益統計失敗:', error);
      throw error;
    }
  }

  // 獲取分享統計
  static async getShareStats(days = 30) {
    try {
      const stats = await executeQuery(`
        SELECT
          ss.platform,
          COUNT(*) as total_shares,
          SUM(ss.clicks) as total_clicks,
          AVG(ss.clicks) as avg_clicks_per_share,
          tc.display_name as tool_name
        FROM share_stats ss
        JOIN tool_usage tu ON ss.tool_usage_id = tu.id
        JOIN tool_configs tc ON tu.tool_type = tc.tool_type
        WHERE ss.shared_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY ss.platform, tc.display_name
        ORDER BY total_shares DESC
      `, [days]);

      return stats;
    } catch (error) {
      logger.error('獲取分享統計失敗:', error);
      throw error;
    }
  }

  // 清理舊資料
  static async cleanupOldData(daysToKeep = 90) {
    try {
      const queries = [
        {
          sql: 'DELETE FROM tool_usage WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)',
          params: [daysToKeep]
        },
        {
          sql: 'DELETE FROM share_stats WHERE shared_at < DATE_SUB(NOW(), INTERVAL ? DAY)',
          params: [daysToKeep]
        },
        {
          sql: 'DELETE FROM ad_stats WHERE date < DATE_SUB(CURDATE(), INTERVAL ? DAY)',
          params: [daysToKeep]
        },
        {
          sql: 'DELETE FROM usage_limits WHERE date < DATE_SUB(CURDATE(), INTERVAL ? DAY)',
          params: [daysToKeep]
        }
      ];

      const results = await executeTransaction(queries);

      let totalDeleted = 0;
      results.forEach(result => {
        totalDeleted += result.affectedRows || 0;
      });

      logger.info('舊資料清理完成', {
        daysToKeep,
        totalDeleted,
        tables: ['tool_usage', 'share_stats', 'ad_stats', 'usage_limits']
      });

      return totalDeleted;
    } catch (error) {
      logger.error('清理舊資料失敗:', error);
      throw error;
    }
  }

  // 獲取資料庫健康狀態
  static async getHealthStatus() {
    try {
      const checks = [];

      // 檢查資料庫連接
      try {
        await executeQuery('SELECT 1');
        checks.push({ name: 'database_connection', status: 'healthy' });
      } catch (error) {
        checks.push({ name: 'database_connection', status: 'unhealthy', error: error.message });
      }

      // 檢查表格存在性
      const requiredTables = [
        'users', 'tool_usage', 'tool_configs', 'share_stats',
        'user_subscriptions', 'ad_stats', 'usage_limits'
      ];

      for (const table of requiredTables) {
        try {
          await executeQuery(`SELECT COUNT(*) FROM ${table} LIMIT 1`);
          checks.push({ name: `table_${table}`, status: 'healthy' });
        } catch (error) {
          checks.push({ name: `table_${table}`, status: 'unhealthy', error: error.message });
        }
      }

      // 檢查資料完整性
      try {
        const toolCount = await executeQuery('SELECT COUNT(*) as count FROM tool_configs WHERE is_active = true');
        if (toolCount[0].count > 0) {
          checks.push({ name: 'tool_configs_data', status: 'healthy', count: toolCount[0].count });
        } else {
          checks.push({ name: 'tool_configs_data', status: 'warning', message: 'No active tools found' });
        }
      } catch (error) {
        checks.push({ name: 'tool_configs_data', status: 'unhealthy', error: error.message });
      }

      const overallStatus = checks.every(check => check.status === 'healthy') ? 'healthy' : 'degraded';

      return {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        checks
      };
    } catch (error) {
      logger.error('獲取資料庫健康狀態失敗:', error);
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  // 備份重要資料
  static async backupData() {
    try {
      const backupData = {};

      // 備份工具配置
      backupData.tool_configs = await executeQuery('SELECT * FROM tool_configs');

      // 備份用戶統計（不包含個人資料）
      backupData.user_stats = await executeQuery(`
        SELECT
          DATE(created_at) as date,
          COUNT(*) as new_users_count
        FROM users
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY DATE(created_at)
      `);

      // 備份工具使用統計
      backupData.usage_stats = await executeQuery(`
        SELECT
          tool_type,
          DATE(created_at) as date,
          COUNT(*) as usage_count
        FROM tool_usage
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY tool_type, DATE(created_at)
      `);

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `backup_${timestamp}.json`;

      logger.info('資料備份完成', {
        backupFileName,
        tables: Object.keys(backupData),
        totalRecords: Object.values(backupData).reduce((sum, data) => sum + data.length, 0)
      });

      return {
        fileName: backupFileName,
        data: backupData,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('資料備份失敗:', error);
      throw error;
    }
  }
}

module.exports = DatabaseService;
