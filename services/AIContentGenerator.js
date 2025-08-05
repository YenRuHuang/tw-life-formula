const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');

/**
 * AI 內容生成器
 * 使用 Gemini Pro 生成個性化、震撼的結果描述和建議
 */
class AIContentGenerator {
  constructor() {
    this.genAI = null;
    this.model = null;
    this.initialized = false;
    this.fallbackMode = false; // 備用模式，當 API 不可用時使用預設內容
  }

  /**
   * 初始化 Gemini Pro AI
   */
  async initialize() {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey || apiKey.trim() === '') {
        logger.warn('GEMINI_API_KEY 未設置，啟用備用模式');
        this.fallbackMode = true;
        this.initialized = true;
        return { success: true, mode: 'fallback' };
      }

      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      // 測試 API 連接
      await this.testConnection();
      
      this.initialized = true;
      this.fallbackMode = false;
      
      logger.info('🤖 Gemini Pro AI 初始化成功');
      return { success: true, mode: 'ai' };
      
    } catch (error) {
      logger.error('Gemini Pro AI 初始化失敗，啟用備用模式:', error);
      this.fallbackMode = true;
      this.initialized = true;
      return { success: true, mode: 'fallback', error: error.message };
    }
  }

  /**
   * 測試 API 連接
   */
  async testConnection() {
    if (this.fallbackMode) return true;
    
    try {
      const result = await this.model.generateContent('測試');
      return !!result.response.text();
    } catch (error) {
      throw new Error(`API 連接測試失敗: ${error.message}`);
    }
  }

  /**
   * 生成個性化結果描述
   * @param {string} toolType - 工具類型
   * @param {Object} inputData - 輸入資料
   * @param {Object} calculationResult - 計算結果
   * @param {Object} userProfile - 用戶資料（可選）
   */
  async generateResultDescription(toolType, inputData, calculationResult, userProfile = null) {
    try {
      this.ensureInitialized();

      if (this.fallbackMode) {
        return this.getFallbackDescription(toolType, calculationResult);
      }

      const prompt = this.buildDescriptionPrompt(toolType, inputData, calculationResult, userProfile);
      const result = await this.model.generateContent(prompt);
      const aiDescription = result.response.text();

      logger.info(`🤖 AI 生成結果描述成功: ${toolType}`);
      
      return {
        description: aiDescription,
        isAI: true,
        fallback: false
      };

    } catch (error) {
      logger.error(`AI 描述生成失敗: ${toolType}`, error);
      
      // 發生錯誤時使用備用描述
      return {
        ...this.getFallbackDescription(toolType, calculationResult),
        fallback: true,
        error: error.message
      };
    }
  }

  /**
   * 生成個性化改善建議
   * @param {string} toolType - 工具類型  
   * @param {Object} inputData - 輸入資料
   * @param {Object} calculationResult - 計算結果
   */
  async generateSuggestions(toolType, inputData, calculationResult) {
    try {
      this.ensureInitialized();

      if (this.fallbackMode) {
        return this.getFallbackSuggestions(toolType, calculationResult);
      }

      const prompt = this.buildSuggestionsPrompt(toolType, inputData, calculationResult);
      const result = await this.model.generateContent(prompt);
      const aiSuggestions = result.response.text();

      // 解析 AI 回應為建議列表
      const suggestions = this.parseSuggestions(aiSuggestions);

      logger.info(`🤖 AI 生成改善建議成功: ${toolType}`);
      
      return {
        suggestions,
        isAI: true,
        fallback: false
      };

    } catch (error) {
      logger.error(`AI 建議生成失敗: ${toolType}`, error);
      
      return {
        suggestions: this.getFallbackSuggestions(toolType, calculationResult),
        fallback: true,
        error: error.message
      };
    }
  }

  /**
   * 生成病毒式分享文案
   * @param {string} toolType - 工具類型
   * @param {Object} calculationResult - 計算結果  
   * @param {string} platform - 分享平台 (facebook, line, instagram)
   */
  async generateShareContent(toolType, calculationResult, platform = 'facebook') {
    try {
      this.ensureInitialized();

      if (this.fallbackMode) {
        return this.getFallbackShareContent(toolType, calculationResult, platform);
      }

      const prompt = this.buildSharePrompt(toolType, calculationResult, platform);
      const result = await this.model.generateContent(prompt);
      const aiShareContent = result.response.text();

      logger.info(`🤖 AI 生成分享文案成功: ${toolType} - ${platform}`);
      
      return {
        content: aiShareContent,
        platform,
        isAI: true,
        fallback: false
      };

    } catch (error) {
      logger.error(`AI 分享文案生成失敗: ${toolType}`, error);
      
      return {
        ...this.getFallbackShareContent(toolType, calculationResult, platform),
        fallback: true,
        error: error.message
      };
    }
  }

  /**
   * 生成震撼性比較數據
   * @param {string} toolType - 工具類型
   * @param {Object} calculationResult - 計算結果
   */
  async generateShockingComparisons(toolType, calculationResult) {
    try {
      this.ensureInitialized();

      if (this.fallbackMode) {
        return this.getFallbackComparisons(toolType, calculationResult);
      }

      const prompt = this.buildComparisonPrompt(toolType, calculationResult);
      const result = await this.model.generateContent(prompt);
      const aiComparisons = result.response.text();

      // 解析比較數據
      const comparisons = this.parseComparisons(aiComparisons);

      logger.info(`🤖 AI 生成震撼比較成功: ${toolType}`);
      
      return {
        comparisons,
        isAI: true,
        fallback: false
      };

    } catch (error) {
      logger.error(`AI 比較數據生成失敗: ${toolType}`, error);
      
      return {
        comparisons: this.getFallbackComparisons(toolType, calculationResult),
        fallback: true,
        error: error.message
      };
    }
  }

  /**
   * 建立結果描述的 Prompt
   */
  buildDescriptionPrompt(toolType, inputData, calculationResult, userProfile) {
    const toolNames = {
      'moonlight-calculator': '月光族指數計算機',
      'noodle-survival': '泡麵生存計算機',
      'breakup-cost': '分手成本計算機',
      'escape-taipei': '逃離台北計算機',
      'phone-lifespan': '手機壽命計算機',
      'car-vs-uber': '養車 vs Uber 計算機',
      'birthday-collision': '生日撞期計算機',
      'housing-index': '蝸居指數計算機'
    };

    const toolName = toolNames[toolType] || toolType;
    const result = calculationResult.value;
    const unit = calculationResult.unit || '';

    let userContext = '';
    if (userProfile) {
      userContext = `\n用戶背景：年齡${userProfile.age}歲，居住在${userProfile.location}`;
    }

    return `
你是台灣最幽默風趣的生活分析師，專門生成震撼又有趣的結果描述。

工具：${toolName}
計算結果：${result}${unit}
輸入資料：${JSON.stringify(inputData, null, 2)}
${userContext}

請生成一段震撼又有趣的結果描述，要求：
1. 用台灣人熟悉的語言和比喻
2. 要有震撼感，讓人想分享
3. 幽默但不失真實感
4. 長度控制在50-80字
5. 加入一些台灣特色的元素或比較

請直接回傳描述內容，不要其他說明：
`;
  }

  /**
   * 建立改善建議的 Prompt
   */
  buildSuggestionsPrompt(toolType, inputData, calculationResult) {
    const toolNames = {
      'moonlight-calculator': '月光族指數',
      'noodle-survival': '泡麵生存能力',
      'breakup-cost': '分手成本',
      'escape-taipei': '逃離台北',
      'phone-lifespan': '手機壽命',
      'car-vs-uber': '交通成本',
      'birthday-collision': '生日撞期',
      'housing-index': '蝸居指數'
    };

    const toolName = toolNames[toolType] || toolType;

    return `
你是專業的生活改善顧問，針對台灣人的生活情況提供實用建議。

分析主題：${toolName}
計算結果：${calculationResult.value}${calculationResult.unit || ''}
輸入資料：${JSON.stringify(inputData, null, 2)}

請生成3-5個實用的改善建議，要求：
1. 針對台灣的實際情況
2. 具體可執行
3. 有趣且實用
4. 每個建議20-30字

請以以下格式回傳，每行一個建議：
- 建議1
- 建議2
- 建議3
`;
  }

  /**
   * 建立病毒式分享的 Prompt
   */
  buildSharePrompt(toolType, calculationResult, platform) {
    const platformStyles = {
      'facebook': '適合Facebook的詳細分享，可以較長',
      'line': '適合LINE的簡潔分享，要精簡有趣',
      'instagram': '適合Instagram的視覺化分享，要有標籤'
    };

    const style = platformStyles[platform] || platformStyles['facebook'];

    return `
你是病毒式內容創作專家，專門創作會讓人想分享的內容。

工具結果：${calculationResult.value}${calculationResult.unit || ''}
平台：${platform}
風格要求：${style}

請創作一段會讓人想分享的文案，要求：
1. 引起共鳴，讓人想測試
2. 加入適當的 emoji
3. 有話題性和討論性
4. 符合台灣網路文化
5. ${platform === 'instagram' ? '包含3-5個相關標籤' : ''}

請直接回傳分享文案：
`;
  }

  /**
   * 建立震撼比較的 Prompt
   */
  buildComparisonPrompt(toolType, calculationResult) {
    return `
你是數據比較專家，擅長用震撼的比較來說明數據的意義。

工具結果：${calculationResult.value}${calculationResult.unit || ''}

請生成2-3個震撼性的比較，幫助理解這個數據，要求：
1. 用台灣人熟悉的事物比較
2. 要有震撼感但保持真實
3. 每個比較15-25字

請以以下格式回傳：
- 比較1
- 比較2
- 比較3
`;
  }

  /**
   * 解析 AI 回應的建議列表
   */
  parseSuggestions(aiResponse) {
    const lines = aiResponse.split('\n').filter(line => line.trim());
    return lines
      .filter(line => line.includes('-') || line.includes('•') || line.includes('1.') || line.includes('2.'))
      .map(line => line.replace(/^[-•\d.]\s*/, '').trim())
      .filter(suggestion => suggestion.length > 5)
      .slice(0, 5); // 最多5個建議
  }

  /**
   * 解析 AI 回應的比較數據
   */
  parseComparisons(aiResponse) {
    const lines = aiResponse.split('\n').filter(line => line.trim());
    return lines
      .filter(line => line.includes('-') || line.includes('•'))
      .map(line => line.replace(/^[-•]\s*/, '').trim())
      .filter(comparison => comparison.length > 5)
      .slice(0, 3); // 最多3個比較
  }

  /**
   * 備用模式：獲取預設描述
   */
  getFallbackDescription(toolType, calculationResult) {
    const fallbackDescriptions = {
      'moonlight-calculator': `你的月光族指數是 ${calculationResult.value}%！${calculationResult.value >= 80 ? '恭喜達成月光族成就！' : '還有進步空間喔！'}`,
      'noodle-survival': `你可以靠泡麵生存 ${calculationResult.value} 天！${calculationResult.value >= 30 ? '泡麵大師認證！' : '建議多備點糧食！'}`,
      'breakup-cost': `分手成本高達 ${calculationResult.value?.toLocaleString()} 元！${calculationResult.value >= 100000 ? '這可以買很多東西了！' : '還在可承受範圍內！'}`,
      'phone-lifespan': `你的手機還能撐 ${calculationResult.value} 天！${calculationResult.value <= 30 ? '該換手機了！' : '保養得不錯！'}`,
    };

    return {
      description: fallbackDescriptions[toolType] || `計算結果：${calculationResult.value}${calculationResult.unit || ''}`,
      isAI: false
    };
  }

  /**
   * 備用模式：獲取預設建議
   */
  getFallbackSuggestions(toolType, calculationResult) {
    const fallbackSuggestions = {
      'moonlight-calculator': ['建立記帳習慣', '設定儲蓄目標', '尋找副業機會'],
      'noodle-survival': ['增加食物多樣性', '學習簡單料理', '控制飲食預算'],
      'breakup-cost': ['理性管理感情投資', '建立個人財務獨立', '重視精神層面'],
      'phone-lifespan': ['定期清理儲存空間', '避免過度使用', '做好保護措施']
    };

    return fallbackSuggestions[toolType] || ['持續關注相關資訊', '保持良好習慣', '適時尋求專業建議'];
  }

  /**
   * 備用模式：獲取預設分享內容
   */
  getFallbackShareContent(toolType, calculationResult, platform) {
    const result = calculationResult.value;
    const unit = calculationResult.unit || '';

    const fallbackContent = {
      'facebook': `我剛測試了台灣人生算式，結果是 ${result}${unit}！你也來試試看吧！ #台灣人生算式`,
      'line': `測試結果：${result}${unit} 😱 太震撼了！`,
      'instagram': `我的測試結果：${result}${unit} ✨ #台灣人生算式 #生活計算 #有趣測試`
    };

    return {
      content: fallbackContent[platform] || fallbackContent['facebook'],
      platform,
      isAI: false
    };
  }

  /**
   * 備用模式：獲取預設比較
   */
  getFallbackComparisons(toolType, calculationResult) {
    return [
      '相當於一般台灣上班族的月薪',
      '可以買很多珍珠奶茶',
      '足夠環島旅行好幾次'
    ];
  }

  /**
   * 確保系統已初始化
   */
  ensureInitialized() {
    if (!this.initialized) {
      throw new Error('AI 內容生成器尚未初始化，請先調用 initialize() 方法');
    }
  }

  /**
   * 獲取系統狀態
   */
  getStatus() {
    return {
      initialized: this.initialized,
      fallbackMode: this.fallbackMode,
      hasApiKey: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== ''),
      model: this.fallbackMode ? 'fallback' : 'gemini-pro'
    };
  }
}

// 創建單例實例
const aiContentGenerator = new AIContentGenerator();

module.exports = aiContentGenerator;
