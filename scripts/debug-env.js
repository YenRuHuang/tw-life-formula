require('dotenv').config();

console.log('=== 環境變數檢查 ===');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***已設定***' : '未設定');
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_PORT:', process.env.DB_PORT);

console.log('\n=== 資料庫配置 ===');
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'tw_life_formula',
  port: process.env.DB_PORT || 3306,
};

console.log('最終配置:', {
  ...dbConfig,
  password: dbConfig.password ? '***已設定***' : '未設定'
});
