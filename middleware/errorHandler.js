const logger = require('../utils/logger');

class AppError extends Error {
  constructor(message, statusCode, type = 'generic') {
    super(message);
    this.statusCode = statusCode;
    this.type = type;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, _next) => {
  let error = { ...err };
  error.message = err.message;

  // 記錄錯誤
  logger.error('錯誤發生:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // MySQL 錯誤處理
  if (err.code === 'ER_DUP_ENTRY') {
    const message = '資料重複，請檢查輸入';
    error = new AppError(message, 400, 'duplicate_entry');
  }

  if (err.code === 'ER_NO_SUCH_TABLE') {
    const message = '資料表不存在';
    error = new AppError(message, 500, 'table_not_found');
  }

  // JWT 錯誤處理
  if (err.name === 'JsonWebTokenError') {
    const message = '無效的認證令牌';
    error = new AppError(message, 401, 'invalid_token');
  }

  if (err.name === 'TokenExpiredError') {
    const message = '認證令牌已過期';
    error = new AppError(message, 401, 'token_expired');
  }

  // 驗證錯誤處理
  if (err.name === 'ValidationError') {
    const message = '輸入資料驗證失敗';
    error = new AppError(message, 400, 'validation_error');
  }

  // 預設錯誤
  const statusCode = error.statusCode || 500;
  const message = error.isOperational ? error.message : '伺服器內部錯誤';

  // 回應格式
  const response = {
    success: false,
    error: {
      type: error.type || 'server_error',
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  };

  res.status(statusCode).json(response);
};

module.exports = { errorHandler, AppError };
