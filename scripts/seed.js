require('dotenv').config();
const { connectDatabase, executeQuery } = require('../config/database');
const logger = require('../utils/logger');

// 種子資料
const seedData = {
  tool_configs: [
    {
      tool_type: 'moonlight-calculator',
      display_name: '月光族指數計算機',
      description: '計算你的月光族指數，看看你比多少人更月光',
      category: 'calculator',
      input_schema: JSON.stringify({
        salary: { type: 'number', required: true, min: 0, label: '月收入' },
        expenses: { type: 'number', required: true, min: 0, label: '月支出' },
        savings: { type: 'number', required: true, min: 0, label: '月儲蓄' }
      }),
      calculation_logic: JSON.stringify({
        formula: '(expenses / salary) * 100',
        ranking_data: 'taiwan_moonlight_stats',
        shock_factor: 'high'
      }),
      monetization_config: JSON.stringify({
        affiliate_products: ['budgeting_apps', 'financial_courses', 'investment_platforms'],
        ad_placement: ['result_page', 'share_modal']
      }),
      is_active: true
    },
    {
      tool_type: 'noodle-survival',
      display_name: '泡麵生存計算機',
      description: '計算如果失業，你可以吃泡麵活多少天',
      category: 'calculator',
      input_schema: JSON.stringify({
        savings: { type: 'number', required: true, min: 0, label: '存款金額' },
        monthly_expenses: { type: 'number', required: true, min: 0, label: '月支出' }
      }),
      calculation_logic: JSON.stringify({
        formula: 'savings / (25 * 30)', // 泡麵一天25元
        ranking_data: 'taiwan_survival_stats',
        shock_factor: 'extreme'
      }),
      monetization_config: JSON.stringify({
        affiliate_products: ['insurance_products', 'emergency_funds', 'savings_accounts'],
        ad_placement: ['result_page', 'calculation_form']
      }),
      is_active: true
    },
    {
      tool_type: 'breakup-cost',
      display_name: '分手成本計算機',
      description: '分析分手將損失多少金錢和回憶',
      category: 'calculator',
      input_schema: JSON.stringify({
        relationship_months: { type: 'number', required: true, min: 1, label: '交往月數' },
        monthly_spending: { type: 'number', required: true, min: 0, label: '每月花費' },
        shared_assets: { type: 'number', required: true, min: 0, label: '共同資產' }
      }),
      calculation_logic: JSON.stringify({
        formula: '(relationship_months * monthly_spending) + (shared_assets / 2)',
        emotional_cost: 'relationship_months * 60', // 每月60個回憶
        shock_factor: 'high'
      }),
      monetization_config: JSON.stringify({
        affiliate_products: ['counseling_services', 'legal_services', 'self_care_products'],
        ad_placement: ['result_page', 'emotional_support']
      }),
      is_active: true
    },
    {
      tool_type: 'escape-taipei',
      display_name: '逃離台北計算機',
      description: '計算你需要存多少錢才能逃離台北',
      category: 'calculator',
      input_schema: JSON.stringify({
        current_salary: { type: 'number', required: true, min: 0, label: '目前薪水' },
        target_city: { type: 'string', required: true, label: '目標城市' },
        lifestyle_level: { type: 'string', required: true, options: ['basic', 'comfortable', 'luxury'], label: '生活水準' }
      }),
      calculation_logic: JSON.stringify({
        formula: 'city_cost_difference * 12 + moving_costs + emergency_fund',
        ranking_data: 'taiwan_migration_stats',
        shock_factor: 'medium'
      }),
      monetization_config: JSON.stringify({
        affiliate_products: ['real_estate', 'moving_services', 'job_platforms'],
        ad_placement: ['result_page', 'city_comparison']
      }),
      is_active: true
    },
    {
      tool_type: 'phone-lifespan',
      display_name: '手機壽命計算機',
      description: '預測你的手機還能撐多少天',
      category: 'calculator',
      input_schema: JSON.stringify({
        phone_age_months: { type: 'number', required: true, min: 0, label: '手機使用月數' },
        daily_usage_hours: { type: 'number', required: true, min: 0, max: 24, label: '每日使用時數' },
        phone_brand: { type: 'string', required: true, label: '手機品牌' }
      }),
      calculation_logic: JSON.stringify({
        formula: 'brand_lifespan - (phone_age_months + usage_factor)',
        ranking_data: 'phone_durability_stats',
        shock_factor: 'medium'
      }),
      monetization_config: JSON.stringify({
        affiliate_products: ['phone_insurance', 'new_phones', 'repair_services'],
        ad_placement: ['result_page', 'upgrade_suggestions']
      }),
      is_active: true
    },
    {
      tool_type: 'car-vs-uber',
      display_name: '養車 vs Uber 計算機',
      description: '比較養車和搭 Uber 的成本差異',
      category: 'calculator',
      input_schema: JSON.stringify({
        car_price: { type: 'number', required: true, min: 0, label: '車輛價格' },
        monthly_fuel: { type: 'number', required: true, min: 0, label: '每月油費' },
        monthly_trips: { type: 'number', required: true, min: 0, label: '每月搭車次數' }
      }),
      calculation_logic: JSON.stringify({
        formula: '(car_costs_annual) - (uber_costs_annual)',
        ranking_data: 'transportation_choice_stats',
        shock_factor: 'high'
      }),
      monetization_config: JSON.stringify({
        affiliate_products: ['car_insurance', 'uber_credits', 'public_transport'],
        ad_placement: ['result_page', 'transportation_ads']
      }),
      is_active: true
    },
    {
      tool_type: 'birthday-collision',
      display_name: '生日撞期計算機',
      description: '發現全台灣有多少人跟你同天生日',
      category: 'fun',
      input_schema: JSON.stringify({
        birth_month: { type: 'number', required: true, min: 1, max: 12, label: '出生月份' },
        birth_day: { type: 'number', required: true, min: 1, max: 31, label: '出生日期' }
      }),
      calculation_logic: JSON.stringify({
        formula: '(taiwan_population / 365.25) * celebrity_factor',
        ranking_data: 'birthday_distribution_stats',
        shock_factor: 'medium'
      }),
      monetization_config: JSON.stringify({
        affiliate_products: ['birthday_gifts', 'party_supplies', 'astrology_services'],
        ad_placement: ['result_page', 'birthday_products']
      }),
      is_active: true
    },
    {
      tool_type: 'housing-index',
      display_name: '蝸居指數計算機',
      description: '比較你的居住空間和其他城市的差異',
      category: 'calculator',
      input_schema: JSON.stringify({
        living_space: { type: 'number', required: true, min: 0, label: '居住坪數' },
        rent_price: { type: 'number', required: true, min: 0, label: '租金/房貸' },
        city: { type: 'string', required: true, label: '居住城市' }
      }),
      calculation_logic: JSON.stringify({
        formula: 'space_per_dollar_ratio compared to global_cities',
        ranking_data: 'global_housing_stats',
        shock_factor: 'extreme'
      }),
      monetization_config: JSON.stringify({
        affiliate_products: ['real_estate', 'interior_design', 'moving_services'],
        ad_placement: ['result_page', 'housing_solutions']
      }),
      is_active: true
    }
  ]
};

