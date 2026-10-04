import category from "./category.model";
import { Request, Response, NextFunction } from "express";
import slugify from "slugify";

interface ICategory {
  title: string;
}

interface AppError extends Error {
  status?: number;
}

/**
 * Creates an application error with an HTTP status code for Express error handling.
 *
 * @param {string} message - Description of the error.
 * @param {number} [status=500] - HTTP status code to attach to the error.
 * @returns {AppError} An error instance carrying the specified status.
 */
const createError = (message: string, status = 500): AppError => {
  const err = new Error(message) as AppError;
  err.status = status;
  return err;
};

/**
 * Creates a category and generates its slug from the supplied title.
 *
 * @param {Request} req - Request containing the new category fields in its body.
 * @param {Response} res - Express response used to return the created category.
 * @param {NextFunction} next - Express error handler for creation failures.
 * @returns {Promise<void>} Resolves after sending the response or forwarding an error.
 *
 * @example
 * POST /api/category/create
 * Authorization: Bearer <access-token>
 * Content-Type: application/json
 * { "title": "Technology" }
 */

const createCategory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
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

/**
 * Retrieves all categories, ordered from newest to oldest.
 *
 * @param {Request} req - Express request; no query parameters are used.
 * @param {Response} res - Express response used to return the category list.
 * @param {NextFunction} next - Express error handler for retrieval failures.
 * @returns {Promise<void>} Resolves after sending the category list or forwarding an error.
 *
 */

const ListAllCategories = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await category.find().sort({ _id: "desc" });
    console.log(data);

    res.json({
      result: data,
      message: "category list all",
      meta: null,
    });
  } catch (exception) {
    next(exception);
  }
};

/**
 * Retrieves a category by its database ID.
 *
 * @param {Request} req - Request containing the category ID in `params.id`.
 * @param {Response} res - Express response used to return the category.
 * @param {NextFunction} next - Express error handler for lookup failures.
 * @returns {Promise<void>} Resolves after sending the category or forwarding an error.
 *
 * @example
 * GET /api/category/65a1f23b4c5d6e7f89012345
 */
const CategoryDetailById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
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

/**
 * Updates a category by ID and regenerates its slug when the title changes.
 *
 * @param {Request} req - Request containing the category ID in `params.id` and fields to update in its body.
 * @param {Response} res - Express response used to return the updated category.
 * @param {NextFunction} next - Express error handler for lookup or update failures.
 * @returns {Promise<void>} Resolves after sending the updated category or forwarding an error.
 *
 * @example
 * PUT /api/category/65a1f23b4c5d6e7f89012345
 * Authorization: Bearer <access-token>
 * Content-Type: application/json
 * { "title": "Technology" }
 */
const CategoryUpdateById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data: ICategory = req.body;

    if (data.title) {
      (data as any).slug = slugify(data.title);
    }
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

/**
 * Deletes a category by its database ID.
 *
 * @param {Request} req - Request containing the category ID in `params.id`.
 * @param {Response} res - Express response used to return the deleted category.
 * @param {NextFunction} next - Express error handler for lookup or deletion failures.
 * @returns {Promise<void>} Resolves after sending the deleted category or forwarding an error.
 *
 * @example
 * DELETE /api/category/65a1f23b4c5d6e7f89012345
 * Authorization: Bearer <access-token>
 */
const CategoryDeleteById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
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
