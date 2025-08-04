const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const DatabaseService = require('../services/DatabaseService');

// 管理員儀表板
router.get('/dashboard', async(req, res, next) => {
  try {
    const [userStats, toolStats, adStats, shareStats] = await Promise.all([
      DatabaseService.getUserStats(30),
      DatabaseService.getToolUsageStats(30),
      DatabaseService.getAdRevenueStats(30),
      DatabaseService.getShareStats(30)
    ]);

    const dashboardData = {
      users: {
        total: userStats.total_users,
        new: userStats.new_users,
        dailyActive: userStats.daily_active_users,
        weeklyActive: userStats.weekly_active_users,
        premium: userStats.premium_users
      },
      tools: {
        totalUsage: toolStats.reduce((sum, tool) => sum + tool.total_usage, 0),
        uniqueUsers: toolStats.reduce((sum, tool) => sum + tool.unique_users, 0),
        popularTools: toolStats.slice(0, 5).map(tool => ({
          name: tool.display_name,
          usage: tool.total_usage,
          uniqueUsers: tool.unique_users,
          shareRate: parseFloat(tool.share_rate).toFixed(1)
        }))
      },
      ads: {
        impressions: adStats.total_impressions || 0,
        clicks: adStats.total_clicks || 0,
        revenue: parseFloat(adStats.total_revenue || 0).toFixed(2),
        ctr: parseFloat(adStats.avg_ctr || 0).toFixed(2)
      },
      shares: {
        total: shareStats.reduce((sum, share) => sum + share.total_shares, 0),
        totalClicks: shareStats.reduce((sum, share) => sum + share.total_clicks, 0),
        byPlatform: shareStats.reduce((acc, share) => {
          if (!acc[share.platform]) {
            acc[share.platform] = { shares: 0, clicks: 0 };
          }
          acc[share.platform].shares += share.total_shares;
          acc[share.platform].clicks += share.total_clicks;
          return acc;
        }, {})
      }
    };

    res.json({
      success: true,
      data: dashboardData
    });

    logger.info('管理員儀表板數據請求', {
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

// 資料庫健康檢查
router.get('/health', async(req, res, next) => {
  try {
    const healthStatus = await DatabaseService.getHealthStatus();

    res.json({
      success: true,
      data: healthStatus
    });

    logger.info('資料庫健康檢查請求', {
      status: healthStatus.status,
      ip: req.ip
    });
  } catch (error) {
    next(error);
  }
});

// 清理舊資料
router.post('/cleanup', async(req, res, next) => {
  try {
    const { daysToKeep = 90 } = req.body;
    const deletedCount = await DatabaseService.cleanupOldData(daysToKeep);

    res.json({
      success: true,
      data: {
        deletedRecords: deletedCount,
        daysToKeep
      }
    });

    logger.info('資料清理完成', {
      deletedRecords: deletedCount,
      daysToKeep,
      ip: req.ip
    });
  } catch (error) {
    next(error);
  }
});

// 備份資料
router.post('/backup', async(req, res, next) => {
  try {
    const backup = await DatabaseService.backupData();

    res.json({
      success: true,
      data: {
        fileName: backup.fileName,
        timestamp: backup.timestamp,
        recordCount: Object.values(backup.data).reduce((sum, data) => sum + data.length, 0)
      }
    });

    logger.info('資料備份完成', {
      fileName: backup.fileName,
      ip: req.ip
    });
  } catch (error) {
    next(error);
  }
});
