import { randomUUID } from "node:crypto";
import { isValidObjectId } from "mongoose";
import { Product } from "../models/product.model";
import {
  Order,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  type OrderStatus,
  type PaymentStatus,
} from "../models/order.model";

type OrderItemInput = { productId: string; quantity: number };
type OrderCustomerInput = { name: string; phone: string; address: string };
type OrderInput = { customer: OrderCustomerInput; items: OrderItemInput[] };

function orderError(message: string, statusCode: number): Error & { statusCode: number } {
  return Object.assign(new Error(message), { statusCode });
}

export async function createOrder(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw orderError("Invalid order request body", 400);
  }

  const body = input as Partial<OrderInput>;

  if (
    !body.customer ||
    typeof body.customer !== "object" ||
    !Array.isArray(body.items) ||
    body.items.length < 1 ||
    body.items.length > 50
  ) {
    throw orderError("Customer information and order items are required", 400);
  }

  const { name, phone, address } = body.customer;

  if (
    typeof name !== "string" ||
    name.trim().length < 2 ||
    name.trim().length > 100 ||
    typeof phone !== "string" ||
    !/^[+()\d\s-]{7,30}$/.test(phone.trim()) ||
    typeof address !== "string" ||
    address.trim().length < 8 ||
    address.trim().length > 500
  ) {
    throw orderError("Name, phone, or address is invalid", 400);
  }

  const quantities = new Map<string, number>();

  for (const item of body.items) {
    if (
      !item ||
      typeof item !== "object" ||
      !isValidObjectId(item.productId) ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 20
    ) {
      throw orderError("Product id or quantity is invalid", 400);
    }

    const next = (quantities.get(item.productId) ?? 0) + item.quantity;

    if (next > 20) {
      throw orderError("Maximum quantity per product is 20", 400);
    }

    quantities.set(item.productId, next);
  }

  const ids = [...quantities.keys()];

  const products = await Product.find({
    _id: { $in: ids },
    isActive: true,
    deletedAt: null,
  })
    .select("title price stock")
    .lean();

  if (products.length !== ids.length) {
    throw orderError("One or more products are no longer available", 409);
  }

  const productById = new Map(products.map((product) => [String(product._id), product]));

  const items = ids.map((id) => {
    const product = productById.get(id);
    const quantity = quantities.get(id);

    if (!product || quantity === undefined) {
      throw orderError("One or more products are no longer available", 409);
    }

    if (product.stock < quantity) {
      throw orderError(`Insufficient stock for product "${product.title}"`, 409);
    }

    const lineTotal = product.price * quantity;

    if (!Number.isSafeInteger(lineTotal)) {
      throw orderError("Order amount exceeds the allowed limit", 400);
    }

    return {
      product: product._id,
      title: product.title,
      unitPrice: product.price,
      quantity,
      lineTotal,
    };
  });

  const total = items.reduce((sum, item) => sum + item.lineTotal, 0);

  if (!Number.isSafeInteger(total)) {
    throw orderError("Order amount exceeds the allowed limit", 400);
  }

  const decremented: Array<{ id: string; quantity: number }> = [];

  try {
    for (const id of ids) {
      const quantity = quantities.get(id);
      const product = productById.get(id);

      if (quantity === undefined || !product) {
        throw orderError("One or more products are no longer available", 409);
      }

      const result = await Product.updateOne(
        {
          _id: id,
          isActive: true,
          deletedAt: null,
          price: product.price,
          stock: { $gte: quantity },
        },
        { $inc: { stock: -quantity } },
      );

      if (result.modifiedCount !== 1) {
        throw orderError("One of the products changed; please review the order again", 409);
      }

      decremented.push({ id, quantity });
    }

    return await Order.create({
      orderNumber: randomUUID(),
      customer: {
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
      },
      items,
      total,
      status: "pending",
      paymentStatus: "unpaid",
    });
  } catch (error) {
    if (decremented.length > 0) {
      await Promise.all(
        decremented.map((item) =>
          Product.updateOne({ _id: item.id }, { $inc: { stock: item.quantity } }),
        ),
      );
    }

    throw error;
  }
}

export async function listOrders(page: number, limit: number) {
  const [items, total] = await Promise.all([
    Order.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Order.countDocuments(),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getOrderById(id: string) {
  if (!isValidObjectId(id)) {
    throw orderError("Invalid order id", 400);
  }

  const order = await Order.findById(id).lean();

  if (!order) {
    throw orderError("Order not found", 404);
  }

  return order;
}

export async function updateOrderStatus(
  id: string,
  input: { status?: string; paymentStatus?: string },
) {
  if (!isValidObjectId(id)) {
    throw orderError("Invalid order id", 400);
  }

  const updates: { status?: OrderStatus; paymentStatus?: PaymentStatus } = {};

  if (input.status !== undefined) {
    if (!ORDER_STATUSES.includes(input.status as OrderStatus)) {
      throw orderError("Invalid order status", 400);
    }
    updates.status = input.status as OrderStatus;
  }

  if (input.paymentStatus !== undefined) {
    if (!PAYMENT_STATUSES.includes(input.paymentStatus as PaymentStatus)) {
      throw orderError("Invalid payment status", 400);
    }
    updates.paymentStatus = input.paymentStatus as PaymentStatus;
  }

  if (Object.keys(updates).length === 0) {
    throw orderError("No status update was provided", 400);
  }

  const order = await Order.findByIdAndUpdate(
    id,
    { $set: updates },
    { new: true, runValidators: true },
  ).lean();

  if (!order) {
    throw orderError("Order not found", 404);
  }

  return order;
} 