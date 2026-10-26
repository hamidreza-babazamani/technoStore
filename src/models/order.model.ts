import { Schema, model, models, type Model, type Types } from "mongoose";

export interface OrderItemDocument {
  product: Types.ObjectId;
  title: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderCustomerDocument {
  name: string;
  phone: string;
  address: string;
}

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export const PAYMENT_STATUSES = ["unpaid", "paid", "failed", "refunded"] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export interface OrderDocument {
  orderNumber: string;
  customer: OrderCustomerDocument;
  items: OrderItemDocument[];
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

const orderItemSchema = new Schema<OrderItemDocument>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: "Quantity must be an integer",
      },
    },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const orderSchema = new Schema<OrderDocument>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    customer: {
      name: { type: String, required: true, trim: true, maxlength: 100 },
      phone: { type: String, required: true, trim: true, maxlength: 30 },
      address: { type: String, required: true, trim: true, maxlength: 500 },
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items: OrderItemDocument[]) => items.length > 0,
        message: "Order must contain at least one item",
      },
    },
    total: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ORDER_STATUSES, default: "pending" },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: "unpaid" },
  },
  { timestamps: true, versionKey: false },
);

orderSchema.index({ createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

export const Order: Model<OrderDocument> =
  (models.Order as Model<OrderDocument> | undefined) ??
  model<OrderDocument>("Order", orderSchema);