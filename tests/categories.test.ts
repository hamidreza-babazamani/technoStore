import { getClient, adminToken } from "./helpers/app";

describe("Categories API", () => {
  it("requires authentication to create a category", async () => {
    const client = await getClient();
    const response = await client
      .post("/api/v1/categories")
      .send({ name: "Mobile Phones" });

    expect(response.status).toBe(401);
  });

  it("creates a category as admin", async () => {
    const client = await getClient();
    const token = await adminToken();

    const response = await client
      .post("/api/v1/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Mobile Phones", sortOrder: 1 });

    expect(response.status).toBe(201);
    expect(response.body.data.name).toBe("Mobile Phones");
    expect(response.body.data.slug).toBe("mobile-phones");
  });

  it("rejects an invalid category name", async () => {
    const client = await getClient();
    const token = await adminToken();

    const response = await client
      .post("/api/v1/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "A" });

    expect(response.status).toBe(400);
  });

  it("lists only active categories publicly", async () => {
    const client = await getClient();
    const token = await adminToken();

    const created = await client
      .post("/api/v1/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Accessories" });

    const id = created.body.data._id as string;

    await client
      .delete(`/api/v1/categories/${id}`)
      .set("Authorization", `Bearer ${token}`);

    const publicList = await client.get("/api/v1/categories");
    expect(publicList.status).toBe(200);
    expect(publicList.body.data.items).toHaveLength(0);

    const adminList = await client
      .get("/api/v1/categories/admin")
      .set("Authorization", `Bearer ${token}`);
    expect(adminList.status).toBe(200);
    expect(adminList.body.data.items).toHaveLength(1);
  });

  it("rejects the admin list without a token", async () => {
    const client = await getClient();
    const response = await client.get("/api/v1/categories/admin");

    expect(response.status).toBe(401);
  });

  it("rejects an invalid object id", async () => {
    const client = await getClient();
    const response = await client.get("/api/v1/categories/not-an-object-id");

    expect(response.status).toBe(400);
  });

  it("returns 404 for a missing category", async () => {
    const client = await getClient();
    const response = await client.get(
      "/api/v1/categories/000000000000000000000000",
    );

    expect(response.status).toBe(404);
  });
});