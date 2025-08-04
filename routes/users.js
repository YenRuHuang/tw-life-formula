const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// 用戶會話管理
router.post('/session', async(req, res, next) => {
  try {
    // 建立或獲取用戶會話
    if (!req.session.userId) {
      req.session.userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      req.session.createdAt = new Date().toISOString();
      req.session.tier = 'free';
      req.session.dailyUsage = 0;
    }

    res.json({
      success: true,
      data: {
        userId: req.session.userId,
        tier: req.session.tier,
        dailyUsage: req.session.dailyUsage,
        createdAt: req.session.createdAt
      }
    });

    logger.info('用戶會話建立/獲取成功', {
      userId: req.session.userId,
      ip: req.ip
    });
  } catch (error) {
    next(error);
  }
});

// 獲取用戶使用統計
router.get('/stats', async(req, res, next) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({
        success: false,
        error: {
          type: 'unauthorized',
          message: '請先建立會話'
        }
      });
    }

    // 暫時返回模擬數據
    const stats = {
      totalUsage: req.session.dailyUsage || 0,
      dailyLimit: req.session.tier === 'premium' ? -1 : 10,
      remainingUsage: req.session.tier === 'premium' ? -1 : Math.max(0, 10 - (req.session.dailyUsage || 0)),
      tier: req.session.tier
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
