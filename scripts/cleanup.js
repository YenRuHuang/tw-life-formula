const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

async function killPortProcesses(ports = [3000, 3001, 3002, 8000, 8080]) {
  console.log('🧹 清理佔用的端口...');

  for (const port of ports) {
    try {
      const { stdout } = await execAsync(`lsof -ti:${port}`);
      if (stdout.trim()) {
        const pids = stdout.trim().split('\n');
        for (const pid of pids) {
          await execAsync(`kill -9 ${pid}`);
          console.log(`✅ 已清理端口 ${port} (PID: ${pid})`);
        }
      }
    } catch (error) {
      // 端口沒有被佔用，忽略錯誤
    }
  }
}

async function killNodemonProcesses() {
  console.log('🧹 清理 nodemon 進程...');

  try {
    await execAsync('pkill -f nodemon');
    console.log('✅ 已清理 nodemon 進程');
  } catch (error) {
    // 沒有 nodemon 進程，忽略錯誤
  }
}

async function main() {
  await killPortProcesses();
  await killNodemonProcesses();
  console.log('🎉 清理完成！');
}

if (require.main === module) {
  main();
}

module.exports = { killPortProcesses, killNodemonProcesses };
