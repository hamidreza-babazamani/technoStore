import { getClient, adminToken } from "./helpers/app";

async function createCategory(token: string, name = "Electronics") {
  const client = await getClient();
  const response = await client
    .post("/api/v1/categories")
    .set("Authorization", `Bearer ${token}`)
    .send({ name });

  expect(response.status).toBe(201);
  return response.body.data._id as string;
}

describe("Products API", () => {
  it("creates a product as admin", async () => {
    const client = await getClient();
    const token = await adminToken();
    const categoryId = await createCategory(token);

    const response = await client
      .post("/api/v1/products")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Phone X",
        description: "A great phone",
        price: 1000,
        category: categoryId,
        stock: 5,
      });

    expect(response.status).toBe(201);
    expect(response.body.data.title).toBe("Phone X");
    expect(response.body.data.slug).toBe("phone-x");
    expect(response.body.data.price).toBe(1000);
  });

  it("requires authentication to create a product", async () => {
    const client = await getClient();
    const response = await client
      .post("/api/v1/products")
      .send({ title: "Phone", description: "x", price: 1, category: "x" });

    expect(response.status).toBe(401);
  });

  it("rejects a missing category", async () => {
    const client = await getClient();
    const token = await adminToken();

    const response = await client
      .post("/api/v1/products")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Phone",
        description: "x",
        price: 1,
        category: "000000000000000000000000",
      });

    expect(response.status).toBe(400);
  });

  it("rejects an inactive category", async () => {
    const client = await getClient();
    const token = await adminToken();
    const categoryId = await createCategory(token, "To Deactivate");

    await client
      .delete(`/api/v1/categories/${categoryId}`)
      .set("Authorization", `Bearer ${token}`);

    const response = await client
      .post("/api/v1/products")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Phone",
        description: "x",
        price: 1,
        category: categoryId,
      });

    expect(response.status).toBe(400);
  });

  it("rejects unknown fields in update", async () => {
    const client = await getClient();
    const token = await adminToken();
    const categoryId = await createCategory(token);

    const created = await client
      .post("/api/v1/products")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Phone",
        description: "x",
        price: 1,
        category: categoryId,
      });

    const productId = created.body.data._id as string;

    const response = await client
      .patch(`/api/v1/products/${productId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ unknownField: true });

    expect(response.status).toBe(400);
  });

  it("filters products by category", async () => {
    const client = await getClient();
    const token = await adminToken();
    const categoryId = await createCategory(token);

    await client
      .post("/api/v1/products")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Phone",
        description: "x",
        price: 1,
        category: categoryId,
      });

    const response = await client.get(`/api/v1/products?category=${categoryId}`);

    expect(response.status).toBe(200);
    expect(response.body.data.items).toHaveLength(1);
  });

  it("soft-deletes a product so it no longer appears publicly", async () => {
    const client = await getClient();
    const token = await adminToken();
    const categoryId = await createCategory(token);

    const created = await client
      .post("/api/v1/products")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Phone",
        description: "x",
        price: 1,
        category: categoryId,
      });

    const productId = created.body.data._id as string;

    const deleted = await client
      .delete(`/api/v1/products/${productId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(deleted.status).toBe(200);

    const list = await client.get("/api/v1/products");
    expect(list.body.data.items).toHaveLength(0);

    const single = await client.get(`/api/v1/products/${productId}`);
    expect(single.status).toBe(404);
  });
});