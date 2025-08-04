const ToolConfig = require('../../models/ToolConfig');

// 模擬資料庫查詢
jest.mock('../../config/database', () => ({
  executeQuery: jest.fn()
}));

const { executeQuery } = require('../../config/database');

describe('ToolConfig Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllActive', () => {
    it('應該返回所有活躍的工具', async() => {
      const mockTools = [
        {
          id: 1,
          tool_type: 'moonlight-calculator',
          display_name: '月光族指數計算機',
          description: '測試描述',
          category: 'calculator',
          input_schema: '{"salary": {"type": "number", "required": true}}',
          calculation_logic: '{"formula": "test"}',
          monetization_config: '{}',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      executeQuery.mockResolvedValue(mockTools);

      const tools = await ToolConfig.getAllActive();

      expect(tools).toHaveLength(1);
      expect(tools[0]).toBeInstanceOf(ToolConfig);
      expect(tools[0].toolType).toBe('moonlight-calculator');
    });
  });

  describe('validateInput', () => {
    it('應該驗證必填欄位', () => {
      const toolConfig = new ToolConfig({
        id: 1,
        tool_type: 'test-tool',
        display_name: '測試工具',
        description: '測試',
        category: 'calculator',
        input_schema: {
          salary: { type: 'number', required: true, label: '薪水' },
          expenses: { type: 'number', required: false, label: '支出' }
        },
        calculation_logic: {},
        monetization_config: {},
        is_active: true
      });

      // 測試缺少必填欄位
      const validation1 = toolConfig.validateInput({});
      expect(validation1.isValid).toBe(false);
      expect(validation1.errors).toContain('薪水 為必填欄位');

      // 測試有效輸入
      const validation2 = toolConfig.validateInput({ salary: 50000 });
      expect(validation2.isValid).toBe(true);
      expect(validation2.errors).toHaveLength(0);
    });

    it('應該驗證數值範圍', () => {
      const toolConfig = new ToolConfig({
        id: 1,
        tool_type: 'test-tool',
        display_name: '測試工具',
        description: '測試',
        category: 'calculator',
        input_schema: {
          age: { type: 'number', required: true, min: 0, max: 120, label: '年齡' }
        },
        calculation_logic: {},
        monetization_config: {},
        is_active: true
      });

      // 測試超出範圍
      const validation1 = toolConfig.validateInput({ age: -5 });
      expect(validation1.isValid).toBe(false);
      expect(validation1.errors).toContain('年齡 不能小於 0');

      const validation2 = toolConfig.validateInput({ age: 150 });
      expect(validation2.isValid).toBe(false);
      expect(validation2.errors).toContain('年齡 不能大於 120');

      // 測試有效範圍
      const validation3 = toolConfig.validateInput({ age: 25 });
      expect(validation3.isValid).toBe(true);
    });

    it('應該驗證字串選項', () => {
      const toolConfig = new ToolConfig({
        id: 1,
        tool_type: 'test-tool',
        display_name: '測試工具',
        description: '測試',
        category: 'calculator',
        input_schema: {
          level: {
            type: 'string',
            required: true,
            options: ['basic', 'premium', 'enterprise'],
            label: '等級'
          }
        },
        calculation_logic: {},
        monetization_config: {},
        is_active: true
      });

      // 測試無效選項
      const validation1 = toolConfig.validateInput({ level: 'invalid' });
      expect(validation1.isValid).toBe(false);
      expect(validation1.errors).toContain('等級 必須為以下選項之一: basic, premium, enterprise');

      // 測試有效選項
      const validation2 = toolConfig.validateInput({ level: 'premium' });
      expect(validation2.isValid).toBe(true);
    });
  });

  describe('toPublicJSON', () => {
    it('應該返回公開格式的資料', () => {
      const toolConfig = new ToolConfig({
        id: 1,
        tool_type: 'moonlight-calculator',
        display_name: '月光族指數計算機',
        description: '測試描述',
        category: 'calculator',
        input_schema: { test: 'schema' },
        calculation_logic: { secret: 'logic' },
        monetization_config: { secret: 'config' },
        is_active: true
      });

      const publicData = toolConfig.toPublicJSON();

      expect(publicData).toEqual({
        id: 'moonlight-calculator',
        name: '月光族指數計算機',
        description: '測試描述',
        category: 'calculator',
        inputSchema: { test: 'schema' },
        icon: '💸'
      });

      // 確保敏感資料不會被包含
      expect(publicData.calculation_logic).toBeUndefined();
      expect(publicData.monetization_config).toBeUndefined();
    });
  });
});
