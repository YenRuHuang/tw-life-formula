const { createCanvas, loadImage } = require('canvas');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs').promises;
const logger = require('../utils/logger');
const aiContentGenerator = require('./AIContentGenerator');

/**
 * 分享生成系統
 * 負責生成分享圖片、社群平台整合和分享追蹤統計
 */
class ShareGenerator {
  constructor() {
    this.initialized = false;
    this.templates = new Map();
    this.shareStats = new Map();
    
    // 台灣風格的莫蘭迪色系配色
    this.brandColors = {
      primary: '#8B9A8E',    // 莫蘭迪綠
      secondary: '#A8A5A0',  // 莫蘭迪灰
      accent: '#D4B5A0',     // 莫蘭迪米
      highlight: '#E8C4A0',  // 莫蘭迪橙
      text: '#2C3E30',       // 深綠文字
      textLight: '#7F8C8D',  // 淺灰文字
      background: '#F8F9FA', // 背景白
      cardBg: '#FFFFFF'      // 卡片背景
    };
    
    // 字體配置
    this.fonts = {
      title: '28px "Microsoft JhengHei", "Noto Sans TC", sans-serif',
      subtitle: '20px "Microsoft JhengHei", "Noto Sans TC", sans-serif',
      body: '16px "Microsoft JhengHei", "Noto Sans TC", sans-serif',
      small: '14px "Microsoft JhengHei", "Noto Sans TC", sans-serif'
    };
    
    // Canvas 尺寸配置
    this.canvasConfig = {
      facebook: { width: 1200, height: 630 },   // Facebook 分享圖片尺寸
      instagram: { width: 1080, height: 1080 }, // Instagram 正方形
      line: { width: 1200, height: 800 },       // Line 分享尺寸
      general: { width: 1200, height: 630 }     // 通用尺寸
    };
  }

  /**
   * 初始化分享生成系統
   */
  async initialize() {
    try {
      logger.info('初始化分享生成系統...');
      
      // 初始化分享模板
      await this.initializeTemplates();
      
      // 確保輸出目錄存在
      await this.ensureDirectories();
      
      this.initialized = true;
      logger.info('分享生成系統初始化完成');
      
      return { success: true };
    } catch (error) {
      logger.error('分享生成系統初始化失敗:', error);
      throw error;
    }
  }

  /**
   * 初始化分享模板
   */
  async initializeTemplates() {
    // 基礎模板配置
    const templates = {
      'moonlight-calculator': {
        icon: '🌙',
        bgGradient: ['#8B9A8E', '#A8A5A0'],
        category: '理財計算'
      },
      'noodle-survival': {
        icon: '🍜',
        bgGradient: ['#D4B5A0', '#E8C4A0'],
        category: '生存計算'
      },
      'breakup-cost': {
        icon: '💔',
        bgGradient: ['#C7A5A5', '#D4B5A0'],
        category: '感情計算'
      },
      'escape-taipei': {
        icon: '🏃‍♂️',
        bgGradient: ['#A8A5A0', '#8B9A8E'],
        category: '生活計算'
      },
      'phone-lifespan': {
        icon: '📱',
        bgGradient: ['#8B9A8E', '#D4B5A0'],
        category: '科技計算'
      },
      'car-vs-uber': {
        icon: '🚗',
        bgGradient: ['#A8A5A0', '#E8C4A0'],
        category: '交通計算'
      },
      'birthday-collision': {
        icon: '🎂',
        bgGradient: ['#E8C4A0', '#D4B5A0'],
        category: '趣味計算'
      },
      'housing-index': {
        icon: '🏠',
        bgGradient: ['#8B9A8E', '#A8A5A0'],
        category: '居住計算'
      },
      'lazy-index-test': {
        icon: '😴',
        bgGradient: ['#C7A5A5', '#A8A5A0'],
        category: '個性測驗'
      },
      'gaming-addiction-calculator': {
        icon: '🎮',
        bgGradient: ['#A8A5A0', '#D4B5A0'],
        category: '生活測驗'
      },
      'aging-simulator': {
        icon: '⏳',
        bgGradient: ['#8B9A8E', '#C7A5A5'],
        category: '時間測驗'
      },
      'food-expense-shocker': {
        icon: '🍲',
        bgGradient: ['#D4B5A0', '#E8C4A0'],
        category: '飲食測驗'
      }
    };

    // 註冊所有模板
    for (const [toolType, config] of Object.entries(templates)) {
      this.templates.set(toolType, config);
    }

    logger.info(`載入 ${this.templates.size} 個分享模板`);
  }

