import { slugify } from "transliteration";
import { Category } from "../models/category.model";

// دریافت دسته‌بندی‌های فعال با امکان صفحه‌بندی
export async function getCategories(page = 1, limit = 20, includeInactive = false) {
  const skip = (page - 1) * limit;
  const filter = includeInactive ? {} : { isActive: true };

  const [items, total] = await Promise.all([
    Category.find(filter)
      .sort({ sortOrder: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    Category.countDocuments(filter),
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

// دریافت یک دسته‌بندی با شناسه MongoDB
export async function getCategoryById(id: string) {
  return Category.findOne({
    _id: id,
    isActive: true,
  }).lean();
}

// ساخت دسته‌بندی جدید
export async function createCategory(data: {
  name: string;
  description?: string;
  sortOrder?: number;
}) {
  const name = data.name.trim();

  const slug = slugify(name, {
    lowercase: true,
    separator: "-",
  });

  const category = await Category.create({
    name,
    slug,
    description: data.description ?? "",
    sortOrder: data.sortOrder ?? 0,
  });

  return category;
}

export async function updateCategory(
  id: string,
  data: {
    name?: string;
    description?: string;
    sortOrder?: number;
  },
) {
  const updateData: {
    name?: string;
    slug?: string;
    description?: string;
    sortOrder?: number;
  } = {};

  if (data.name !== undefined) {
    const name = data.name.trim();

    updateData.name = name;
    updateData.slug = slugify(name, {
      lowercase: true,
      separator: "-",
    });
  }

  if (data.description !== undefined) {
    updateData.description = data.description.trim();
  }

  if (data.sortOrder !== undefined) {
    updateData.sortOrder = data.sortOrder;
  }

  return Category.findOneAndUpdate(
    { _id: id },
    { $set: updateData },
    {
      new: true,
      runValidators: true,
    },
  ).lean();
}

export async function setCategoryActive(id: string, isActive: boolean) {
  return Category.findByIdAndUpdate(id, { $set: { isActive } }, { new: true, runValidators: true }).lean();
}
