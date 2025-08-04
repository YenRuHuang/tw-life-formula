const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');
const toolManager = require('../services/ToolManager');
const User = require('../models/User');

// 獲取所有工具列表
router.get('/', async (req, res, next) => {
  try {
    const tools = toolManager.getAllTools(true);
    const categories = toolManager.getCategories();
    const stats = toolManager.getStats();

    res.json({
      success: true,
      data: {
        tools,
        categories,
        stats,
        total: tools.length
      }
    });

    logger.info('工具列表請求成功', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      toolCount: tools.length,
      categories: categories.length
    });
  } catch (error) {
    next(error);
  }
});

// 根據分類獲取工具
router.get('/category/:category', async (req, res, next) => {
  try {
    const { category } = req.params;
    const tools = toolManager.getToolsByCategory(category, true);

    res.json({
      success: true,
      data: {
        category,
        tools,
        total: tools.length
      }
    });

    logger.info('分類工具列表請求成功', {
      ip: req.ip,
      category,
      toolCount: tools.length
    });
  } catch (error) {
    next(error);
  }
});

// 獲取特定工具詳情
router.get('/:toolId', async (req, res, next) => {
  try {
    const { toolId } = req.params;
    const tool = toolManager.getTool(toolId);

    if (!tool) {
      throw new AppError('找不到指定的工具', 404, 'tool_not_found');
    }

    res.json({
      success: true,
      data: {
        id: tool.type,
        name: tool.name,
        description: tool.description,
        category: tool.category,
        icon: tool.icon,
        inputSchema: tool.inputSchema
      }
    });

    logger.info('工具詳情請求成功', {
      ip: req.ip,
      toolId
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

    // 使用 ToolManager 統一介面執行工具
    const result = await toolManager.executeTool(toolId, inputData, user.id);

    // 更新使用記錄（ToolManager 內部已處理）
    // 計算剩餘使用次數
    const remainingUsage = canUse.reason === 'premium_user' 
      ? -1 
      : Math.max(0, canUse.limit - canUse.usage - 1);

    // 組合最終回應
    const response = {
      ...result,
      usage: {
        remaining: remainingUsage,
        limit: canUse.reason === 'premium_user' ? -1 : canUse.limit
      }
    };

    res.json({
      success: true,
      data: response
    });

    logger.info('工具執行成功', {
      toolId,
      toolName: result.toolName,
      userId: user.id,
      ip: req.ip,
      inputData: Object.keys(inputData),
      resultValue: result.result.value,
      remainingUsage
    });
  } catch (error) {
    // ToolManager 會拋出具體的錯誤訊息
    if (error.message.includes('工具不存在') || error.message.includes('工具已停用')) {
      next(new AppError(error.message, 404, 'tool_not_found'));
    } else if (error.message.includes('輸入資料驗證失敗')) {
      next(new AppError(error.message, 400, 'validation_error'));
    } else {
      next(error);
    }
  }
});

module.exports = router;
