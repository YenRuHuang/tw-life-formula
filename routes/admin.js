const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// 管理員儀表板 - 暫時簡單實作
router.get('/dashboard', async(req, res, next) => {
  try {
    // 暫時返回模擬數據
    const dashboardData = {
      totalUsers: 1250,
      dailyActiveUsers: 89,
      totalToolUsage: 5420,
      popularTools: [
        { name: '月光族指數計算機', usage: 1850 },
        { name: '泡麵生存計算機', usage: 1420 },
        { name: '分手成本計算機', usage: 980 }
      ],
      revenue: {
        adsense: 125.50,
        subscriptions: 2970.00,
        total: 3095.50
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
