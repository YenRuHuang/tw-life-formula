const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');
const ToolConfig = require('../models/ToolConfig');
const User = require('../models/User');

// 獲取所有工具列表
router.get('/', async (req, res, next) => {
  try {
    const tools = await ToolConfig.getAllActive();

    res.json({
      success: true,
      data: {
        tools: tools.map(tool => tool.toPublicJSON()),
        total: tools.length
      }
    });

    logger.info('工具列表請求成功', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      toolCount: tools.length
    });
  } catch (error) {
    next(error);
  }
});

// 執行特定工具
router.post('/:toolId', async (req, res, next) => {
  try {
    const { toolId } = req.params;
    const inputData = req.body;

    // 基本驗證
    if (!toolId) {
      throw new AppError('工具 ID 不能為空', 400, 'missing_tool_id');
    }

    // 獲取工具配置
    const toolConfig = await ToolConfig.findByType(toolId);
    if (!toolConfig) {
      throw new AppError('找不到指定的工具', 404, 'tool_not_found');
    }

    // 驗證輸入資料
    const validation = toolConfig.validateInput(inputData);
    if (!validation.isValid) {
      throw new AppError(`輸入資料驗證失敗: ${validation.errors.join(', ')}`, 400, 'validation_error');
    }

    // 獲取或建立用戶
    const sessionId = req.session.userId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    req.session.userId = sessionId;

    const user = await User.findOrCreateBySessionId(sessionId);

    // 檢查使用權限
    const canUse = await user.canUseTool();
    if (!canUse.canUse) {
      throw new AppError(
        canUse.reason === 'daily_limit_exceeded'
          ? `今日使用次數已達上限 (${canUse.usage}/${canUse.limit})，請升級為高級用戶或明天再試`
          : '無法使用此工具',
        429,
        'usage_limit_exceeded'
      );
    }

    // 暫時返回模擬結果，後續會實作真正的計算邏輯
    const mockResult = {
      toolId,
      result: {
        value: 87,
        message: '你比 87% 的人更月光！',
        suggestions: ['開始記帳', '減少不必要支出', '建立緊急預備金']
      },
      timestamp: new Date().toISOString(),
      usage: {
        remaining: canUse.reason === 'premium_user' ? -1 : (canUse.limit - canUse.usage - 1),
        limit: canUse.reason === 'premium_user' ? -1 : canUse.limit
      }
    };

    // 記錄工具使用
    await user.recordToolUsage(toolId, inputData, mockResult.result);

    res.json({
      success: true,
      data: mockResult
    });

    logger.info('工具執行成功', {
      toolId,
      userId: user.id,
      ip: req.ip,
      inputData: Object.keys(inputData),
      remainingUsage: mockResult.usage.remaining
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
