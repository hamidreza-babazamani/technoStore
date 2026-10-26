import { isValidObjectId, type SortOrder } from "mongoose";
import { slugify } from "transliteration";
import { Product, type ProductDocument } from "../models/product.model";
import { Category } from "../models/category.model";

type ProductMediaInput = {
  url: string;
  type: "image" | "video";
  alt?: string;
  sortOrder?: number;
};

type CreateProductInput = {
  title: string;
  description: string;
  price: number;
  category: string;
  stock?: number;
  media?: ProductMediaInput[];
  isFeatured?: boolean;
};

type UpdateProductInput = Partial<CreateProductInput>;

type ProductFilter = {
  isActive: boolean;
  deletedAt: null;
  category?: string;
  $text?: { $search: string };
};

function createError(message: string, statusCode: number): Error & { statusCode: number } {
  return Object.assign(new Error(message), { statusCode });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateProductData(data: Record<string, unknown>): void {
  if (
    data.title !== undefined &&
    (typeof data.title !== "string" ||
      data.title.trim().length < 2 ||
      data.title.trim().length > 200)
  ) {
    throw createError("Product title must be between 2 and 200 characters", 400);
  }

  if (
    data.description !== undefined &&
    (typeof data.description !== "string" || data.description.trim().length > 10000)
  ) {
    throw createError("Product description is invalid", 400);
  }

  if (
    data.price !== undefined &&
    (typeof data.price !== "number" || !Number.isSafeInteger(data.price) || data.price < 0)
  ) {
    throw createError("Price must be a non-negative safe integer", 400);
  }

  if (
    data.stock !== undefined &&
    (typeof data.stock !== "number" || !Number.isInteger(data.stock) || data.stock < 0)
  ) {
    throw createError("Stock must be a non-negative integer", 400);
  }

  if (data.isFeatured !== undefined && typeof data.isFeatured !== "boolean") {
    throw createError("isFeatured must be a boolean", 400);
  }

  if (data.media !== undefined) {
    if (!Array.isArray(data.media) || data.media.length > 20) {
      throw createError("Media list is invalid", 400);
    }

    for (const item of data.media) {
      if (
        !isRecord(item) ||
        typeof item.url !== "string" ||
        item.url.trim().length === 0 ||
        item.url.length > 2048 ||
        !["image", "video"].includes(String(item.type))
      ) {
        throw createError("Invalid media item", 400);
      }

      if (item.alt !== undefined && (typeof item.alt !== "string" || item.alt.length > 200)) {
        throw createError("Invalid media alt text", 400);
      }

      if (
        item.sortOrder !== undefined &&
        (typeof item.sortOrder !== "number" ||
          !Number.isInteger(item.sortOrder) ||
          item.sortOrder < 0)
      ) {
        throw createError("Invalid media sort order", 400);
      }

      const allowedKeys = ["url", "type", "alt", "sortOrder"];

      if (Object.keys(item).some((key) => !allowedKeys.includes(key))) {
        throw createError("Media contains an unsupported field", 400);
      }
    }
  }
}

async function generateUniqueSlug(title: string, excludeId?: string): Promise<string> {
  const baseSlug =
    slugify(title.trim(), { lowercase: true, separator: "-" }).slice(0, 200) || "product";

  let slug = baseSlug;
  let counter = 1;

  while (
    await Product.exists({
      slug,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    })
  ) {
    counter += 1;
    slug = `${baseSlug}-${counter}`;
  }

  return slug;
}

async function validateCategory(categoryId: string): Promise<void> {
  if (!isValidObjectId(categoryId)) {
    throw createError("Invalid category id", 400);
  }

  const category = await Category.findOne({ _id: categoryId, isActive: true })
    .select("_id")
    .lean();

  if (!category) {
    throw createError("Category not found or inactive", 400);
  }
}

export async function getProducts(options: {
  page: number;
  limit: number;
  q?: string;
  category?: string;
  sort?: string;
}) {
  const { page, limit, q, category, sort } = options;

  const filter: ProductFilter = { isActive: true, deletedAt: null };

  if (category) {
    if (!isValidObjectId(category)) {
      throw createError("Invalid category id", 400);
    }

    filter.category = category;
  }

  if (q?.trim()) {
    filter.$text = { $search: q.trim() };
  }

  const sortOptions: Record<string, SortOrder> =
    sort === "price_asc"
      ? { price: 1 }
      : sort === "price_desc"
        ? { price: -1 }
        : sort === "oldest"
          ? { createdAt: 1 }
          : { createdAt: -1 };

  const [items, total] = await Promise.all([
    Product.find(filter)
      .select("-__v")
      .populate("category", "name slug")
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),

    Product.countDocuments(filter),
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

export async function getProductById(id: string) {
  if (!isValidObjectId(id)) {
    throw createError("Invalid product id", 400);
  }

  const product = await Product.findOne({ _id: id, isActive: true, deletedAt: null })
    .select("-__v")
    .populate("category", "name slug")
    .lean();

  if (!product) {
    throw createError("Product not found", 404);
  }

  return product;
}

export async function createProduct(data: CreateProductInput) {
  if (!isRecord(data)) {
    throw createError("Invalid request body", 400);
  }

  validateProductData(data);

  if (
    typeof data.title !== "string" ||
    typeof data.description !== "string" ||
    typeof data.price !== "number" ||
    typeof data.category !== "string"
  ) {
    throw createError("Required product fields are missing", 400);
  }

  await validateCategory(data.category);

  const slug = await generateUniqueSlug(data.title);

  try {
    return await Product.create({
      title: data.title.trim(),
      slug,
      description: data.description.trim(),
      price: data.price,
      category: data.category,
      stock: data.stock ?? 0,
      media: data.media ?? [],
      isActive: true,
      isFeatured: data.isFeatured ?? false,
      deletedAt: null,
    });
  } catch (error: unknown) {
    if (isRecord(error) && error.code === 11000) {
      throw createError("Product slug already exists", 409);
    }

    throw error;
  }
}

export async function updateProduct(id: string, data: UpdateProductInput) {
  if (!isValidObjectId(id)) {
    throw createError("Invalid product id", 400);
  }

  if (!isRecord(data)) {
    throw createError("Invalid request body", 400);
  }

  const allowedFields = [
    "title",
    "description",
    "price",
    "category",
    "stock",
    "media",
    "isFeatured",
  ];

  for (const key of Object.keys(data)) {
    if (!allowedFields.includes(key)) {
      throw createError(`Unsupported field: ${key}`, 400);
    }
  }

  if (Object.keys(data).length === 0) {
    throw createError("At least one field must be provided for update", 400);
  }

  validateProductData(data as Record<string, unknown>);

  const product = await Product.findOne({ _id: id, isActive: true, deletedAt: null });

  if (!product) {
    throw createError("Product not found or inactive", 404);
  }

  if (data.category !== undefined) {
    if (typeof data.category !== "string") {
      throw createError("Invalid category id", 400);
    }

    const current = product.get("category") as ProductDocument["category"];
    const categoryChanged = String(current) !== data.category;

    if (categoryChanged) {
      await validateCategory(data.category);
    }
  }

  if (data.title !== undefined) {
    if (typeof data.title !== "string") {
      throw createError("Invalid product title", 400);
    }

    product.set("title", data.title.trim());
    product.set("slug", await generateUniqueSlug(data.title, id));
  }

  if (data.description !== undefined) {
    product.set("description", data.description.trim());
  }

  if (data.price !== undefined) {
    product.set("price", data.price);
  }

  if (data.category !== undefined) {
    product.set("category", data.category);
  }

  if (data.stock !== undefined) {
    product.set("stock", data.stock);
  }

  if (data.media !== undefined) {
    product.set("media", data.media);
  }

  if (data.isFeatured !== undefined) {
    product.set("isFeatured", data.isFeatured);
  }

  try {
    await product.save();
    await product.populate("category", "name slug");
    return product;
  } catch (error: unknown) {
    if (isRecord(error) && error.code === 11000) {
      throw createError("Product slug already exists", 409);
    }

    throw error;
  }
}

export async function deactivateProduct(id: string) {
  if (!isValidObjectId(id)) {
    throw createError("Invalid product id", 400);
  }

  const product = await Product.findOne({ _id: id, isActive: true, deletedAt: null });

  if (!product) {
    throw createError("Product not found or already inactive", 404);
  }

  product.set("isActive", false);
  await product.save();

  return product;
}