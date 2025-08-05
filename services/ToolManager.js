const ToolConfig = require('../models/ToolConfig');
const logger = require('../utils/logger');
const aiContentGenerator = require('./AIContentGenerator');

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
      
      // 使用 AI 增強結果描述和建議
      const aiEnhancedResult = await this.enhanceResultWithAI(toolType, inputData, result, userId);
      
      // 生成結果資料
      const output = {
        toolType,
        toolName: tool.name,
        inputData,
        result: aiEnhancedResult,
        timestamp: new Date().toISOString(),
        userId,
        // 添加分享和變現配置
        shareConfig: this.generateShareConfig(tool, aiEnhancedResult),
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
   * 分手成本計算
   */
  calculateBreakupCost(inputData, logic) {
    const { relationship_months, monthly_spending, shared_assets } = inputData;
    
    // 計算時間成本
    const timeCost = relationship_months * monthly_spending;
    
    // 計算共同資產損失 (假設分手後損失一半)
    const assetLoss = shared_assets * 0.5;
    
    // 計算情感重建成本 (假設需要 6 個月重新適應)
    const emotionalCost = monthly_spending * 6;
    
    const totalCost = timeCost + assetLoss + emotionalCost;
    
    let description = '';
    if (totalCost >= 500000) {
      description = `哇！分手成本高達 ${Math.round(totalCost).toLocaleString()} 元，這可以買一台車了！`;
    } else if (totalCost >= 200000) {
      description = `分手成本 ${Math.round(totalCost).toLocaleString()} 元，相當於一次歐洲旅行的費用！`;
    } else {
      description = `分手成本 ${Math.round(totalCost).toLocaleString()} 元，還在可承受範圍內。`;
    }
    
    return {
      value: Math.round(totalCost),
      unit: '元',
      description,
      details: {
        timeCost: Math.round(timeCost),
        assetLoss: Math.round(assetLoss),
        emotionalCost: Math.round(emotionalCost),
        relationshipMonths: relationship_months
      },
      suggestions: [
        '理性看待感情投資，避免過度消費',
        '建立個人財務獨立性',
        '分手前先討論共同資產分配'
      ]
    };
  }

  /**
   * 手機壽命計算
   */
  calculatePhoneLifespan(inputData, logic) {
    const { phone_age_months, daily_usage_hours, phone_brand } = inputData;
    
    // 基礎壽命 (依品牌調整)
    const brandLifespan = {
      'iPhone': 48, // 4年
      'Samsung': 42, // 3.5年
      'Google': 36, // 3年
      'Xiaomi': 30, // 2.5年
      'Oppo': 30,
      'Vivo': 30,
      'Huawei': 36,
      'OnePlus': 36,
      '其他': 24 // 2年
    };
    
    const baseDaysLeft = (brandLifespan[phone_brand] || brandLifespan['其他'] - phone_age_months) * 30;
    
    // 使用強度調整
    const usageMultiplier = daily_usage_hours > 8 ? 0.7 : 
                           daily_usage_hours > 4 ? 0.85 : 1.0;
    
    const estimatedDaysLeft = Math.max(0, Math.round(baseDaysLeft * usageMultiplier));
    
    let description = '';
    if (estimatedDaysLeft > 365) {
      description = `你的 ${phone_brand} 還能撐 ${Math.round(estimatedDaysLeft/365*10)/10} 年，保養得不錯！`;
    } else if (estimatedDaysLeft > 30) {
      description = `你的手機預計還能用 ${Math.round(estimatedDaysLeft/30)} 個月，開始考慮換機吧！`;
    } else {
      description = `警告！你的手機隨時可能罷工，建議立即更換！`;
    }
    
    return {
      value: estimatedDaysLeft,
      unit: '天',
      description,
      details: {
        currentAge: phone_age_months,
        dailyUsage: daily_usage_hours,
        brand: phone_brand,
        usageLevel: daily_usage_hours > 8 ? '重度使用' : daily_usage_hours > 4 ? '中度使用' : '輕度使用'
      },
      suggestions: [
        '定期清理手機儲存空間',
        '避免邊充電邊玩手機',
        '使用手機殼和螢幕保護貼'
      ]
    };
  }

  /**
   * 蝸居指數計算
   */
  calculateHousingIndex(inputData, logic) {
    const { living_space, rent_price, city } = inputData;
    
    // 各城市平均租金 (每坪)
    const cityRentAverage = {
      '台北市': 2500,
      '新北市': 1800,
      '桃園市': 1200,
      '台中市': 1000,
      '台南市': 800,
      '高雄市': 900,
      '基隆市': 1200,
      '新竹市': 1500,
      '嘉義市': 700,
      '宜蘭縣': 900
    };
    
    const averageRent = cityRentAverage[city] || 1000;
    const yourRentPerPing = rent_price / living_space;
    const spaceRatio = living_space / 25; // 以25坪為基準
    
    // 蝸居指數計算 (越高越蝸居)
    const housingIndex = Math.min(100, 
      (yourRentPerPing / averageRent) * 100 * (spaceRatio < 1 ? (1/spaceRatio) : 1)
    );
    
    let description = '';
    let level = '';
    
    if (housingIndex >= 80) {
      level = '超級蝸居族';
      description = `你的蝸居指數高達 ${Math.round(housingIndex)}！空間小又貴，真正的都市蝸牛！`;
    } else if (housingIndex >= 60) {
      level = '蝸居中產';
      description = `蝸居指數 ${Math.round(housingIndex)}，在都市生存不容易，加油！`;
    } else {
      level = '居住幸福';
      description = `蝸居指數只有 ${Math.round(housingIndex)}，你的居住品質還不錯呢！`;
    }
    
    return {
      value: Math.round(housingIndex),
      level,
      description,
      details: {
        rentPerPing: Math.round(yourRentPerPing),
        cityAverage: averageRent,
        spaceRatio: Math.round(spaceRatio * 100) / 100
      },
      suggestions: [
        '考慮搬到租金較便宜的區域',
        '尋找室友分攤租金',
        '善用垂直空間增加收納'
      ]
    };
  }

  /**
   * 逃離台北計算
   */
  calculateEscapeTaipei(inputData, logic) {
    const { current_salary, target_city, lifestyle_level } = inputData;
    
    // 各城市生活成本係數 (相對台北)
    const cityCostRatio = {
      '台中市': 0.75,
      '台南市': 0.65,
      '高雄市': 0.70,
      '桃園市': 0.85,
      '新竹市': 0.80,
      '嘉義市': 0.60,
      '宜蘭縣': 0.70,
      '花蓮縣': 0.65,
      '台東縣': 0.60
    };
    
    // 生活水準調整係數
    const lifestyleMultiplier = {
      'basic': 0.8,
      'comfortable': 1.0,
      'luxury': 1.5
    };
    
    const targetCostRatio = cityCostRatio[target_city] || 0.70;
    const lifestyleRatio = lifestyleMultiplier[lifestyle_level] || 1.0;
    
    // 計算在目標城市需要的薪水
    const requiredSalary = current_salary * targetCostRatio * lifestyleRatio;
    const savings = current_salary - requiredSalary;
    const savingsPercentage = (savings / current_salary) * 100;
    
    let description = '';
    if (savingsPercentage > 30) {
      description = `太棒了！逃離台北到${target_city}，你每月可以省下 ${Math.round(savings).toLocaleString()} 元，省錢率 ${Math.round(savingsPercentage)}%！`;
    } else if (savingsPercentage > 10) {
      description = `搬到${target_city}可以省下 ${Math.round(savings).toLocaleString()} 元，省錢率 ${Math.round(savingsPercentage)}%，值得考慮！`;
    } else {
      description = `搬到${target_city}只能省下 ${Math.round(savings).toLocaleString()} 元，省錢效果有限。`;
    }
    
    return {
      value: Math.round(savings),
      unit: '元/月',
      description,
      details: {
        currentSalary: current_salary,
        requiredSalary: Math.round(requiredSalary),
        savingsPercentage: Math.round(savingsPercentage),
        targetCity: target_city,
        lifestyleLevel: lifestyle_level
      },
      suggestions: [
        '考慮遠距工作保持台北薪水',
        '研究目標城市的就業機會',
        '計算搬家和適應成本'
      ]
    };
  }

  /**
   * 養車 vs Uber 計算
   */
  calculateCarVsUber(inputData, logic) {
    const { car_price, monthly_fuel, monthly_trips } = inputData;
    
    // 車輛成本計算 (5年攤提)
    const monthlyCarPayment = car_price / 60; // 5年攤提
    const monthlyInsurance = 3000; // 平均保險費
    const monthlyMaintenance = 2000; // 平均保養費
    const monthlyParking = 3000; // 平均停車費
    
    const totalMonthlyCar = monthlyCarPayment + monthlyInsurance + 
                           monthlyMaintenance + monthlyParking + monthly_fuel;
    
    // Uber 成本計算
    const averageUberCost = 200; // 平均每趟 200 元
    const monthlyUberCost = monthly_trips * averageUberCost;
    
    const difference = totalMonthlyCar - monthlyUberCost;
    
    let description = '';
    let recommendation = '';
    
    if (difference > 10000) {
      recommendation = 'Uber';
      description = `養車比搭 Uber 貴 ${Math.round(difference).toLocaleString()} 元！強烈建議搭 Uber！`;
    } else if (difference > 5000) {
      recommendation = 'Uber';
      description = `養車比搭 Uber 貴 ${Math.round(difference).toLocaleString()} 元，建議搭 Uber 比較划算。`;
    } else if (difference > -5000) {
      recommendation = '差不多';
      description = `養車和搭 Uber 成本差不多，差異只有 ${Math.abs(Math.round(difference)).toLocaleString()} 元。`;
    } else {
      recommendation = '養車';
      description = `養車比搭 Uber 便宜 ${Math.abs(Math.round(difference)).toLocaleString()} 元，養車較划算！`;
    }
    
    return {
      value: Math.abs(Math.round(difference)),
      unit: '元/月',
      description,
      details: {
        carCost: Math.round(totalMonthlyCar),
        uberCost: Math.round(monthlyUberCost),
        recommendation,
        breakdown: {
          carPayment: Math.round(monthlyCarPayment),
          insurance: monthlyInsurance,
          maintenance: monthlyMaintenance,
          parking: monthlyParking,
          fuel: monthly_fuel
        }
      },
      suggestions: [
        '考慮用車頻率和距離',
        '評估停車便利性',
        '考慮汽車帶來的生活便利性'
      ]
    };
  }

  /**
   * 生日撞期計算
   */
  calculateBirthdayCollision(inputData, logic) {
    const { birth_month, birth_day } = inputData;
    
    // 台灣人口約 2300 萬
    const taiwanPopulation = 23000000;
    
    // 假設生日分布均勻 (365 天)
    const daysInYear = 365;
    const sameBirthdayPeople = Math.round(taiwanPopulation / daysInYear);
    
    // 特殊日期調整
    const specialDates = {
      '1-1': 1.2,   // 新年
      '2-14': 1.5,  // 情人節
      '10-10': 1.3, // 國慶日
      '12-25': 1.1  // 聖誕節
    };
    
    const dateKey = `${birth_month}-${birth_day}`;
    const multiplier = specialDates[dateKey] || 1.0;
    const adjustedCount = Math.round(sameBirthdayPeople * multiplier);
    
    // 計算在你生日當天全台灣有多少人慶生
    const birthdayPartyPeople = adjustedCount;
    
    let description = '';
    if (multiplier > 1.1) {
      description = `哇！你的生日是特殊日期，全台灣有約 ${adjustedCount.toLocaleString()} 人跟你同天生日，超熱鬧！`;
    } else {
      description = `全台灣約有 ${adjustedCount.toLocaleString()} 人跟你在同一天慶生，你們是生日夥伴！`;
    }
    
    return {
      value: adjustedCount,
      unit: '人',
      description,
      details: {
        birthDate: `${birth_month}/${birth_day}`,
        probability: Math.round((adjustedCount / taiwanPopulation) * 10000) / 100,
        isSpecialDate: multiplier > 1.0,
        taiwanPopulation
      },
      suggestions: [
        '可以在社群媒體上找找同生日的人',
        '特殊日期生日記得提早訂餐廳',
        '同生日的人可以組成生日俱樂部'
      ]
    };
  }

  /**
   * 使用 AI 增強計算結果
   * @param {string} toolType - 工具類型
   * @param {Object} inputData - 輸入資料
   * @param {Object} result - 原始計算結果
   * @param {string} userId - 用戶ID
   */
  async enhanceResultWithAI(toolType, inputData, result, userId = null) {
    try {
      // 並行生成 AI 內容
      const [descriptionResult, suggestionsResult, shareContentResult, comparisonsResult] = await Promise.allSettled([
        aiContentGenerator.generateResultDescription(toolType, inputData, result),
        aiContentGenerator.generateSuggestions(toolType, inputData, result),
        aiContentGenerator.generateShareContent(toolType, result, 'facebook'),
        aiContentGenerator.generateShockingComparisons(toolType, result)
      ]);

      // 建立增強後的結果
      const enhancedResult = { ...result };

      // 處理 AI 生成的描述
      if (descriptionResult.status === 'fulfilled' && descriptionResult.value) {
        if (descriptionResult.value.isAI && !descriptionResult.value.fallback) {
          enhancedResult.description = descriptionResult.value.description;
          enhancedResult.aiGenerated = true;
        }
        enhancedResult.descriptionMetadata = {
          isAI: descriptionResult.value.isAI,
          fallback: descriptionResult.value.fallback
        };
      }

      // 處理 AI 生成的建議
      if (suggestionsResult.status === 'fulfilled' && suggestionsResult.value) {
        if (suggestionsResult.value.isAI && !suggestionsResult.value.fallback) {
          enhancedResult.suggestions = suggestionsResult.value.suggestions;
        }
        enhancedResult.suggestionsMetadata = {
          isAI: suggestionsResult.value.isAI,
          fallback: suggestionsResult.value.fallback
        };
      }

      // 處理分享內容
      if (shareContentResult.status === 'fulfilled' && shareContentResult.value) {
        enhancedResult.shareContent = {
          facebook: shareContentResult.value.content,
          isAI: shareContentResult.value.isAI,
          fallback: shareContentResult.value.fallback
        };
      }

      // 處理震撼比較
      if (comparisonsResult.status === 'fulfilled' && comparisonsResult.value) {
        enhancedResult.shockingComparisons = {
          comparisons: comparisonsResult.value.comparisons,
          isAI: comparisonsResult.value.isAI,
          fallback: comparisonsResult.value.fallback
        };
      }

      // 記錄 AI 增強狀態
      enhancedResult.aiEnhanced = true;
      enhancedResult.enhancementTimestamp = new Date().toISOString();

      logger.info(`🤖 AI 增強結果完成: ${toolType}`, {
        hasAIDescription: enhancedResult.descriptionMetadata?.isAI,
        hasAISuggestions: enhancedResult.suggestionsMetadata?.isAI,
        hasAIShare: enhancedResult.shareContent?.isAI,
        hasAIComparisons: enhancedResult.shockingComparisons?.isAI
      });

      return enhancedResult;

    } catch (error) {
      logger.error(`AI 增強失敗: ${toolType}`, error);
      
      // AI 增強失敗時返回原始結果
      return {
        ...result,
        aiEnhanced: false,
        enhancementError: error.message
      };
    }
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
