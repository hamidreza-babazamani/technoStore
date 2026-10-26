import { getClient } from "./helpers/app";

describe("GET /api/v1/health", () => {
  it("returns 200 with database connected", async () => {
    const client = await getClient();
    const response = await client.get("/api/v1/health");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      database: {
        connected: true,
        status: "connected",
      },
    });
    expect(response.body.version).toBeDefined();
    expect(response.body.timestamp).toBeDefined();
  });
});