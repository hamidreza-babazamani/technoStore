import { getClient } from "./helpers/app";

describe("POST /api/v1/auth/login", () => {
  it("returns a token for valid credentials", async () => {
    const client = await getClient();
    const response = await client
      .post("/api/v1/auth/login")
      .send({ username: "admin", password: "1234567890123" });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(typeof response.body.data.token).toBe("string");
    expect(response.body.data.expiresIn).toBeGreaterThan(0);
  });

  it("rejects an invalid password", async () => {
    const client = await getClient();
    const response = await client
      .post("/api/v1/auth/login")
      .send({ username: "admin", password: "wrong-password" });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it("rejects an invalid username", async () => {
    const client = await getClient();
    const response = await client
      .post("/api/v1/auth/login")
      .send({ username: "not-admin", password: "1234567890123" });

    expect(response.status).toBe(401);
  });

  it("rejects missing credentials", async () => {
    const client = await getClient();
    const response = await client.post("/api/v1/auth/login").send({});

    expect(response.status).toBe(400);
  });

  it("rejects non-string credentials", async () => {
    const client = await getClient();
    const response = await client
      .post("/api/v1/auth/login")
      .send({ username: 123, password: 456 });

    expect(response.status).toBe(400);
  });
});