import dotenv from "dotenv";

dotenv.config();

interface EnvConfig {
  PORT: number;
  NODE_ENV: string;
  MONGODB_URI: string;
  ADMIN_USERNAME: string;
  ADMIN_PASSWORD_HASH: string;
  ADMIN_TOKEN_SECRET: string;
  ADMIN_TOKEN_TTL_SECONDS: number;
}

const VALID_NODE_ENVS = ["development", "production", "test"] as const;

function parsePort(raw: string | undefined): number {
  const value = raw ?? "5001";
  const port = Number.parseInt(value, 10);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535");
  }

  return port;
}

function parsePositiveInteger(raw: string | undefined, fallback: number, name: string): number {
  if (raw === undefined || raw === "") return fallback;

  const value = Number.parseInt(raw, 10);

  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${name} must be a positive integer`);
  }

  return value;
}

function requireString(raw: string | undefined, name: string): string {
  if (typeof raw !== "string" || raw.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return raw.trim();
}

function validateEnv(): EnvConfig {
  const nodeEnv = requireString(process.env.NODE_ENV, "NODE_ENV");

  if (!VALID_NODE_ENVS.includes(nodeEnv as (typeof VALID_NODE_ENVS)[number])) {
    throw new Error(`NODE_ENV must be one of: ${VALID_NODE_ENVS.join(", ")}`);
  }

  const mongodbUri = requireString(process.env.MONGODB_URI, "MONGODB_URI");
  const adminUsername = requireString(process.env.ADMIN_USERNAME, "ADMIN_USERNAME");
  const adminPasswordHash = requireString(process.env.ADMIN_PASSWORD_HASH, "ADMIN_PASSWORD_HASH");
  const adminTokenSecret = requireString(process.env.ADMIN_TOKEN_SECRET, "ADMIN_TOKEN_SECRET");

  if (adminTokenSecret.length < 32) {
    throw new Error("ADMIN_TOKEN_SECRET must be at least 32 characters long");
  }

  if (!/^scrypt\$[A-Za-z0-9_-]+\$[A-Za-z0-9_-]+$/.test(adminPasswordHash)) {
    throw new Error("ADMIN_PASSWORD_HASH must have the form: scrypt$<salt>$<hash>");
  }

  return {
    PORT: parsePort(process.env.PORT),
    NODE_ENV: nodeEnv,
    MONGODB_URI: mongodbUri,
    ADMIN_USERNAME: adminUsername,
    ADMIN_PASSWORD_HASH: adminPasswordHash,
    ADMIN_TOKEN_SECRET: adminTokenSecret,
    ADMIN_TOKEN_TTL_SECONDS: parsePositiveInteger(
      process.env.ADMIN_TOKEN_TTL_SECONDS,
      8 * 60 * 60,
      "ADMIN_TOKEN_TTL_SECONDS",
    ),
  };
}

function loadEnv(): EnvConfig {
  try {
    return validateEnv();
  } catch (error) {
    console.error("Failed to load environment configuration:");
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }

  // Unreachable: process.exit never returns, but this keeps TypeScript happy.
  throw new Error("Environment configuration is invalid");
}

const envConfig = loadEnv();

export default envConfig;