const net = require('net');

async function findAvailablePort(startPort = 3000) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.listen(startPort, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });

    server.on('error', () => {
      findAvailablePort(startPort + 1).then(resolve);
    });
  });
}

async function main() {
  const port = await findAvailablePort(3000);
  console.log(port);
}

if (require.main === module) {
  main();
}

module.exports = { findAvailablePort };