  /**
   * 確保必要目錄存在
   */
  async ensureDirectories() {
    const dirs = [
      'public/images/shares',
      'public/images/qrcodes'
    ];

    for (const dir of dirs) {
      try {
        await fs.access(dir);
      } catch (error) {
        await fs.mkdir(dir, { recursive: true });
        logger.info(`創建目錄: ${dir}`);
      }
    }
  }

  /**
   * 生成分享圖片
   * @param {string} toolType - 工具類型
   * @param {Object} result - 計算結果
   * @param {Object} options - 生成選項
   */
  async generateShareImage(toolType, result, options = {}) {
    try {
      this.ensureInitialized();

      const {
        platform = 'general',
        includeQR = true,
        userId = null,
        customTitle = null
      } = options;

      // 獲取 Canvas 尺寸
      const dimensions = this.canvasConfig[platform] || this.canvasConfig.general;
      const canvas = createCanvas(dimensions.width, dimensions.height);
      const ctx = canvas.getContext('2d');

      // 獲取工具模板
      const template = this.templates.get(toolType);
      if (!template) {
        throw new Error(`找不到工具模板: ${toolType}`);
      }

      // 繪製背景
      await this.drawBackground(ctx, dimensions, template);

      // 繪製品牌標題
      await this.drawBrandHeader(ctx, dimensions);

      // 繪製工具圖示和標題
      await this.drawToolHeader(ctx, dimensions, template, customTitle);

      // 繪製主要結果
      await this.drawMainResult(ctx, dimensions, result);

      // 繪製描述文字
      await this.drawDescription(ctx, dimensions, result);

      // 繪製震撼比較（如果有的話）
      if (result.shockingComparisons?.comparisons?.length > 0) {
        await this.drawComparisons(ctx, dimensions, result.shockingComparisons.comparisons);
      }

      // 繪製 QR Code（如果需要）
      if (includeQR) {
        await this.drawQRCode(ctx, dimensions, toolType);
      }

      // 繪製底部資訊
      await this.drawFooter(ctx, dimensions, template.category);

      // 生成檔案名稱
      const timestamp = Date.now();
      const filename = `share-${toolType}-${timestamp}.png`;
      const filepath = path.join('public/images/shares', filename);

      // 儲存圖片
      const buffer = canvas.toBuffer('image/png');
      await fs.writeFile(filepath, buffer);

      // 記錄分享圖片生成
      await this.recordShareGeneration(toolType, platform, userId);

      logger.info(`分享圖片生成成功: ${filename}`);

      return {
        success: true,
        filename,
        filepath: `images/shares/${filename}`,
        url: `${process.env.BASE_URL || 'http://localhost:3001'}/images/shares/${filename}`,
        dimensions,
        platform
      };

    } catch (error) {
      logger.error(`分享圖片生成失敗: ${toolType}`, error);
      throw error;
    }
  }

  /**
   * 繪製背景漸層
   */
  async drawBackground(ctx, dimensions, template) {
    // 創建線性漸層
    const gradient = ctx.createLinearGradient(0, 0, dimensions.width, dimensions.height);
    gradient.addColorStop(0, template.bgGradient[0]);
    gradient.addColorStop(1, template.bgGradient[1]);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);

