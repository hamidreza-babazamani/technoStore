const http = require("node:http");

const { createApp } = require("./app");
const { envConfig, validateEnv } = require("./config/env");
const { connectDatabase, disconnectDatabase } = require("./config/database");

async function startServer() {
  validateEnv();

  await connectDatabase();

  const server = http.createServer(createApp());

  server.listen(envConfig.PORT, () => {
    console.log(`Server is running at http://localhost:${envConfig.PORT}`);
    console.log(`Environment: ${envConfig.NODE_ENV}`);
  });

  let shuttingDown = false;

  async function shutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;

    console.log(`${signal} received. Shutting down...`);

    server.close(async (error) => {
      if (error) {
        console.error("HTTP server shutdown error:", error.message);
        process.exitCode = 1;
      }

      try {
        await disconnectDatabase();
      } catch {
        process.exitCode = 1;
      }

      process.exit();
    });

    setTimeout(() => {
      console.error("Graceful shutdown timed out.");
      process.exit(1);
    }, 10000).unref();
  }

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  server.on("error", (error) => {
    console.error("HTTP server error:", error.message);
    process.exitCode = 1;
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error.message);
  process.exitCode = 1;
});
