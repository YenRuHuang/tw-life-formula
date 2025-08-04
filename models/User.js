const { executeQuery } = require('../config/database');
const logger = require('../utils/logger');

class User {
  constructor(data) {
    this.id = data.id;
    this.sessionId = data.session_id;
    this.createdAt = data.created_at;
    this.lastActive = data.last_active;
    this.preferences = typeof data.preferences === 'string'
      ? JSON.parse(data.preferences)
      : data.preferences || {};
  }

  // 根據 session_id 查找或建立用戶
  static async findOrCreateBySessionId(sessionId) {
    try {
      // 先嘗試查找現有用戶
      const existingUsers = await executeQuery(
        'SELECT * FROM users WHERE session_id = ?',
        [sessionId]
      );

      if (existingUsers.length > 0) {
        // 更新最後活躍時間
        await executeQuery(
          'UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE id = ?',
          [existingUsers[0].id]
        );

        return new User(existingUsers[0]);
      }

      // 建立新用戶
      const result = await executeQuery(
        'INSERT INTO users (session_id, preferences) VALUES (?, ?)',
        [sessionId, JSON.stringify({})]
      );

      const newUser = await executeQuery(
        'SELECT * FROM users WHERE id = ?',
        [result.insertId]
      );

      logger.info('新用戶建立成功', { sessionId, userId: result.insertId });
      return new User(newUser[0]);

    } catch (error) {
      logger.error('查找或建立用戶失敗:', error);
      throw error;
    }
  }

  // 根據 ID 查找用戶
  static async findById(id) {
    try {
      const users = await executeQuery(
        'SELECT * FROM users WHERE id = ?',
        [id]
      );

      return users.length > 0 ? new User(users[0]) : null;
    } catch (error) {
      logger.error('根據 ID 查找用戶失敗:', error);
      throw error;
    }
  }

  // 更新用戶偏好設定
  async updatePreferences(newPreferences) {
    try {
      const updatedPreferences = { ...this.preferences, ...newPreferences };

      await executeQuery(
        'UPDATE users SET preferences = ? WHERE id = ?',
        [JSON.stringify(updatedPreferences), this.id]
      );

      this.preferences = updatedPreferences;
      logger.info('用戶偏好設定更新成功', { userId: this.id });

      return this;
    } catch (error) {
      logger.error('更新用戶偏好設定失敗:', error);
      throw error;
    }
  }

  // 獲取用戶訂閱資訊
  async getSubscription() {
    try {
      const subscriptions = await executeQuery(
        'SELECT * FROM user_subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
        [this.id]
      );

      return subscriptions.length > 0 ? subscriptions[0] : null;
    } catch (error) {
      logger.error('獲取用戶訂閱資訊失敗:', error);
      throw error;
    }
  }

  // 獲取用戶今日使用量
  async getTodayUsage() {
    try {
      const today = new Date().toISOString().split('T')[0];

      const usage = await executeQuery(
        'SELECT * FROM usage_limits WHERE user_id = ? AND date = ?',
        [this.id, today]
      );

      if (usage.length > 0) {
        return usage[0];
      }

      // 如果沒有記錄，建立新的使用量記錄
      await executeQuery(
        'INSERT INTO usage_limits (user_id, date, tool_usage_count, daily_limit) VALUES (?, ?, 0, 10)',
        [this.id, today]
      );

      return {
        user_id: this.id,
        date: today,
        tool_usage_count: 0,
        daily_limit: 10
      };
    } catch (error) {
      logger.error('獲取用戶今日使用量失敗:', error);
      throw error;
    }
  }

  // 增加工具使用次數
  async incrementToolUsage() {
    try {
      const today = new Date().toISOString().split('T')[0];

      await executeQuery(`
        INSERT INTO usage_limits (user_id, date, tool_usage_count, daily_limit)
        VALUES (?, ?, 1, 10)
        ON DUPLICATE KEY UPDATE
        tool_usage_count = tool_usage_count + 1
      `, [this.id, today]);

      logger.info('工具使用次數已增加', { userId: this.id, date: today });
    } catch (error) {
      logger.error('增加工具使用次數失敗:', error);
      throw error;
    }
  }

  // 檢查是否可以使用工具
  async canUseTool() {
    try {
      const subscription = await this.getSubscription();

      // 高級用戶無限制
      if (subscription && subscription.tier === 'premium' && subscription.status === 'active') {
        return { canUse: true, reason: 'premium_user' };
      }

      // 檢查免費用戶的使用限制
      const todayUsage = await this.getTodayUsage();

      if (todayUsage.tool_usage_count >= todayUsage.daily_limit) {
        return {
          canUse: false,
          reason: 'daily_limit_exceeded',
          usage: todayUsage.tool_usage_count,
          limit: todayUsage.daily_limit
        };
      }

      return {
        canUse: true,
        reason: 'within_limit',
        usage: todayUsage.tool_usage_count,
        limit: todayUsage.daily_limit
      };
    } catch (error) {
      logger.error('檢查工具使用權限失敗:', error);
      throw error;
    }
  }

  // 記錄工具使用
  async recordToolUsage(toolType, inputData, resultData) {
    try {
      const result = await executeQuery(`
        INSERT INTO tool_usage (user_id, tool_type, input_data, result_data)
        VALUES (?, ?, ?, ?)
      `, [
        this.id,
        toolType,
        JSON.stringify(inputData),
        JSON.stringify(resultData)
      ]);

      // 增加使用次數
      await this.incrementToolUsage();

      logger.info('工具使用記錄已保存', {
        userId: this.id,
        toolType,
        usageId: result.insertId
      });

      return result.insertId;
    } catch (error) {
      logger.error('記錄工具使用失敗:', error);
      throw error;
    }
  }

  // 獲取用戶使用歷史
  async getUsageHistory(limit = 10) {
    try {
      const history = await executeQuery(`
        SELECT tu.*, tc.display_name
        FROM tool_usage tu
        LEFT JOIN tool_configs tc ON tu.tool_type = tc.tool_type
        WHERE tu.user_id = ?
        ORDER BY tu.created_at DESC
        LIMIT ?
      `, [this.id, limit]);

      return history.map(record => ({
        ...record,
        input_data: JSON.parse(record.input_data),
        result_data: JSON.parse(record.result_data)
      }));
    } catch (error) {
      logger.error('獲取用戶使用歷史失敗:', error);
      throw error;
    }
  }

  // 轉換為 JSON 格式
  toJSON() {
    return {
      id: this.id,
      sessionId: this.sessionId,
      createdAt: this.createdAt,
      lastActive: this.lastActive,
      preferences: this.preferences
    };
  }
}

module.exports = User;
