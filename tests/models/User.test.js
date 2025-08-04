const User = require('../../models/User');

// 模擬資料庫查詢
jest.mock('../../config/database', () => ({
  executeQuery: jest.fn()
}));

const { executeQuery } = require('../../config/database');

describe('User Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findOrCreateBySessionId', () => {
    it('應該返回現有用戶', async() => {
      const mockUser = {
        id: 1,
        session_id: 'test-session-123',
        created_at: new Date(),
        last_active: new Date(),
        preferences: '{}'
      };

      executeQuery
        .mockResolvedValueOnce([mockUser]) // 查找現有用戶
        .mockResolvedValueOnce([]); // 更新最後活躍時間

      const user = await User.findOrCreateBySessionId('test-session-123');

      expect(user).toBeInstanceOf(User);
      expect(user.sessionId).toBe('test-session-123');
      expect(executeQuery).toHaveBeenCalledTimes(2);
    });

    it('應該建立新用戶', async() => {
      const mockNewUser = {
        id: 2,
        session_id: 'new-session-456',
        created_at: new Date(),
        last_active: new Date(),
        preferences: '{}'
      };

      executeQuery
        .mockResolvedValueOnce([]) // 查找現有用戶（未找到）
        .mockResolvedValueOnce({ insertId: 2 }) // 插入新用戶
        .mockResolvedValueOnce([mockNewUser]); // 查詢新建立的用戶

      const user = await User.findOrCreateBySessionId('new-session-456');

      expect(user).toBeInstanceOf(User);
      expect(user.sessionId).toBe('new-session-456');
      expect(executeQuery).toHaveBeenCalledTimes(3);
    });
  });

  describe('canUseTool', () => {
    it('高級用戶應該可以無限制使用', async() => {
      const user = new User({
        id: 1,
        session_id: 'premium-user',
        created_at: new Date(),
        last_active: new Date(),
        preferences: '{}'
      });

      // 模擬高級訂閱
      executeQuery.mockResolvedValueOnce([{
        tier: 'premium',
        status: 'active'
      }]);

      const result = await user.canUseTool();

      expect(result.canUse).toBe(true);
      expect(result.reason).toBe('premium_user');
    });

    it('免費用戶超過限制應該被拒絕', async() => {
      const user = new User({
        id: 2,
        session_id: 'free-user',
        created_at: new Date(),
        last_active: new Date(),
        preferences: '{}'
      });

      executeQuery
        .mockResolvedValueOnce([]) // 沒有訂閱
        .mockResolvedValueOnce([{ // 今日使用量
          tool_usage_count: 10,
          daily_limit: 10
        }]);

      const result = await user.canUseTool();

      expect(result.canUse).toBe(false);
      expect(result.reason).toBe('daily_limit_exceeded');
    });
  });

  describe('recordToolUsage', () => {
    it('應該記錄工具使用並增加計數', async() => {
      const user = new User({
        id: 1,
        session_id: 'test-user',
        created_at: new Date(),
        last_active: new Date(),
        preferences: '{}'
      });

      const inputData = { salary: 50000, expenses: 45000 };
      const resultData = { value: 90, message: 'Test result' };

      executeQuery
        .mockResolvedValueOnce({ insertId: 123 }) // 插入使用記錄
        .mockResolvedValueOnce([]); // 增加使用次數

      const usageId = await user.recordToolUsage('moonlight-calculator', inputData, resultData);

      expect(usageId).toBe(123);
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO tool_usage'),
        expect.arrayContaining([
          1,
          'moonlight-calculator',
          JSON.stringify(inputData),
          JSON.stringify(resultData)
        ])
      );
    });
  });
});