async function seedDatabase() {
  try {
    logger.info('開始執行資料庫種子資料...');

    // 連接資料庫
    await connectDatabase();

    // 清空現有的工具配置（開發環境）
    if (process.env.NODE_ENV === 'development') {
      await executeQuery('DELETE FROM tool_configs');
      logger.info('清空現有工具配置');
    }

    // 插入工具配置
    logger.info('插入工具配置資料...');
    for (const config of seedData.tool_configs) {
      try {
        await executeQuery(`
          INSERT INTO tool_configs (
            tool_type, display_name, description, category,
            input_schema, calculation_logic, monetization_config, is_active
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            display_name = VALUES(display_name),
            description = VALUES(description),
            category = VALUES(category),
            input_schema = VALUES(input_schema),
            calculation_logic = VALUES(calculation_logic),
            monetization_config = VALUES(monetization_config),
            is_active = VALUES(is_active)
        `, [
          config.tool_type,
          config.display_name,
          config.description,
          config.category,
          config.input_schema,
          config.calculation_logic,
          config.monetization_config,
          config.is_active
        ]);

        logger.info(`工具配置已插入: ${config.display_name}`);
      } catch (error) {
        logger.error(`插入工具配置失敗: ${config.tool_type}`, error);
      }
    }

    // 建立測試用戶（僅開發環境）
    if (process.env.NODE_ENV === 'development') {
      logger.info('建立測試用戶...');

      const testUsers = [
        { session_id: 'test_user_001', preferences: '{"theme": "light", "language": "zh-TW"}' },
        { session_id: 'test_user_002', preferences: '{"theme": "dark", "language": "zh-TW"}' },
        { session_id: 'test_user_premium', preferences: '{"theme": "light", "language": "zh-TW"}' }
      ];

      for (const user of testUsers) {
        try {
          const result = await executeQuery(`
            INSERT INTO users (session_id, preferences) VALUES (?, ?)
            ON DUPLICATE KEY UPDATE preferences = VALUES(preferences)
          `, [user.session_id, user.preferences]);

          // 為 premium 測試用戶建立訂閱
          if (user.session_id === 'test_user_premium') {
            await executeQuery(`
              INSERT INTO user_subscriptions (user_id, tier, status) VALUES (?, 'premium', 'active')
              ON DUPLICATE KEY UPDATE tier = 'premium', status = 'active'
            `, [result.insertId || 3]);
          }

          logger.info(`測試用戶已建立: ${user.session_id}`);
        } catch (error) {
          logger.error(`建立測試用戶失敗: ${user.session_id}`, error);
        }
      }
    }

    logger.info('資料庫種子資料執行完成！');

    // 顯示統計資訊
    await showSeedStats();

  } catch (error) {
    logger.error('資料庫種子資料執行失敗:', error);
    process.exit(1);
  }
}

async function showSeedStats() {
  try {
    logger.info('=== 種子資料統計 ===');

    const toolCount = await executeQuery('SELECT COUNT(*) as count FROM tool_configs WHERE is_active = true');
    logger.info(`活躍工具數量: ${toolCount[0].count}`);

    const userCount = await executeQuery('SELECT COUNT(*) as count FROM users');
    logger.info(`用戶數量: ${userCount[0].count}`);

    const premiumCount = await executeQuery('SELECT COUNT(*) as count FROM user_subscriptions WHERE tier = "premium"');
    logger.info(`高級用戶數量: ${premiumCount[0].count}`);

    // 顯示工具列表
    const tools = await executeQuery('SELECT tool_type, display_name, category FROM tool_configs WHERE is_active = true ORDER BY category, tool_type');
    logger.info('可用工具:');
    let currentCategory = '';
    for (const tool of tools) {
      if (tool.category !== currentCategory) {
        currentCategory = tool.category;
        logger.info(`  [${currentCategory.toUpperCase()}]`);
      }
      logger.info(`    - ${tool.display_name} (${tool.tool_type})`);
    }

  } catch (error) {
    logger.error('無法顯示種子資料統計:', error);
  }
}

// 如果直接執行此腳本
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase, seedData };
