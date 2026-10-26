import createApp from "./app";
import envConfig from "./config/env";
import { connectDatabase, disconnectDatabase } from "./config/database";

const app = createApp();

let server: ReturnType<typeof app.listen> | undefined;
let shuttingDown = false;

const gracefulShutdown = async (signal: string): Promise<void> => {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log(`\nReceived ${signal}. Shutting down gracefully...`);

  if (!server) {
    await disconnectDatabase();
    process.exit(0);
  }

  server.close(async (error) => {
    if (error) {
      console.error("HTTP server shutdown error:", error);
      process.exitCode = 1;
    } else {
      console.log("HTTP server closed");
    }

    try {
      await disconnectDatabase();
    } catch {
      process.exitCode = 1;
    }

    process.exit();
  });

  setTimeout(() => {
    console.error("Graceful shutdown timed out");
    process.exit(1);
  }, 10000).unref();
};

const startServer = async (): Promise<void> => {
  try {
    await connectDatabase();

    server = app.listen(envConfig.PORT, () => {
      console.log(`Server is running on port ${envConfig.PORT}`);
      console.log(`Environment: ${envConfig.NODE_ENV}`);
      console.log(`API docs: http://localhost:${envConfig.PORT}/api-docs`);
    });

    server.on("error", (error) => {
      console.error("HTTP server error:", error);
      process.exitCode = 1;
    });

    process.on("SIGINT", () => void gracefulShutdown("SIGINT"));
    process.on("SIGTERM", () => void gracefulShutdown("SIGTERM"));
  } catch (error) {
    console.error("Failed to start server:");
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
};

void startServer();