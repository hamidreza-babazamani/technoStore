import { Schema, model, models, type Model } from "mongoose";

export interface ProductMedia {
  url: string;
  type: "image" | "video";
  alt?: string;
  sortOrder?: number;
}

export interface ProductDocument {
  title: string;
  slug: string;
  description: string;
  price: number;
  category: import("mongoose").Types.ObjectId;
  stock: number;
  media: ProductMedia[];
  isActive: boolean;
  isFeatured: boolean;
  deletedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const productMediaSchema = new Schema<ProductMedia>(
  {
    url: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2048,
    },
    type: {
      type: String,
      enum: ["image", "video"],
      required: true,
    },
    alt: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },
    sortOrder: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  { _id: false },
);

const productSchema = new Schema<ProductDocument>(
  {
    title: {
      type: String,
      required: [true, "Product title is required"],
      trim: true,
      minlength: 2,
      maxlength: 200,
    },
    slug: {
      type: String,
      required: [true, "Product slug is required"],
      trim: true,
      lowercase: true,
      maxlength: 220,
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
      trim: true,
      maxlength: 10000,
    },
    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: 0,
      validate: {
        validator: Number.isSafeInteger,
        message: "Price must be a safe integer",
      },
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Product category is required"],
      index: true,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: "Stock must be an integer",
      },
    },
    media: {
      type: [productMediaSchema],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

productSchema.index({ slug: 1 }, { unique: true });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ isActive: 1, createdAt: -1 });
productSchema.index({ title: "text", description: "text" });

export const Product: Model<ProductDocument> =
  (models.Product as Model<ProductDocument> | undefined) ??
  model<ProductDocument>("Product", productSchema);