    // 添加半透明覆蓋層
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);

    // 繪製裝飾性元素
    await this.drawDecorations(ctx, dimensions);
  }

  /**
   * 繪製裝飾性元素
   */
  async drawDecorations(ctx, dimensions) {
    ctx.save();
    
    // 繪製圓形裝飾
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = this.brandColors.background;
    
    // 大圓形
    ctx.beginPath();
    ctx.arc(dimensions.width * 0.8, dimensions.height * 0.2, 150, 0, Math.PI * 2);
    ctx.fill();
    
    // 小圓形  
    ctx.beginPath();
    ctx.arc(dimensions.width * 0.1, dimensions.height * 0.8, 80, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }

  /**
   * 繪製品牌標題
   */
  async drawBrandHeader(ctx, dimensions) {
    ctx.save();
    
    // 品牌標題
    ctx.fillStyle = this.brandColors.text;
    ctx.font = this.fonts.subtitle;
    ctx.textAlign = 'center';
    
    const brandTitle = '台灣人生算式 TW Life Formula';
    ctx.fillText(brandTitle, dimensions.width / 2, 50);
    
    // 底線
    ctx.strokeStyle = this.brandColors.accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(dimensions.width / 2 - 100, 65);
    ctx.lineTo(dimensions.width / 2 + 100, 65);
    ctx.stroke();
    
    ctx.restore();
  }

  /**
   * 繪製工具標題區域
   */
  async drawToolHeader(ctx, dimensions, template, customTitle) {
    ctx.save();
    
    const centerX = dimensions.width / 2;
    const startY = 120;
    
    // 繪製圖示
    ctx.font = '60px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(template.icon, centerX, startY);
    
    // 繪製工具標題
    ctx.fillStyle = this.brandColors.text;
    ctx.font = this.fonts.title;
    ctx.textAlign = 'center';
    
    const title = customTitle || this.getToolDisplayName(Object.keys(this.templates).find(key => this.templates.get(key) === template));
    ctx.fillText(title, centerX, startY + 60);
    
    // 繪製分類標籤
    ctx.fillStyle = this.brandColors.textLight;
    ctx.font = this.fonts.small;
    ctx.fillText(`[ ${template.category} ]`, centerX, startY + 85);
    
    ctx.restore();
  }

  /**
   * 繪製主要結果
   */
  async drawMainResult(ctx, dimensions, result) {
    ctx.save();
    
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    
    // 繪製結果背景圓形
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 120, 0, Math.PI * 2);
    ctx.fill();
    
    // 繪製陰影
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 5;
    
    // 繪製結果數值
    ctx.fillStyle = this.brandColors.text;
    ctx.font = 'bold 48px "Microsoft JhengHei"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const resultText = `${result.value}${result.unit || ''}`;
    ctx.fillText(resultText, centerX, centerY - 10);
    
    // 繪製等級（如果有的話）
    if (result.level) {
      ctx.fillStyle = this.brandColors.accent;
      ctx.font = this.fonts.body;
      ctx.fillText(result.level, centerX, centerY + 25);
    }
    
    ctx.restore();
  }

  /**
   * 繪製描述文字
   */
  async drawDescription(ctx, dimensions, result) {
    ctx.save();
    
    const centerX = dimensions.width / 2;
    const startY = dimensions.height / 2 + 180;
    
    // 繪製描述背景
    const padding = 20;
    const maxWidth = dimensions.width - padding * 4;
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillRect(padding * 2, startY - 30, maxWidth, 80);
    
    // 繪製描述文字
    ctx.fillStyle = this.brandColors.text;
    ctx.font = this.fonts.body;
    ctx.textAlign = 'center';
    
    // 處理長文字換行
    const description = result.description || '';
    const lines = this.wrapText(ctx, description, maxWidth - 40);
    
    lines.forEach((line, index) => {
      ctx.fillText(line, centerX, startY + index * 25);
    });
    
    ctx.restore();
  }

  /**
   * 繪製震撼比較
   */
  async drawComparisons(ctx, dimensions, comparisons) {
    if (!comparisons || comparisons.length === 0) return;
    
    ctx.save();
    
    const startY = dimensions.height - 180;
    const centerX = dimensions.width / 2;
    
    // 標題
    ctx.fillStyle = this.brandColors.textLight;
    ctx.font = this.fonts.small;
    ctx.textAlign = 'center';
    ctx.fillText('震撼比較', centerX, startY - 10);
    
    // 比較項目
    comparisons.slice(0, 2).forEach((comparison, index) => {
      ctx.fillStyle = this.brandColors.text;
      ctx.font = this.fonts.small;
      ctx.fillText(`• ${comparison}`, centerX, startY + 15 + index * 20);
    });
    
    ctx.restore();
  }

  /**
   * 繪製 QR Code
   */
  async drawQRCode(ctx, dimensions, toolType) {
    try {
      const qrUrl = `${process.env.BASE_URL || 'http://localhost:3001'}?tool=${toolType}`;
      const qrCodeDataUrl = await QRCode.toDataURL(qrUrl, {
        width: 100,
        margin: 1,
        color: {
          dark: this.brandColors.text,
          light: '#FFFFFF'
        }
      });
      
      // 載入 QR Code 圖片
      const qrImage = await loadImage(qrCodeDataUrl);
      
      // 繪製 QR Code
      const qrSize = 80;
      const qrX = dimensions.width - qrSize - 20;
      const qrY = dimensions.height - qrSize - 20;
      
      // QR Code 背景
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillRect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10);
      
      ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
      
      // QR Code 說明文字
      ctx.fillStyle = this.brandColors.textLight;
      ctx.font = this.fonts.small;
      ctx.textAlign = 'center';
      ctx.fillText('掃碼測試', qrX + qrSize / 2, qrY + qrSize + 15);
      
    } catch (error) {
      logger.error('QR Code 生成失敗:', error);
    }
  }

  /**
   * 繪製底部資訊
   */
  async drawFooter(ctx, dimensions, category) {
    ctx.save();
    
    const footerY = dimensions.height - 40;
    
    // 左側：網站資訊
    ctx.fillStyle = this.brandColors.textLight;
    ctx.font = this.fonts.small;
    ctx.textAlign = 'left';
    ctx.fillText('twlifeformula.zeabur.app', 20, footerY);
    
    // 右側：分類標籤
    ctx.textAlign = 'right';
    ctx.fillText(`#${category} #台灣人生算式`, dimensions.width - 20, footerY);
    
    ctx.restore();
  }

  /**
   * 文字換行處理
   */
  wrapText(ctx, text, maxWidth) {
    const words = text.split('');
    const lines = [];
    let currentLine = '';
    
    for (const char of words) {
      const testLine = currentLine + char;
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine !== '') {
        lines.push(currentLine);
        currentLine = char;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines.slice(0, 3); // 最多3行
  }

  /**
   * 獲取工具顯示名稱
   */
  getToolDisplayName(toolType) {
    const toolNames = {
      'moonlight-calculator': '月光族指數計算機',
      'noodle-survival': '泡麵生存計算機',
      'breakup-cost': '分手成本計算機',
      'escape-taipei': '逃離台北計算機',
      'phone-lifespan': '手機壽命計算機',
      'car-vs-uber': '養車 vs Uber 計算機',
      'birthday-collision': '生日撞期計算機',
      'housing-index': '蝸居指數計算機',
      'lazy-index-test': '懶人指數測驗',
      'gaming-addiction-calculator': '遊戲成癮計算機',
      'aging-simulator': '老化模擬器',
      'food-expense-shocker': '飲食支出震撼彈'
    };

    return toolNames[toolType] || toolType;
  }

  /**
   * 生成分享內容
   * @param {string} toolType - 工具類型
   * @param {Object} result - 計算結果
   * @param {string} platform - 分享平台
   */
  async generateShareContent(toolType, result, platform = 'facebook') {
    try {
      this.ensureInitialized();

      // 使用 AI 生成分享文案
      const shareContent = await aiContentGenerator.generateShareContent(toolType, result, platform);
      
      // 生成分享圖片
      const imageResult = await this.generateShareImage(toolType, result, { platform });
      
      // 組合社群分享包
      const socialPackage = {
        platform,
        content: shareContent.content,
        image: {
          url: imageResult.url,
          filepath: imageResult.filepath,
          filename: imageResult.filename
        },
        hashtags: this.generateHashtags(toolType, result, platform),
        url: `${process.env.BASE_URL || 'http://localhost:3001'}?tool=${toolType}`,
        isAI: shareContent.isAI || false
      };

      logger.info(`社群分享內容生成成功: ${toolType} - ${platform}`);
      
      return socialPackage;

    } catch (error) {
      logger.error(`社群分享內容生成失敗: ${toolType}`, error);
      throw error;
    }
  }

  /**
   * 生成 Hashtags
   */
  generateHashtags(toolType, result, platform) {
    const baseHashtags = ['台灣人生算式', 'TWLifeFormula'];
    
    // 根據工具類型添加相關標籤
    const toolHashtags = {
      'moonlight-calculator': ['月光族', '理財', '存錢'],
      'noodle-survival': ['泡麵', '省錢', '學生'],
      'breakup-cost': ['分手', '感情', '理財'],
      'escape-taipei': ['台北', '生活', '移居'],
      'phone-lifespan': ['手機', '科技', '換機'],
      'car-vs-uber': ['交通', '養車', 'Uber'],
      'birthday-collision': ['生日', '機率', '有趣'],
      'housing-index': ['房租', '居住', '蝸居']
    };

    const specificHashtags = toolHashtags[toolType] || [];
    
    // 根據結果添加動態標籤
    if (result.level) {
      specificHashtags.push(result.level);
    }

    return [...baseHashtags, ...specificHashtags].slice(0, platform === 'instagram' ? 8 : 5);
  }

  /**
   * 記錄分享統計
   * @param {string} toolType - 工具類型
   * @param {string} platform - 分享平台
   * @param {string} userId - 用戶ID
   * @param {string} action - 動作類型 (generate, share, click)
   */
  async recordShare(toolType, platform, userId = null, action = 'generate') {
    try {
      const { executeQuery } = require('../config/database');
      
      // 記錄到資料庫
      await executeQuery(`
        INSERT INTO share_stats (tool_id, platform, user_id, action, created_at)
        VALUES (?, ?, ?, ?, NOW())
      `, [toolType, platform, userId, action]);
      
      // 更新記憶體統計
      const key = `${toolType}-${platform}-${action}`;
      const current = this.shareStats.get(key) || 0;
      this.shareStats.set(key, current + 1);
      
      logger.info(`記錄分享統計: ${toolType} - ${platform} - ${action}`);
      
    } catch (error) {
      logger.error('記錄分享統計失敗:', error);
      // 不拋出錯誤，避免影響主要功能
    }
  }

  /**
   * 記錄分享圖片生成統計
   */
  async recordShareGeneration(toolType, platform, userId) {
    await this.recordShare(toolType, platform, userId, 'generate');
  }

  /**
   * 獲取分享統計
   * @param {string} toolType - 工具類型（可選）
   * @param {string} platform - 平台（可選）
   */
  async getShareStats(toolType = null, platform = null) {
    try {
      const { executeQuery } = require('../config/database');
      
      let query = `
        SELECT 
          tool_id, 
          platform, 
          action,
          COUNT(*) as count,
          DATE(created_at) as date
        FROM share_stats
      `;
      
      const params = [];
      const conditions = [];
      
      if (toolType) {
        conditions.push('tool_id = ?');
        params.push(toolType);
      }
      
      if (platform) {
        conditions.push('platform = ?');
        params.push(platform);
      }
      
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      
      query += ' GROUP BY tool_id, platform, action, DATE(created_at) ORDER BY created_at DESC';
      
      const results = await executeQuery(query, params);
      
      return {
        success: true,
        stats: results,
        summary: this.calculateStatsSummary(results)
      };
      
    } catch (error) {
      logger.error('獲取分享統計失敗:', error);
      return {
        success: false,
        error: error.message,
        stats: []
      };
    }
  }

  /**
   * 計算統計摘要
   */
  calculateStatsSummary(stats) {
    const summary = {
      totalShares: 0,
      totalGenerations: 0,
      topPlatforms: {},
      topTools: {}
    };
    
    stats.forEach(stat => {
      if (stat.action === 'generate') {
        summary.totalGenerations += stat.count;
      } else if (stat.action === 'share') {
        summary.totalShares += stat.count;
      }
      
      // 統計平台
      summary.topPlatforms[stat.platform] = (summary.topPlatforms[stat.platform] || 0) + stat.count;
      
      // 統計工具
      summary.topTools[stat.tool_id] = (summary.topTools[stat.tool_id] || 0) + stat.count;
    });
    
    return summary;
  }

  /**
   * 確保系統已初始化
   */
  ensureInitialized() {
    if (!this.initialized) {
      throw new Error('分享生成系統尚未初始化，請先調用 initialize() 方法');
    }
  }

  /**
   * 獲取系統狀態
   */
  getStatus() {
    return {
      initialized: this.initialized,
      templatesCount: this.templates.size,
      supportedPlatforms: Object.keys(this.canvasConfig),
      memoryStats: this.shareStats.size
    };
  }
}

// 創建單例實例
const shareGenerator = new ShareGenerator();

module.exports = shareGenerator;
