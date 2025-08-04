// 測試環境設定
process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'tw_life_formula_test';
process.env.SESSION_SECRET = 'test-secret-key';
process.env.JWT_SECRET = 'test-jwt-secret-key-at-least-32-characters';

// 全域測試設定
beforeAll(async() => {
  // 測試前的全域設定
});

afterAll(async() => {
  // 測試後的清理工作
});

// 全域測試工具函數
global.testUtils = {
  createMockUser: () => ({
    id: 'test-user-123',
    tier: 'free',
    dailyUsage: 0,
    createdAt: new Date().toISOString()
  }),

  createMockToolResult: (toolId) => ({
    toolId,
    result: {
      value: 87,
      message: '測試結果訊息',
      suggestions: ['建議1', '建議2', '建議3']
    },
    timestamp: new Date().toISOString()
  })
};
