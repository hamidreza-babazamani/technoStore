
import type { Request, Response, NextFunction } from "express";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deactivateProduct,
} from "../services/product.service";

function createHttpError(message: string, statusCode: number) {
  return Object.assign(new Error(message), { statusCode });
}

function parsePositiveInteger(
  value: unknown,
  defaultValue: number,
  maxValue: number,
): number {
  if (value === undefined) return defaultValue;

  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    throw createHttpError("پارامتر صفحه‌بندی معتبر نیست", 400);
  }

  const number = Number(value);

  if (
    !Number.isSafeInteger(number) ||
    number < 1 ||
    number > maxValue
  ) {
    throw createHttpError("پارامتر صفحه‌بندی خارج از محدوده است", 400);
  }

  return number;
}

function getProductId(req: Request): string {
  const id = req.params.id;

  if (typeof id !== "string" || !id.trim()) {
    throw createHttpError("شناسه محصول معتبر نیست", 400);
  }

  return id;
}

export async function listProducts(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const page = parsePositiveInteger(req.query.page, 1, 1_000_000);
    const limit = parsePositiveInteger(req.query.limit, 12, 100);

    if (
      req.query.q !== undefined &&
      typeof req.query.q !== "string"
    ) {
      throw createHttpError("عبارت جست‌وجو معتبر نیست", 400);
    }

    if (
      req.query.category !== undefined &&
      typeof req.query.category !== "string"
    ) {
      throw createHttpError("شناسه دسته‌بندی معتبر نیست", 400);
    }

    if (
      req.query.sort !== undefined &&
      typeof req.query.sort !== "string"
    ) {
      throw createHttpError("نوع مرتب‌سازی معتبر نیست", 400);
    }

    const q =
      typeof req.query.q === "string"
        ? req.query.q.trim()
        : undefined;

    const category =
      typeof req.query.category === "string"
        ? req.query.category
        : undefined;

    const sort =
      typeof req.query.sort === "string"
        ? req.query.sort
        : undefined;

    if (
      sort !== undefined &&
      !["newest", "oldest", "price_asc", "price_desc"].includes(sort)
    ) {
      throw createHttpError("نوع مرتب‌سازی معتبر نیست", 400);
    }

    const result = await getProducts({
      page,
      limit,
      q,
      category,
      sort,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getProduct(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const product = await getProductById(getProductId(req));

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
}

export async function postProduct(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const product = await createProduct(req.body);

    res.status(201).json({
      success: true,
      message: "محصول با موفقیت ایجاد شد",
      data: product,
    });
  } catch (error) {
    next(error);
  }
}

export async function patchProduct(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const product = await updateProduct(
      getProductId(req),
      req.body,
    );

    res.status(200).json({
      success: true,
      message: "محصول با موفقیت ویرایش شد",
      data: product,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteProduct(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const product = await deactivateProduct(getProductId(req));

    res.status(200).json({
      success: true,
      message: "محصول غیرفعال شد",
      data: product,
    });
  } catch (error) {
    next(error);
  }
}
