const ToolConfig = require('../models/ToolConfig');
const logger = require('../utils/logger');

/**
 * 核心工具管理系統
 * 負責工具註冊、載入、執行和分類管理
 */
class ToolManager {
  constructor() {
    this.tools = new Map(); // 工具實例快取
    this.categories = new Map(); // 分類映射
    this.initialized = false;
  }

  /**
   * 初始化工具管理系統
   */
  async initialize() {
    try {
      logger.info('初始化工具管理系統...');
      
      // 載入所有活躍工具配置
      const toolConfigs = await ToolConfig.getAllActive();
      
      // 註冊所有工具
      for (const config of toolConfigs) {
        await this.registerTool(config);
      }
      
      // 建立分類索引
      this.buildCategoryIndex();
      
      this.initialized = true;
      logger.info(`工具管理系統初始化完成，載入 ${this.tools.size} 個工具`);
      
      return {
        success: true,
        toolCount: this.tools.size,
        categories: Array.from(this.categories.keys())
      };
    } catch (error) {
      logger.error('工具管理系統初始化失敗:', error);
      throw error;
    }
  }

  /**
   * 註冊工具到系統中
   * @param {ToolConfig} toolConfig - 工具配置
   */
  async registerTool(toolConfig) {
    try {
      // 創建工具實例
      const toolInstance = {
        config: toolConfig,
        type: toolConfig.toolType,
        name: toolConfig.displayName,
        description: toolConfig.description,
        category: toolConfig.category,
        inputSchema: toolConfig.inputSchema,
        calculationLogic: toolConfig.calculationLogic,
        monetizationConfig: toolConfig.monetizationConfig,
        icon: toolConfig.getIcon(),
        isActive: toolConfig.isActive,
        // 工具執行方法
        execute: async (inputData, userId = null) => {
          return await this.executeTool(toolConfig.toolType, inputData, userId);
        },
        // 工具驗證方法
        validateInput: (inputData) => {
          return toolConfig.validateInput(inputData);
        }
      };

      // 註冊工具
      this.tools.set(toolConfig.toolType, toolInstance);
      
      // 記錄工具分類
      if (!this.categories.has(toolConfig.category)) {
        this.categories.set(toolConfig.category, []);
      }
      this.categories.get(toolConfig.category).push(toolConfig.toolType);
      
      logger.info(`工具註冊成功: ${toolConfig.toolType} (${toolConfig.displayName})`);
      
      return toolInstance;
    } catch (error) {
      logger.error(`工具註冊失敗: ${toolConfig.toolType}`, error);
      throw error;
    }
  }

  /**
   * 建立分類索引
   */
  buildCategoryIndex() {
    // 清空現有分類
    this.categories.clear();
    
    // 重新建立分類索引
    for (const [toolType, tool] of this.tools) {
      if (!this.categories.has(tool.category)) {
        this.categories.set(tool.category, []);
      }
      this.categories.get(tool.category).push(toolType);
    }
    
    logger.info(`分類索引建立完成，共 ${this.categories.size} 個分類`);
  }

  /**
   * 獲取所有工具列表
   * @param {boolean} publicOnly - 是否只返回公開資訊
   */
  getAllTools(publicOnly = true) {
    this.ensureInitialized();
    
    const toolsList = Array.from(this.tools.values());
    
    if (publicOnly) {
      return toolsList.map(tool => ({
        id: tool.type,
        name: tool.name,
        description: tool.description,
        category: tool.category,
        icon: tool.icon,
        inputSchema: tool.inputSchema
      }));
    }
    
    return toolsList;
  }

  /**
   * 根據工具類型獲取工具
   * @param {string} toolType - 工具類型
   */
  getTool(toolType) {
    this.ensureInitialized();
    return this.tools.get(toolType) || null;
  }

  /**
   * 根據分類獲取工具列表
   * @param {string} category - 分類名稱
   * @param {boolean} publicOnly - 是否只返回公開資訊
   */
  getToolsByCategory(category, publicOnly = true) {
    this.ensureInitialized();
    
    const toolTypes = this.categories.get(category) || [];
    const tools = toolTypes.map(type => this.tools.get(type)).filter(Boolean);
    
    if (publicOnly) {
      return tools.map(tool => ({
        id: tool.type,
        name: tool.name,
        description: tool.description,
        category: tool.category,
        icon: tool.icon,
        inputSchema: tool.inputSchema
      }));
    }
    
    return tools;
  }

  /**
   * 獲取所有分類
   */
  getCategories() {
    this.ensureInitialized();
    
    return Array.from(this.categories.keys()).map(category => ({
      name: category,
      displayName: this.getCategoryDisplayName(category),
      toolCount: this.categories.get(category).length,
      tools: this.categories.get(category)
    }));
  }

