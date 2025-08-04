const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');

// 獲取所有工具列表
router.get('/', async(req, res, next) => {
  try {
    // 暫時返回靜態數據，後續會從資料庫讀取
    const tools = [
      {
        id: 'moonlight-calculator',
        name: '月光族指數計算機',
        description: '計算你的月光族指數，看看你比多少人更月光',
        category: 'calculator',
        icon: '💸',
        isActive: true
      },
      {
        id: 'noodle-survival',
        name: '泡麵生存計算機',
        description: '計算如果失業，你可以吃泡麵活多少天',
        category: 'calculator',
        icon: '🍜',
        isActive: true
      },
      {
        id: 'breakup-cost',
        name: '分手成本計算機',
        description: '分析分手將損失多少金錢和回憶',
        category: 'calculator',
        icon: '💔',
        isActive: true
      }
    ];

    res.json({
      success: true,
      data: {
        tools,
        total: tools.length
      }
    });

    logger.info('工具列表請求成功', {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  } catch (error) {
    next(error);
  }
});

// 執行特定工具
router.post('/:toolId', async(req, res, next) => {
  try {
    const { toolId } = req.params;
    const inputData = req.body;

    // 基本驗證
    if (!toolId) {
      throw new AppError('工具 ID 不能為空', 400, 'missing_tool_id');
    }

    // 暫時返回模擬結果，後續會實作真正的計算邏輯
    const mockResult = {
      toolId,
      result: {
        value: 87,
        message: '你比 87% 的人更月光！',
        suggestions: ['開始記帳', '減少不必要支出', '建立緊急預備金']
      },
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: mockResult
    });

    logger.info('工具執行成功', {
      toolId,
      ip: req.ip,
      inputData: Object.keys(inputData)
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
