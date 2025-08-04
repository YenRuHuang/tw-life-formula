const toolManager = require('../services/ToolManager');
const ToolConfig = require('../models/ToolConfig');

// 模擬資料庫連接
jest.mock('../config/database', () => ({
  executeQuery: jest.fn()
}));

// 模擬 ToolConfig
jest.mock('../models/ToolConfig');

// 模擬 logger
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

describe('ToolManager', () => {
  beforeEach(() => {
    // 重置 ToolManager 狀態
    toolManager.tools.clear();
    toolManager.categories.clear();
    toolManager.initialized = false;
    
    // 清除所有 mock
    jest.clearAllMocks();
  });

  describe('初始化功能', () => {
    test('應該成功初始化工具管理系統', async () => {
      // 模擬工具配置
      const mockTools = [
        {
          toolType: 'moonlight-calculator',
          displayName: '月光族指數計算機',
          description: '計算你的月光族指數',
          category: 'calculator',
          inputSchema: { monthly_income: { type: 'number', required: true } },
          calculationLogic: {},
          monetizationConfig: {},
          isActive: true,
          getIcon: () => '💸',
          validateInput: jest.fn(() => ({ isValid: true, errors: [] }))
        },
        {
          toolType: 'noodle-survival',
          displayName: '泡麵生存計算機',
          description: '計算用泡麵能活多久',
          category: 'calculator',
          inputSchema: { budget: { type: 'number', required: true } },
          calculationLogic: {},
          monetizationConfig: {},
          isActive: true,
          getIcon: () => '🍜',
          validateInput: jest.fn(() => ({ isValid: true, errors: [] }))
        }
      ];

      ToolConfig.getAllActive.mockResolvedValue(mockTools);

      const result = await toolManager.initialize();

      expect(result.success).toBe(true);
      expect(result.toolCount).toBe(2);
      expect(result.categories).toContain('calculator');
      expect(toolManager.initialized).toBe(true);
    });

    test('初始化失敗時應該拋出錯誤', async () => {
      ToolConfig.getAllActive.mockRejectedValue(new Error('Database error'));

      await expect(toolManager.initialize()).rejects.toThrow('Database error');
      expect(toolManager.initialized).toBe(false);
    });
  });

  describe('工具註冊功能', () => {
    test('應該成功註冊工具', async () => {
      const mockTool = {
        toolType: 'test-tool',
        displayName: '測試工具',
        description: '測試用工具',
        category: 'test',
        inputSchema: {},
        calculationLogic: {},
        monetizationConfig: {},
        isActive: true,
        getIcon: () => '🧪',
        validateInput: jest.fn(() => ({ isValid: true, errors: [] }))
      };

      const toolInstance = await toolManager.registerTool(mockTool);

      expect(toolInstance.type).toBe('test-tool');
      expect(toolInstance.name).toBe('測試工具');
      expect(toolInstance.category).toBe('test');
      expect(toolManager.tools.has('test-tool')).toBe(true);
    });

    test('註冊工具時應該建立分類索引', async () => {
      const mockTool = {
        toolType: 'test-tool',
        displayName: '測試工具',
        category: 'new-category',
        inputSchema: {},
        calculationLogic: {},
        monetizationConfig: {},
        isActive: true,
        getIcon: () => '🧪',
        validateInput: jest.fn(() => ({ isValid: true, errors: [] }))
      };

      await toolManager.registerTool(mockTool);

      expect(toolManager.categories.has('new-category')).toBe(true);
      expect(toolManager.categories.get('new-category')).toContain('test-tool');
    });
  });

  describe('工具獲取功能', () => {
    beforeEach(async () => {
      // 先初始化一些測試工具
      const mockTools = [
        {
          toolType: 'tool1',
          displayName: '工具1',
          category: 'calculator',
          inputSchema: {},
          calculationLogic: {},
          monetizationConfig: {},
          isActive: true,
          getIcon: () => '🔧',
          validateInput: jest.fn(() => ({ isValid: true, errors: [] }))
        },
        {
          toolType: 'tool2',
          displayName: '工具2',
          category: 'test',
          inputSchema: {},
          calculationLogic: {},
          monetizationConfig: {},
          isActive: true,
          getIcon: () => '⚡',
          validateInput: jest.fn(() => ({ isValid: true, errors: [] }))
        }
      ];

      ToolConfig.getAllActive.mockResolvedValue(mockTools);
      await toolManager.initialize();
    });

    test('應該能獲取所有工具列表', () => {
      const tools = toolManager.getAllTools(true);

      expect(tools).toHaveLength(2);
      expect(tools[0]).toHaveProperty('id');
      expect(tools[0]).toHaveProperty('name');
      expect(tools[0]).toHaveProperty('category');
      expect(tools[0]).toHaveProperty('icon');
    });

    test('應該能根據類型獲取特定工具', () => {
      const tool = toolManager.getTool('tool1');

      expect(tool).toBeDefined();
      expect(tool.type).toBe('tool1');
      expect(tool.name).toBe('工具1');
    });

    test('獲取不存在的工具應該返回 null', () => {
      const tool = toolManager.getTool('non-existent');

      expect(tool).toBeNull();
    });

    test('應該能根據分類獲取工具', () => {
      const calculatorTools = toolManager.getToolsByCategory('calculator', true);

      expect(calculatorTools).toHaveLength(1);
      expect(calculatorTools[0].id).toBe('tool1');
    });

    test('應該能獲取所有分類', () => {
      const categories = toolManager.getCategories();

      expect(categories).toHaveLength(2);
      expect(categories.some(cat => cat.name === 'calculator')).toBe(true);
      expect(categories.some(cat => cat.name === 'test')).toBe(true);
    });
  });

  describe('工具執行功能', () => {
    beforeEach(async () => {
      const mockTool = {
        toolType: 'moonlight-calculator',
        displayName: '月光族指數計算機',
        category: 'calculator',
        inputSchema: {
          monthly_income: { type: 'number', required: true },
          monthly_expenses: { type: 'number', required: true }
        },
        calculationLogic: {},
        monetizationConfig: {},
        isActive: true,
        getIcon: () => '💸',
        validateInput: jest.fn(() => ({ isValid: true, errors: [] }))
      };

      ToolConfig.getAllActive.mockResolvedValue([mockTool]);
      await toolManager.initialize();
    });

    test('應該能成功執行月光族計算', async () => {
      const inputData = {
        monthly_income: 50000,
        monthly_expenses: 45000,
        age: 25,
        location: '台北市'
      };

      const result = await toolManager.executeTool('moonlight-calculator', inputData, 'user123');

      expect(result.toolType).toBe('moonlight-calculator');
      expect(result.toolName).toBe('月光族指數計算機');
      expect(result.result).toHaveProperty('value');
      expect(result.result).toHaveProperty('level');
      expect(result.result).toHaveProperty('description');
      expect(result.userId).toBe('user123');
      expect(result.shareConfig).toHaveProperty('title');
    });

    test('輸入驗證失敗時應該拋出錯誤', async () => {
      // 模擬驗證失敗
      const tool = toolManager.getTool('moonlight-calculator');
      tool.validateInput = jest.fn(() => ({
        isValid: false,
        errors: ['monthly_income 為必填欄位']
      }));

      const inputData = { monthly_expenses: 45000 };

      await expect(
        toolManager.executeTool('moonlight-calculator', inputData, 'user123')
      ).rejects.toThrow('輸入資料驗證失敗: monthly_income 為必填欄位');
    });

    test('工具不存在時應該拋出錯誤', async () => {
      await expect(
        toolManager.executeTool('non-existent-tool', {}, 'user123')
      ).rejects.toThrow('工具不存在: non-existent-tool');
    });

    test('系統未初始化時應該拋出錯誤', async () => {
      toolManager.initialized = false;

      await expect(
        toolManager.executeTool('moonlight-calculator', {}, 'user123')
      ).rejects.toThrow('工具管理系統尚未初始化');
    });
  });

  describe('月光族指數計算邏輯', () => {
    test('應該正確計算月光族指數', () => {
      const inputData = {
        monthly_income: 50000,
        monthly_expenses: 40000,
        age: 25,
        location: '台北市'
      };

      const result = toolManager.calculateMoonlightIndex(inputData, {});

      // 基礎指數: (40000/50000) * 100 = 80
      // 年齡係數: 25歲 = 1.2
      // 地區係數: 台北市 = 1.3
      // 最終指數: min(100, 80 * 1.2 * 1.3) = 100 (但會被限制)
      expect(result.value).toBeGreaterThan(80);
      expect(result).toHaveProperty('level');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('suggestions');
      expect(Array.isArray(result.suggestions)).toBe(true);
    });

    test('低支出應該得到較低的月光族指數', () => {
      const inputData = {
        monthly_income: 50000,
        monthly_expenses: 20000,
        age: 30,
        location: '高雄市'
      };

      const result = toolManager.calculateMoonlightIndex(inputData, {});

      expect(result.value).toBeLessThan(50);
      expect(result.level).toBe('理財新手');
    });
  });

  describe('泡麵生存計算邏輯', () => {
    test('應該正確計算泡麵生存天數', () => {
      const inputData = {
        budget: 1000,
        noodle_price: 25,
        daily_noodles: 2
      };

      const result = toolManager.calculateNoodleSurvival(inputData, {});

      // 每日成本: 25 * 2 = 50
      // 生存天數: 1000 / 50 = 20天
      expect(result.value).toBe(20);
      expect(result.unit).toBe('天');
      expect(result.details.dailyCost).toBe(50);
      expect(result.details.totalNoodles).toBe(40);
      expect(Array.isArray(result.suggestions)).toBe(true);
    });

    test('預算不足時應該返回合理的建議', () => {
      const inputData = {
        budget: 100,
        noodle_price: 30,
        daily_noodles: 1
      };

      const result = toolManager.calculateNoodleSurvival(inputData, {});

      expect(result.value).toBe(3); // 100 / 30 = 3.33 -> floor(3)
      expect(result.description).toContain('泡麵預算有限');
    });
  });

  describe('系統統計功能', () => {
    beforeEach(async () => {
      const mockTools = [
        {
          toolType: 'tool1',
          displayName: '工具1',
          category: 'calculator',
          inputSchema: {},
          calculationLogic: {},
          monetizationConfig: {},
          isActive: true,
          getIcon: () => '🔧',
          validateInput: jest.fn(() => ({ isValid: true, errors: [] }))
        },
        {
          toolType: 'tool2',
          displayName: '工具2',
          category: 'test',
          inputSchema: {},
          calculationLogic: {},
          monetizationConfig: {},
          isActive: false, // 停用的工具
          getIcon: () => '⚡',
          validateInput: jest.fn(() => ({ isValid: true, errors: [] }))
        }
      ];

      ToolConfig.getAllActive.mockResolvedValue(mockTools.filter(t => t.isActive));
      await toolManager.initialize();
    });

    test('應該返回正確的系統統計', () => {
      const stats = toolManager.getStats();

      expect(stats.totalTools).toBe(1); // 只有活躍工具被載入
      expect(stats.activeTools).toBe(1);
      expect(stats.categories).toBe(1);
      expect(stats.toolsByCategory).toHaveProperty('calculator', 1);
    });
  });

  describe('重新載入功能', () => {
    test('應該能重新載入工具配置', async () => {
      // 先初始化
      ToolConfig.getAllActive.mockResolvedValue([]);
      await toolManager.initialize();
      expect(toolManager.tools.size).toBe(0);

      // 重新載入時有新工具
      const newMockTool = {
        toolType: 'new-tool',
        displayName: '新工具',
        category: 'new',
        inputSchema: {},
        calculationLogic: {},
        monetizationConfig: {},
        isActive: true,
        getIcon: () => '🆕',
        validateInput: jest.fn(() => ({ isValid: true, errors: [] }))
      };
      
      ToolConfig.getAllActive.mockResolvedValue([newMockTool]);
      
      const result = await toolManager.reload();

      expect(result.success).toBe(true);
      expect(result.toolCount).toBe(1);
      expect(toolManager.tools.has('new-tool')).toBe(true);
    });
  });
});
