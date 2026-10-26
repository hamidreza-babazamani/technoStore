import type { Request, Response, NextFunction } from "express";
import {
  createOrder,
  listOrders,
  getOrderById,
  updateOrderStatus,
} from "../services/order.service";

export async function postOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const order = await createOrder(req.body);
    res.status(201).json({ success: true, message: "Order placed", data: order });
  } catch (error) {
    next(error);
  }
}

export async function listAllOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Math.max(1, Number.parseInt(String(req.query.page ?? "1"), 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(String(req.query.limit ?? "20"), 10) || 20),
    );

    const result = await listOrders(page, limit);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id;

    if (typeof id !== "string") {
      throw Object.assign(new Error("Invalid order id"), { statusCode: 400 });
    }

    const order = await getOrderById(id);
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
}

export async function patchOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id;

    if (typeof id !== "string") {
      throw Object.assign(new Error("Invalid order id"), { statusCode: 400 });
    }

    const { status, paymentStatus } = req.body as {
      status?: string;
      paymentStatus?: string;
    };

    const order = await updateOrderStatus(id, { status, paymentStatus });
    res.status(200).json({ success: true, message: "Order updated", data: order });
  } catch (error) {
    next(error);
  }
}