// 載入環境變數
require('dotenv').config();

const { connectDatabase, executeQuery } = require('../config/database');
const logger = require('../utils/logger');

/**
 * 添加測驗類工具到資料庫
 */
async function addTestTools() {
  try {
    await connectDatabase();
    logger.info('開始添加測驗類工具配置...');

    const testTools = [
      {
        toolType: 'lazy-index-test',
        displayName: '懶人指數測試',
        description: '測試你的懶人程度，看看你比多少人更懶',
        category: 'test',
        icon: '😴',
        inputSchema: JSON.stringify({
          sleep_hours: {
            type: 'number',
            required: true,
            min: 4,
            max: 16,
            label: '每日睡眠時數'
          },
          exercise_frequency: {
            type: 'string',
            required: true,
            options: ['never', 'rarely', 'sometimes', 'often', 'daily'],
            label: '運動頻率'
          },
          cooking_frequency: {
            type: 'string', 
            required: true,
            options: ['never', 'rarely', 'sometimes', 'often', 'daily'],
            label: '自己煮飯頻率'
          },
          cleaning_frequency: {
            type: 'string',
            required: true,
            options: ['never', 'rarely', 'sometimes', 'often', 'daily'], 
            label: '打掃頻率'
          },
          procrastination_level: {
            type: 'number',
            required: true,
            min: 1,
            max: 10,
            label: '拖延症程度(1-10)'
          }
        }),
        calculationLogic: JSON.stringify({
          type: 'test_scoring',
          scoring_method: 'weighted_average',
          max_score: 100
        }),
        monetizationConfig: JSON.stringify({
          affiliateProducts: ['懶人用品', '自動化設備', '健康產品'],
          adPlacement: ['result_page', 'share_page']
        })
      },
      {
        toolType: 'gaming-addiction-calculator',
        displayName: '遊戲成癮計算機',
        description: '計算你的遊戲成癮程度和每年花費',
        category: 'test',
        icon: '🎮',
        inputSchema: JSON.stringify({
          daily_gaming_hours: {
            type: 'number',
            required: true,
            min: 0,
            max: 24,
            label: '每日遊戲時數'
          },
          monthly_gaming_expense: {
            type: 'number',
            required: true,
            min: 0,
            label: '每月遊戲花費'
          },
          gaming_years: {
            type: 'number',
            required: true,
            min: 1,
            max: 50,
            label: '遊戲資歷(年)'
          },
          skip_meals_for_gaming: {
            type: 'string',
            required: true,
            options: ['never', 'rarely', 'sometimes', 'often', 'always'],
            label: '為遊戲跳過用餐'
          },
          lose_sleep_for_gaming: {
            type: 'string',
            required: true,
            options: ['never', 'rarely', 'sometimes', 'often', 'always'],
            label: '為遊戲熬夜'
          }
        }),
        calculationLogic: JSON.stringify({
          type: 'addiction_scoring',
          factors: ['time', 'money', 'lifestyle_impact'],
          max_score: 100
        }),
        monetizationConfig: JSON.stringify({
          affiliateProducts: ['遊戲設備', '健康產品', '時間管理工具'],
          adPlacement: ['result_page', 'suggestion_section']  
        })
      },
      {
        toolType: 'aging-simulator',
        displayName: '變老模擬計算機',
        description: '模擬你的老化速度，預測未來的你',
        category: 'test',
        icon: '👴',
        inputSchema: JSON.stringify({
          current_age: {
            type: 'number',
            required: true,
            min: 18,
            max: 80,
            label: '目前年齡'
          },
          exercise_level: {
            type: 'string',
            required: true,
            options: ['never', 'light', 'moderate', 'intense'],
            label: '運動強度'
          },
          smoking_status: {
            type: 'string',
            required: true,
            options: ['never', 'former', 'light', 'heavy'],
            label: '吸菸狀況'
          },
          drinking_frequency: {
            type: 'string',
            required: true,
            options: ['never', 'rarely', 'moderate', 'heavy'],
            label: '飲酒頻率'
          },
          sleep_quality: {
            type: 'string',
            required: true,
            options: ['poor', 'fair', 'good', 'excellent'],
            label: '睡眠品質'
          },
          stress_level: {
            type: 'number',
            required: true,
            min: 1,
            max: 10,
            label: '壓力程度(1-10)'
          }
        }),
        calculationLogic: JSON.stringify({
          type: 'aging_simulation',
          factors: ['lifestyle', 'habits', 'stress'],
          baseline_lifespan: 80
        }),
        monetizationConfig: JSON.stringify({
          affiliateProducts: ['保健食品', '健身器材', '美容產品'],
          adPlacement: ['result_page', 'recommendation_section']
        })
      },
      {
        toolType: 'food-expense-shocker',
        displayName: '外食花費震撼機',
        description: '計算你的外食花費，震撼到你重新思考人生',
        category: 'calculator',
        icon: '🍕',
        inputSchema: JSON.stringify({
          breakfast_expense: {
            type: 'number',
            required: true,
            min: 0,
            label: '每日早餐花費'
          },
          lunch_expense: {
            type: 'number',
            required: true,
            min: 0,
            label: '每日午餐花費'  
          },
          dinner_expense: {
            type: 'number',
            required: true,
            min: 0,
            label: '每日晚餐花費'
          },
          snack_expense: {
            type: 'number',
            required: true,
            min: 0,
            label: '每日點心花費'
          },
          delivery_frequency: {
            type: 'number',
            required: true,
            min: 0,
            max: 21,
            label: '每週外送次數'
          },
          age: {
            type: 'number',
            required: true,
            min: 18,
            max: 80,
            label: '年齡'
          }
        }),
        calculationLogic: JSON.stringify({
          type: 'expense_calculation',
          projections: ['monthly', 'yearly', 'lifetime'],
          shock_factors: ['total_cost', 'opportunity_cost']
        }),
        monetizationConfig: JSON.stringify({
          affiliateProducts: ['廚具', '食譜書', '食材配送'],
          adPlacement: ['result_page', 'savings_section']
        })
      }
    ];

    for (const tool of testTools) {
      try {
        await executeQuery(`
          INSERT INTO tool_configs (
            tool_type, display_name, description, category,
            input_schema, calculation_logic, monetization_config,
            is_active, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, true, NOW(), NOW())
        `, [
          tool.toolType,
          tool.displayName, 
          tool.description,
          tool.category,
          tool.inputSchema,
          tool.calculationLogic,
          tool.monetizationConfig
        ]);
        
        logger.info(`✅ 工具添加成功: ${tool.displayName}`);
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          logger.info(`⚠️  工具已存在: ${tool.displayName}`);
        } else {
          throw error;
        }
      }
    }

    logger.info('🎉 測驗類工具配置添加完成！');
    
    // 檢查結果
    const toolCount = await executeQuery(`
      SELECT COUNT(*) as count FROM tool_configs WHERE is_active = true
    `);
    
    logger.info(`📊 目前活躍工具總數: ${toolCount[0].count}`);
    
  } catch (error) {
    logger.error('添加測驗工具失敗:', error);
    throw error;
  }
}

// 執行腳本
if (require.main === module) {
  addTestTools()
    .then(() => {
      logger.info('🚀 腳本執行完成！');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('🚨 腳本執行失敗:', error);
      process.exit(1);
    });
}

module.exports = { addTestTools };
