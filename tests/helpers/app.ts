import supertest from "supertest";
import createApp from "../../src/app";

const app = createApp();
const client = supertest(app);

export function getClient() {
  return client;
}

export async function adminToken(): Promise<string> {
  const response = await client
    .post("/api/v1/auth/login")
    .send({ username: "admin", password: "1234567890123" });

  if (response.status !== 200) {
    throw new Error(`Admin login failed: ${JSON.stringify(response.body)}`);
  }

  return response.body.data.token as string;
}