  /**
   * 統一工具執行介面
   * @param {string} toolType - 工具類型
   * @param {Object} inputData - 輸入資料
   * @param {string} userId - 用戶ID
   */
  async executeTool(toolType, inputData, userId = null) {
    try {
      this.ensureInitialized();
      
      // 獲取工具實例
      const tool = this.getTool(toolType);
      if (!tool) {
        throw new Error(`工具不存在: ${toolType}`);
      }
      
      if (!tool.isActive) {
        throw new Error(`工具已停用: ${toolType}`);
      }
      
      // 驗證輸入資料
      const validation = tool.validateInput(inputData);
      if (!validation.isValid) {
        throw new Error(`輸入資料驗證失敗: ${validation.errors.join(', ')}`);
      }
      
      // 記錄工具使用
      if (userId) {
        await this.recordToolUsage(toolType, inputData, userId);
      }
      
      // 執行工具計算邏輯
      const result = await this.executeCalculation(tool, inputData);
      
      // 生成結果資料
      const output = {
        toolType,
        toolName: tool.name,
        inputData,
        result,
        timestamp: new Date().toISOString(),
        userId,
        // 添加分享和變現配置
        shareConfig: this.generateShareConfig(tool, result),
        monetizationConfig: tool.monetizationConfig
      };
      
      logger.info(`工具執行成功: ${toolType}`, { userId, result: result.value });
      
      return output;
    } catch (error) {
      logger.error(`工具執行失敗: ${toolType}`, error);
      throw error;
    }
  }

  /**
   * 執行工具計算邏輯
   * @param {Object} tool - 工具實例
   * @param {Object} inputData - 輸入資料
   */
  async executeCalculation(tool, inputData) {
    try {
      const calculationLogic = tool.calculationLogic;
      
      // 根據工具類型執行不同的計算邏輯
      switch (tool.type) {
        case 'moonlight-calculator':
          return this.calculateMoonlightIndex(inputData, calculationLogic);
        
        case 'noodle-survival':
          return this.calculateNoodleSurvival(inputData, calculationLogic);
        
        case 'breakup-cost':
          return this.calculateBreakupCost(inputData, calculationLogic);
        
        case 'escape-taipei':
          return this.calculateEscapeTaipei(inputData, calculationLogic);
        
        case 'phone-lifespan':
          return this.calculatePhoneLifespan(inputData, calculationLogic);
        
        case 'car-vs-uber':
          return this.calculateCarVsUber(inputData, calculationLogic);
        
        case 'birthday-collision':
          return this.calculateBirthdayCollision(inputData, calculationLogic);
        
        case 'housing-index':
          return this.calculateHousingIndex(inputData, calculationLogic);
        
        default:
          // 通用計算邏輯（如果配置中定義了公式）
          return this.executeGenericCalculation(inputData, calculationLogic);
      }
    } catch (error) {
      logger.error(`計算邏輯執行失敗: ${tool.type}`, error);
      throw error;
    }
  }

  /**
   * 月光族指數計算 (示例實現)
   */
  calculateMoonlightIndex(inputData, logic) {
    const { monthly_income, monthly_expenses, age, location } = inputData;
    
    // 基礎月光族指數計算
    const baseIndex = Math.max(0, (monthly_expenses / monthly_income) * 100);
    
    // 年齡調整係數
    const ageMultiplier = age < 25 ? 1.2 : age > 35 ? 0.8 : 1.0;
    
    // 地區調整係數 (台北物價較高)
    const locationMultiplier = location === '台北市' ? 1.3 : 
                              location === '新北市' ? 1.1 : 1.0;
    
    const finalIndex = Math.min(100, baseIndex * ageMultiplier * locationMultiplier);
    
    // 生成震撼性描述
    let description = '';
    let level = '';
    
    if (finalIndex >= 95) {
      level = '超級月光族';
      description = '恭喜！你已經達到月光族的最高境界，每個月都是財務極限挑戰！';
    } else if (finalIndex >= 80) {
      level = '專業月光族';
      description = '你是月光族中的佼佼者，花錢技術已臻化境！';
    } else if (finalIndex >= 60) {
      level = '業餘月光族';
      description = '偶爾月光，但還有改善空間，繼續努力！';
    } else {
      level = '理財新手';
      description = '看起來你對金錢還有一定控制力，值得學習！';
    }
    
    return {
      value: Math.round(finalIndex),
      level,
      description,
      details: {
        baseIndex: Math.round(baseIndex),
        ageMultiplier,
        locationMultiplier,
        monthlyBalance: monthly_income - monthly_expenses
      },
      suggestions: this.generateMoonlightSuggestions(finalIndex, inputData)
    };
  }

