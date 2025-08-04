const { spawn } = require('child_process');
const { findAvailablePort } = require('./find-port');
const { killPortProcesses } = require('./cleanup');

async function smartStart() {
  console.log('🚀 智能啟動台灣人生算式...');

  // 1. 清理端口
  await killPortProcesses();

  // 2. 找到可用端口
  const port = await findAvailablePort(3000);
  console.log(`📍 使用端口: ${port}`);

  // 3. 設定環境變數並啟動
  const env = { ...process.env, PORT: port };

  const server = spawn('node', ['server.js'], {
    env,
    stdio: 'inherit'
  });

  server.on('close', (code) => {
    console.log(`伺服器已停止 (退出碼: ${code})`);
  });

  // 優雅關閉
  process.on('SIGINT', () => {
    console.log('\n🛑 正在關閉伺服器...');
    server.kill('SIGINT');
  });
}

if (require.main === module) {
  smartStart();
}

module.exports = { smartStart };
