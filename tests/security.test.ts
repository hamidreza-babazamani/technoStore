import { getClient } from "./helpers/app";

describe("Security", () => {
  it("rejects a request body larger than 1mb", async () => {
    const client = getClient();
    const big = "a".repeat(2 * 1024 * 1024);

    const response = await client
      .post("/api/v1/auth/login")
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ username: "admin", password: big }));

    expect(response.status).toBe(413);
  });

  it("returns 404 for unknown routes", async () => {
    const client = getClient();
    const response = await client.get("/api/v1/does-not-exist");

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });

  it("does not leak the x-powered-by header", async () => {
    const client = getClient();
    const response = await client.get("/api/v1/health");

    expect(response.headers["x-powered-by"]).toBeUndefined();
    expect(String(response.headers["x-content-type-options"])).toBe("nosniff");
  });

  it("sets helmet security headers", async () => {
    const client = getClient();
    const response = await client.get("/api/v1/health");

    expect(response.headers["x-frame-options"]).toBe("SAMEORIGIN");
    expect(response.headers["strict-transport-security"]).toBeDefined();
  });
});