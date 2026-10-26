import type { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import * as categoryService from "../services/category.service";

const NAME_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N}\s'’&-]*$/u;

function nameIsValid(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length >= 2 && trimmed.length <= 80 && NAME_PATTERN.test(trimmed);
}

function parsePagination(req: Request): { page: number; limit: number } | null {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);

  if (
    !Number.isInteger(page) ||
    !Number.isInteger(limit) ||
    page < 1 ||
    limit < 1 ||
    limit > 100
  ) {
    return null;
  }

  return { page, limit };
}

export async function listCategories(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const pagination = parsePagination(req);

    if (!pagination) {
      res.status(400).json({ success: false, message: "Invalid pagination parameters" });
      return;
    }

    const result = await categoryService.getCategories(pagination.page, pagination.limit, false);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function listCategoriesAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const pagination = parsePagination(req);

    if (!pagination) {
      res.status(400).json({ success: false, message: "Invalid pagination parameters" });
      return;
    }

    const result = await categoryService.getCategories(pagination.page, pagination.limit, true);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getCategory(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = req.params.id;

    if (typeof id !== "string" || !mongoose.isValidObjectId(id)) {
      res.status(400).json({ success: false, message: "Invalid category id" });
      return;
    }

    const category = await categoryService.getCategoryById(id);

    if (!category) {
      res.status(404).json({ success: false, message: "Category not found" });
      return;
    }

    res.status(200).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
}

export async function createCategory(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { name, description, sortOrder } = req.body as {
      name?: unknown;
      description?: unknown;
      sortOrder?: unknown;
    };

    if (typeof name !== "string" || !nameIsValid(name)) {
      res.status(400).json({
        success: false,
        message: "Category name must be 2 to 80 characters long and start with a letter or digit",
      });
      return;
    }

    if (description !== undefined && (typeof description !== "string" || description.length > 500)) {
      res.status(400).json({
        success: false,
        message: "Description must be a string of at most 500 characters",
      });
      return;
    }

    if (sortOrder !== undefined && (!Number.isInteger(sortOrder) || (sortOrder as number) < 0)) {
      res.status(400).json({
        success: false,
        message: "Sort order must be a non-negative integer",
      });
      return;
    }

    const category = await categoryService.createCategory({
      name: name.trim(),
      description: typeof description === "string" ? description : undefined,
      sortOrder: typeof sortOrder === "number" ? sortOrder : undefined,
    });

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateCategory(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = req.params.id;

    if (typeof id !== "string" || !mongoose.isValidObjectId(id)) {
      res.status(400).json({ success: false, message: "Invalid category id" });
      return;
    }

    const { name, description, sortOrder } = req.body as {
      name?: unknown;
      description?: unknown;
      sortOrder?: unknown;
    };

    if (name === undefined && description === undefined && sortOrder === undefined) {
      res.status(400).json({ success: false, message: "At least one field must be provided" });
      return;
    }

    if (name !== undefined && (typeof name !== "string" || !nameIsValid(name))) {
      res.status(400).json({
        success: false,
        message: "Category name must be 2 to 80 characters long and start with a letter or digit",
      });
      return;
    }

    if (description !== undefined && (typeof description !== "string" || description.length > 500)) {
      res.status(400).json({
        success: false,
        message: "Description must be a string of at most 500 characters",
      });
      return;
    }

    if (sortOrder !== undefined && (!Number.isInteger(sortOrder) || (sortOrder as number) < 0)) {
      res.status(400).json({
        success: false,
        message: "Sort order must be a non-negative integer",
      });
      return;
    }

    const category = await categoryService.updateCategory(id, {
      ...(typeof name === "string" && { name }),
      ...(typeof description === "string" && { description }),
      ...(typeof sortOrder === "number" && { sortOrder }),
    });

    if (!category) {
      res.status(404).json({ success: false, message: "Category not found" });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  } catch (error) {
    next(error);
  }
}

export async function deactivateCategory(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = req.params.id;

    if (typeof id !== "string" || !mongoose.isValidObjectId(id)) {
      res.status(400).json({ success: false, message: "Invalid category id" });
      return;
    }

    const category = await categoryService.setCategoryActive(id, false);

    if (!category) {
      res.status(404).json({ success: false, message: "Category not found" });
      return;
    }

    res.status(200).json({ success: true, message: "Category deactivated", data: category });
  } catch (error) {
    next(error);
  }
}

export async function activateCategory(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = req.params.id;

    if (typeof id !== "string" || !mongoose.isValidObjectId(id)) {
      res.status(400).json({ success: false, message: "Invalid category id" });
      return;
    }

    const category = await categoryService.setCategoryActive(id, true);

    if (!category) {
      res.status(404).json({ success: false, message: "Category not found" });
      return;
    }

    res.status(200).json({ success: true, message: "Category activated", data: category });
  } catch (error) {
    next(error);
  }
}