import { getClient, adminToken } from "./helpers/app";

async function setupProduct(token: string, stock = 5) {
  const client = await getClient();

  const category = await client
    .post("/api/v1/categories")
    .set("Authorization", `Bearer ${token}`)
    .send({ name: "Mobile" });

  const categoryId = category.body.data._id as string;

  const product = await client
    .post("/api/v1/products")
    .set("Authorization", `Bearer ${token}`)
    .send({
      title: "Phone",
      description: "A phone",
      price: 100,
      category: categoryId,
      stock,
    });

  return product.body.data._id as string;
}

const CUSTOMER = {
  name: "Jane Doe",
  phone: "+14155551234",
  address: "123 Main Street, Springfield",
};

describe("Orders API", () => {
  it("places an order and decrements stock", async () => {
    const client = await getClient();
    const token = await adminToken();
    const productId = await setupProduct(token, 5);

    const response = await client
      .post("/api/v1/orders")
      .send({
        customer: CUSTOMER,
        items: [{ productId, quantity: 2 }],
      });

    expect(response.status).toBe(201);
    expect(response.body.data.orderNumber).toBeDefined();
    expect(response.body.data.status).toBe("pending");
    expect(response.body.data.paymentStatus).toBe("unpaid");
    expect(response.body.data.total).toBe(200);

    const product = await client.get(`/api/v1/products/${productId}`);
    expect(product.body.data.stock).toBe(3);
  });

  it("rejects an order when stock is insufficient", async () => {
    const client = await getClient();
    const token = await adminToken();
    const productId = await setupProduct(token, 1);

    const response = await client
      .post("/api/v1/orders")
      .send({
        customer: CUSTOMER,
        items: [{ productId, quantity: 2 }],
      });

    expect(response.status).toBe(409);

    const product = await client.get(`/api/v1/products/${productId}`);
    expect(product.body.data.stock).toBe(1);
  });

  it("restores stock when the order fails", async () => {
    const client = await getClient();
    const token = await adminToken();
    const productId = await setupProduct(token, 1);

    const response = await client
      .post("/api/v1/orders")
      .send({
        customer: { ...CUSTOMER, name: "X" },
        items: [{ productId, quantity: 1 }],
      });

    expect(response.status).toBe(400);

    const product = await client.get(`/api/v1/products/${productId}`);
    expect(product.body.data.stock).toBe(1);
  });

  it("rejects an invalid customer", async () => {
    const client = await getClient();
    const token = await adminToken();
    const productId = await setupProduct(token);

    const response = await client
      .post("/api/v1/orders")
      .send({
        customer: { name: "X", phone: "1", address: "short" },
        items: [{ productId, quantity: 1 }],
      });

    expect(response.status).toBe(400);
  });

  it("requires admin to list orders", async () => {
    const client = await getClient();
    const response = await client.get("/api/v1/orders");

    expect(response.status).toBe(401);
  });

  it("lists orders for admin", async () => {
    const client = await getClient();
    const token = await adminToken();
    const productId = await setupProduct(token);

    await client
      .post("/api/v1/orders")
      .send({ customer: CUSTOMER, items: [{ productId, quantity: 1 }] });

    const response = await client
      .get("/api/v1/orders")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.items).toHaveLength(1);
  });

  it("updates order status", async () => {
    const client = await getClient();
    const token = await adminToken();
    const productId = await setupProduct(token);

    const created = await client
      .post("/api/v1/orders")
      .send({ customer: CUSTOMER, items: [{ productId, quantity: 1 }] });

    const orderId = created.body.data._id as string;

    const response = await client
      .patch(`/api/v1/orders/${orderId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "confirmed", paymentStatus: "paid" });

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe("confirmed");
    expect(response.body.data.paymentStatus).toBe("paid");
  });

  it("rejects an invalid order status", async () => {
    const client = await getClient();
    const token = await adminToken();
    const productId = await setupProduct(token);

    const created = await client
      .post("/api/v1/orders")
      .send({ customer: CUSTOMER, items: [{ productId, quantity: 1 }] });

    const orderId = created.body.data._id as string;

    const response = await client
      .patch(`/api/v1/orders/${orderId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "not-a-real-status" });

    expect(response.status).toBe(400);
  });

  it("rejects concurrent orders that exceed stock", async () => {
    const client = await getClient();
    const token = await adminToken();
    const productId = await setupProduct(token, 1);

    const [first, second] = await Promise.all([
      client.post("/api/v1/orders").send({
        customer: CUSTOMER,
        items: [{ productId, quantity: 1 }],
      }),
      client.post("/api/v1/orders").send({
        customer: CUSTOMER,
        items: [{ productId, quantity: 1 }],
      }),
    ]);

    const statuses = [first.status, second.status].sort();
    expect(statuses).toEqual([201, 409]);

    const product = await client.get(`/api/v1/products/${productId}`);
    expect(product.body.data.stock).toBe(0);
  });
});