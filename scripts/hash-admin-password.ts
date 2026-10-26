import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";
import { createInterface } from "node:readline/promises";

const scrypt = promisify(scryptCallback);

async function main(): Promise<void> {
  const terminal = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const password = await terminal.question("Admin password (input is visible): ");

    if (password.length < 12) {
      throw new Error("Admin password must be at least 12 characters long");
    }

    const salt = randomBytes(16);
    const hash = (await scrypt(password, salt, 64)) as Buffer;

    console.log("\nAdd the following line to your .env file:\n");
    console.log(
      `ADMIN_PASSWORD_HASH=scrypt$${salt.toString("base64url")}$${hash.toString("base64url")}`,
    );
  } finally {
    terminal.close();
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}); 