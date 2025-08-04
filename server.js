const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const logger = require('./utils/logger');
const { errorHandler } = require('./middleware/errorHandler');
const { connectDatabase } = require('./config/database');
const toolManager = require('./services/ToolManager');

const app = express();
const PORT = process.env.PORT || 3001;

// 動態端口尋找函數
async function findAvailablePort(startPort) {
  const net = require('net');
  
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.listen(startPort, () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
    
    server.on('error', () => {
      // 端口被佔用，嘗試下一個
      resolve(findAvailablePort(startPort + 1));
    });
  });
}

// 安全中介軟體
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ['\'self\''],
      styleSrc: ['\'self\'', '\'unsafe-inline\'', 'https://fonts.googleapis.com'],
      fontSrc: ['\'self\'', 'https://fonts.gstatic.com'],
      scriptSrc: ['\'self\'', 'https://pagead2.googlesyndication.com'],
      imgSrc: ['\'self\'', 'data:', 'https:'],
      connectSrc: ['\'self\'']
    }
  }
}));

// CORS 配置
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 分鐘
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 限制每個 IP 100 次請求
  message: {
    error: '請求過於頻繁，請稍後再試',
    retryAfter: '15分鐘'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// 基本中介軟體
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Session 配置
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 小時
  }
}));

// 靜態文件服務
app.use(express.static(path.join(__dirname, 'public')));

// 健康檢查端點
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API 路由
app.use('/api/tools', require('./routes/tools'));
app.use('/api/users', require('./routes/users'));
app.use('/api/admin', require('./routes/admin'));

// 主頁路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404 處理
app.use('*', (req, res) => {
  res.status(404).json({
    error: '找不到請求的資源',
    path: req.originalUrl
  });
});

// 全域錯誤處理
app.use(errorHandler);

// 啟動伺服器
async function startServer() {
  try {
    // 在非測試環境下連接資料庫
    if (process.env.NODE_ENV !== 'test') {
      await connectDatabase();
      logger.info('資料庫連接成功');
      
      // 初始化工具管理系統
      try {
        await toolManager.initialize();
        logger.info('🔧 工具管理系統初始化成功');
      } catch (error) {
        logger.error('工具管理系統初始化失敗:', error);
        throw error;
      }
    }

    // 智能端口選擇：生產環境用固定端口，開發環境自動尋找可用端口
    let finalPort = PORT;
    if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
      finalPort = await findAvailablePort(PORT);
      if (finalPort !== PORT) {
        logger.info(`端口 ${PORT} 被佔用，自動切換到端口 ${finalPort}`);
      }
    }

    // 啟動伺服器
    const server = app.listen(finalPort, () => {
      if (process.env.NODE_ENV !== 'test') {
        logger.info('🚀 台灣人生算式伺服器啟動成功！');
        logger.info(`📍 伺服器地址: http://localhost:${finalPort}`);
        logger.info(`🌍 環境: ${process.env.NODE_ENV || 'development'}`);
        
        // 如果端口發生變化，提供建議
        if (finalPort !== PORT) {
          logger.info(`💡 建議：為避免端口衝突，請在 .env 中設定 PORT=${finalPort}`);
        }
      }
    });

    return server;
  } catch (error) {
    logger.error('伺服器啟動失敗:', error);
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
    throw error;
  }
}

// 優雅關閉
process.on('SIGTERM', () => {
  logger.info('收到 SIGTERM 信號，正在優雅關閉伺服器...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('收到 SIGINT 信號，正在優雅關閉伺服器...');
  process.exit(0);
});

// 只在非測試環境下自動啟動
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = app;