  /**
   * 生成月光族改善建議
   */
  generateMoonlightSuggestions(index, inputData) {
    const suggestions = [];
    
    if (index >= 80) {
      suggestions.push('考慮建立緊急預備金，至少存3個月生活費');
      suggestions.push('使用記帳APP追蹤每日支出');
      suggestions.push('尋找副業或兼職增加收入來源');
    } else if (index >= 60) {
      suggestions.push('設定每月固定儲蓄目標');
      suggestions.push('減少非必要的娛樂支出');
    } else {
      suggestions.push('考慮投資理財，讓錢為你工作');
      suggestions.push('繼續保持良好的理財習慣');
    }
    
    return suggestions;
  }

  /**
   * 泡麵生存計算 (示例實現)
   */
  calculateNoodleSurvival(inputData, logic) {
    const { budget, noodle_price, daily_noodles } = inputData;
    
    const dailyCost = noodle_price * daily_noodles;
    const survivalDays = Math.floor(budget / dailyCost);
    
    let description = '';
    if (survivalDays >= 30) {
      description = '恭喜！你可以靠泡麵撐過一個月以上，真正的泡麵大師！';
    } else if (survivalDays >= 14) {
      description = '兩週的泡麵生存，足夠等到下次發薪日！';
    } else if (survivalDays >= 7) {
      description = '一週泡麵生活，省錢達人的選擇！';
    } else {
      description = '泡麵預算有限，建議考慮其他更經濟的選擇！';
    }
    
    return {
      value: survivalDays,
      unit: '天',
      description,
      details: {
        dailyCost,
        totalNoodles: survivalDays * daily_noodles,
        averageCostPerDay: dailyCost
      },
      suggestions: [
        '可以搭配一些蔬菜和蛋增加營養',
        '建議不要長期只吃泡麵',
        '尋找更多經濟實惠的食物選擇'
      ]
    };
  }

  /**
   * 通用計算邏輯執行器
   */
  executeGenericCalculation(inputData, logic) {
    // 如果工具配置中定義了通用計算公式，在這裡執行
    // 目前返回一個基本結果
    return {
      value: 'N/A',
      description: '此工具計算邏輯尚未實現',
      details: inputData
    };
  }

  /**
   * 生成分享配置
   */
  generateShareConfig(tool, result) {
    return {
      title: `我的${tool.name}結果是 ${result.value}${result.unit || ''}！`,
      description: result.description,
      hashtags: ['台灣人生算式', tool.category, result.level].filter(Boolean),
      url: `${process.env.BASE_URL || 'https://twlifeformula.zeabur.app'}?tool=${tool.type}`
    };
  }

  /**
   * 記錄工具使用
   */
  async recordToolUsage(toolType, inputData, userId) {
    try {
      const { executeQuery } = require('../config/database');
      
      await executeQuery(`
        INSERT INTO tool_usage (user_id, tool_type, input_data, created_at)
        VALUES (?, ?, ?, NOW())
      `, [userId, toolType, JSON.stringify(inputData)]);
      
    } catch (error) {
      logger.error('記錄工具使用失敗:', error);
      // 不拋出錯誤，避免影響主要功能
    }
  }

  /**
   * 獲取分類顯示名稱
   */
  getCategoryDisplayName(category) {
    const categoryMap = {
      'calculator': '計算機',
      'test': '測驗',
      'simulator': '模擬器',
      'analyzer': '分析器'
    };
    
    return categoryMap[category] || category;
  }

  /**
   * 確保系統已初始化
   */
  ensureInitialized() {
    if (!this.initialized) {
      throw new Error('工具管理系統尚未初始化，請先調用 initialize() 方法');
    }
  }

  /**
   * 重新載入工具配置
   */
  async reload() {
    logger.info('重新載入工具管理系統...');
    this.tools.clear();
    this.categories.clear();
    this.initialized = false;
    
    return await this.initialize();
  }

  /**
   * 獲取系統統計資訊
   */
  getStats() {
    this.ensureInitialized();
    
    return {
      totalTools: this.tools.size,
      activeTools: Array.from(this.tools.values()).filter(tool => tool.isActive).length,
      categories: this.categories.size,
      toolsByCategory: Object.fromEntries(
        Array.from(this.categories.entries()).map(([category, tools]) => [
          category,
          tools.length
        ])
      )
    };
  }
}

// 創建單例實例
const toolManager = new ToolManager();

module.exports = toolManager;
