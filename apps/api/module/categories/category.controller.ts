import category from './category.model'
import { Request, Response, NextFunction } from "express"
import slugify from 'slugify'

interface ICategory {
  title: string;
}

interface AppError extends Error {
  status?: number;
}

const createError = (message: string, status = 500): AppError => {
  const err = new Error(message) as AppError;
  err.status = status;
  return err;
};

const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;

    if (data.title) {
      data.slug = slugify(data.title);
    }

    const newCategory = await category.create(data);

    res.json({
      result: newCategory,
      message: "Category Added",
      meta: null,
    });
  } catch (exception) {
    next(exception);
  }
};

const ListAllCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await category.find().sort({ _id: "desc" });

    res.json({
      result: data,
      message: "category list all",
      meta: null,
    });
  } catch (exception) {
    next(exception);
  }
};

const CategoryDetailById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const Category = await category.findById(req.params.id);

    if (!Category) {
      throw createError("Category not found", 404);
    }

    res.json({
      result: Category,
      message: "Category detail fetched",
      meta: null,
    });
  } catch (exception) {
    next(exception);
  }
};

const CategoryUpdateById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data: ICategory = req.body;

    if (data.title) {
      (data as any).slug = slugify(data.title);
    }
    console.log(data.title)
    const CategoryUpdate = await category.findByIdAndUpdate(
      req.params.id,
      { $set: data },
      { new: true },
    );

    if (!CategoryUpdate) {
      throw createError("Category not found", 404);
    }

    res.json({
      result: CategoryUpdate,
      message: "Category updated",
      meta: null,
    });
  } catch (exception) {
    next(exception);
  }
};

const CategoryDeleteById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const CategoryDelete = await category.findByIdAndDelete(req.params.id);

    if (!CategoryDelete) {
      throw createError("Category not found", 404);
    }

    res.json({
      result: CategoryDelete,
      message: "Category deleted",
      meta: null,
    });
  } catch (exception) {
    next(exception);
  }
};

export {
  createCategory,
  ListAllCategories,
  CategoryDetailById,
  CategoryUpdateById,
  CategoryDeleteById,
};