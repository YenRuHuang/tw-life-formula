const { executeQuery } = require('../config/database');
const logger = require('../utils/logger');

class ToolConfig {
  constructor(data) {
    this.id = data.id;
    this.toolType = data.tool_type;
    this.displayName = data.display_name;
    this.description = data.description;
    this.category = data.category;
    this.inputSchema = typeof data.input_schema === 'string'
      ? JSON.parse(data.input_schema)
      : data.input_schema;
    this.calculationLogic = typeof data.calculation_logic === 'string'
      ? JSON.parse(data.calculation_logic)
      : data.calculation_logic;
    this.monetizationConfig = typeof data.monetization_config === 'string'
      ? JSON.parse(data.monetization_config)
      : data.monetization_config;
    this.isActive = data.is_active;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  // 獲取所有活躍的工具
  static async getAllActive() {
    try {
      const tools = await executeQuery(
        'SELECT * FROM tool_configs WHERE is_active = true ORDER BY category, display_name'
      );

      return tools.map(tool => new ToolConfig(tool));
    } catch (error) {
      logger.error('獲取活躍工具列表失敗:', error);
      throw error;
    }
  }

  // 根據工具類型獲取配置
  static async findByType(toolType) {
    try {
      const tools = await executeQuery(
        'SELECT * FROM tool_configs WHERE tool_type = ? AND is_active = true',
        [toolType]
      );

      return tools.length > 0 ? new ToolConfig(tools[0]) : null;
    } catch (error) {
      logger.error('根據類型查找工具配置失敗:', error);
      throw error;
    }
  }

  // 根據分類獲取工具
  static async findByCategory(category) {
    try {
      const tools = await executeQuery(
        'SELECT * FROM tool_configs WHERE category = ? AND is_active = true ORDER BY display_name',
        [category]
      );

      return tools.map(tool => new ToolConfig(tool));
    } catch (error) {
      logger.error('根據分類查找工具失敗:', error);
      throw error;
    }
  }

  // 獲取工具使用統計
  async getUsageStats(days = 30) {
    try {
      const stats = await executeQuery(`
        SELECT
          COUNT(*) as total_usage,
          COUNT(DISTINCT user_id) as unique_users,
          AVG(CASE WHEN shared = true THEN 1 ELSE 0 END) as share_rate,
          DATE(created_at) as date
        FROM tool_usage
        WHERE tool_type = ?
          AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `, [this.toolType, days]);

      return stats;
    } catch (error) {
      logger.error('獲取工具使用統計失敗:', error);
      throw error;
    }
  }

  // 獲取工具的熱門輸入參數
  async getPopularInputs(limit = 10) {
    try {
      const inputs = await executeQuery(`
        SELECT input_data, COUNT(*) as usage_count
        FROM tool_usage
        WHERE tool_type = ?
        GROUP BY input_data
        ORDER BY usage_count DESC
        LIMIT ?
      `, [this.toolType, limit]);

      return inputs.map(input => ({
        ...input,
        input_data: JSON.parse(input.input_data)
      }));
    } catch (error) {
      logger.error('獲取熱門輸入參數失敗:', error);
      throw error;
    }
  }

  // 驗證輸入資料
  validateInput(inputData) {
    const errors = [];

    for (const [fieldName, fieldConfig] of Object.entries(this.inputSchema)) {
      const value = inputData[fieldName];

      // 檢查必填欄位
      if (fieldConfig.required && (value === undefined || value === null || value === '')) {
        errors.push(`${fieldConfig.label || fieldName} 為必填欄位`);
        continue;
      }

      // 如果欄位為空且非必填，跳過其他驗證
      if (value === undefined || value === null || value === '') {
        continue;
      }

      // 類型驗證
      if (fieldConfig.type === 'number') {
        const numValue = Number(value);
        if (isNaN(numValue)) {
          errors.push(`${fieldConfig.label || fieldName} 必須為數字`);
          continue;
        }

        // 數值範圍驗證
        if (fieldConfig.min !== undefined && numValue < fieldConfig.min) {
          errors.push(`${fieldConfig.label || fieldName} 不能小於 ${fieldConfig.min}`);
        }
        if (fieldConfig.max !== undefined && numValue > fieldConfig.max) {
          errors.push(`${fieldConfig.label || fieldName} 不能大於 ${fieldConfig.max}`);
        }
      }

      // 字串選項驗證
      if (fieldConfig.type === 'string' && fieldConfig.options) {
        if (!fieldConfig.options.includes(value)) {
          errors.push(`${fieldConfig.label || fieldName} 必須為以下選項之一: ${fieldConfig.options.join(', ')}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // 更新工具配置
  async update(updateData) {
    try {
      const allowedFields = [
        'display_name', 'description', 'input_schema',
        'calculation_logic', 'monetization_config', 'is_active'
      ];

      const updates = [];
      const values = [];

      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key)) {
          updates.push(`${key} = ?`);
          values.push(typeof value === 'object' ? JSON.stringify(value) : value);
        }
      }

      if (updates.length === 0) {
        throw new Error('沒有有效的更新欄位');
      }

      values.push(this.id);

      await executeQuery(
        `UPDATE tool_configs SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        values
      );

      logger.info('工具配置更新成功', { toolType: this.toolType });

      // 重新載入資料
      const updated = await executeQuery('SELECT * FROM tool_configs WHERE id = ?', [this.id]);
      if (updated.length > 0) {
        Object.assign(this, new ToolConfig(updated[0]));
      }

      return this;
    } catch (error) {
      logger.error('更新工具配置失敗:', error);
      throw error;
    }
  }

  // 停用工具
  async deactivate() {
    return this.update({ is_active: false });
  }

  // 啟用工具
  async activate() {
    return this.update({ is_active: true });
  }

  // 轉換為 JSON 格式（用於 API 回應）
  toJSON() {
    return {
      id: this.id,
      toolType: this.toolType,
      displayName: this.displayName,
      description: this.description,
      category: this.category,
      inputSchema: this.inputSchema,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // 轉換為公開格式（隱藏敏感資訊）
  toPublicJSON() {
    return {
      id: this.toolType,
      name: this.displayName,
      description: this.description,
      category: this.category,
      inputSchema: this.inputSchema,
      icon: this.getIcon()
    };
  }

  // 根據工具類型獲取圖示
  getIcon() {
    const iconMap = {
      'moonlight-calculator': '💸',
      'noodle-survival': '🍜',
      'breakup-cost': '💔',
      'escape-taipei': '🏃‍♂️',
      'phone-lifespan': '📱',
      'car-vs-uber': '🚗',
      'birthday-collision': '🎂',
      'housing-index': '🏠'
    };

    return iconMap[this.toolType] || '🧮';
  }
}

module.exports = ToolConfig;
