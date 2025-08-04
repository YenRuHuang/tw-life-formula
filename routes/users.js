const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const User = require('../models/User');

// 用戶會話管理
router.post('/session', async(req, res, next) => {
  try {
    // 建立或獲取用戶會話
    if (!req.session.userId) {
      req.session.userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    const user = await User.findOrCreateBySessionId(req.session.userId);
    const subscription = await user.getSubscription();
    const todayUsage = await user.getTodayUsage();

    res.json({
      success: true,
      data: {
        userId: user.sessionId,
        tier: subscription ? subscription.tier : 'free',
        dailyUsage: todayUsage.tool_usage_count,
        dailyLimit: todayUsage.daily_limit,
        createdAt: user.createdAt,
        lastActive: user.lastActive
      }
    });

    logger.info('用戶會話建立/獲取成功', {
      userId: user.sessionId,
      tier: subscription ? subscription.tier : 'free',
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

    const user = await User.findOrCreateBySessionId(req.session.userId);
    const subscription = await user.getSubscription();
    const todayUsage = await user.getTodayUsage();
    const usageHistory = await user.getUsageHistory(5);

    const stats = {
      totalUsage: todayUsage.tool_usage_count,
      dailyLimit: subscription && subscription.tier === 'premium' ? -1 : todayUsage.daily_limit,
      remainingUsage: subscription && subscription.tier === 'premium'
        ? -1
        : Math.max(0, todayUsage.daily_limit - todayUsage.tool_usage_count),
      tier: subscription ? subscription.tier : 'free',
      recentUsage: usageHistory
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
