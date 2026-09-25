import slugify from "slugify";
import blog from "./blog.model";

class BlogController {
  createBlog = async (req) => {
    try {
      const data = req.body;
      const files = req.files;
      if (data.title) {
        data.slug = slugify(data.title);
      }

      const newProduct = await blog.create(data);
      return newProduct;
    } catch (exception) {
      throw exception;
    }
  };

  addReview = async (productSlug, userId, reviewData) => {
    try {
      const product = await this.productDetailBySlug(productSlug);
      if (!product) {
        throw new Error("Product not found");
      }

      // const existingReview = product.reviews.find(
      //     r => r.user.toString() === userId.toString()
      // );
      // if (existingReview) {
      //     throw ({message: "You have already reviewed this product"});
      // }

      console.log(reviewData);
      const rating = reviewData.rating;
      console.log("Rating:", rating);
      if (!rating) {
        throw new Error("Rating must be a number between 1 and 5");
      }
      // const user = await UserModel.findById(userId);
      // if (!user) {
      //     throw new Error('User not found');
      // }
      // const username = user.name || "Anonymous";
      const review = {
        user: userId,
        rating,
        comment: reviewData.comment || "",
      };

      product.reviews.push(review);

      // Safe averageRating calculation
      const totalRating = product.reviews.reduce((sum, r) => sum + r.rating, 0);
      product.averageRating =
        product.reviews.length > 0 ? totalRating / product.reviews.length : 0;
      product.reviewCount = product.reviews.length;

      await product.save();
      return product;
    } catch (exception) {
      throw exception;
    }
  };

  updateReview = async (productslug, reviewId, userId, reviewData) => {
    try {
      const product = await this.productDetailBySlug(productslug);
      if (!product) {
        throw new Error("Product not found");
      }

      const review = product.reviews.id(reviewId);
      if (!review) {
        throw new Error("Review not found");
      }

      review.rating = reviewData.rating;
      review.comment = reviewData.comment;

      const totalRating = product.reviews.reduce(
        (sum, review) => sum + review.rating,
        0,
      );
      product.averageRating = totalRating / product.reviews.length;

      await product.save();
      return product;
    } catch (error) {
      throw error;
    }
  };

  deleteReview = async (slug, reviewId, userId) => {
    try {
      const product = await this.productDetailBySlug(slug);
      if (!product) {
        throw new Error("Product not found");
      }

      const review = product.reviews.id(reviewId);
      if (!review) {
        throw new Error("Review not found");
      }

      product.reviews = product.reviews.filter(
        (r) => r._id.toString() !== reviewId,
      );

      const totalRating = product.reviews.reduce(
        (sum, review) => sum + review.rating,
        0,
      );
      product.averageRating =
        product.reviews.length > 0 ? totalRating / product.reviews.length : 0;
      product.reviewCount = product.reviews.length;

      await product.save();
      return product;
    } catch (error) {
      throw error;
    }
  };

  productDetailById = async (id) => {
    try {
      const product = await ProductModel.findById(id)
        .populate({
          path: "createdBy",
          select: "_id name email role store",
          populate: {
            path: "store",
            select: "name address panNumber",
          },
        })
        .populate("category", ["_id", "title"])
        .populate("brand", ["_id", "title"]);
      return product;
    } catch (exception) {
      throw exception;
    }
  };
  productDetailBySlug = async (slug) => {
    try {
      const product = await ProductModel.findOne(slug)
        .populate({
          path: "createdBy",
          select: "_id name email role store",
          populate: {
            path: "store",
            select: "name address panNumber",
          },
        })
        .populate("category", ["_id", "title"])
        .populate("brand", ["_id", "title"])
        .populate("reviews.user", "_id name email");
      if (!product) {
        throw { message: "Product not found" };
      }
      return product;
    } catch (exception) {
      throw exception;
    }
  };
  listData = async ({ skip = 0, limit = 10, filter = {} }) => {
    try {
      const count = await ProductModel.countDocuments(filter);
      const data = await ProductModel.find(filter)
        .populate({
          path: "createdBy",
          select: "_id name email role store",
          populate: {
            path: "store",
            select: "name address panNumber",
          },
        })
        .sort({ _id: "desc" })
        .limit(limit)
        .skip(skip);

      return { count, data };
    } catch (exception) {
      throw exception;
    }
  };
  AllProductsFiltering = async (query) => {
    try {
      const queryObj = { ...query };
      const excludeFields = ["page", "sort", "limit", "fields"];
      excludeFields.forEach((el) => delete queryObj[el]);
      let queryStr = JSON.stringify(queryObj);
      queryStr = queryStr.replace(
        /\b(gte|gt|lte|lt)\b/g,
        (match) => `$${match}`,
      );
      let allProducts = ProductModel.find(JSON.parse(queryStr));

      // fields
      if (query.fields) {
        const fields = query.fields.split(",").join(" ");
        allProducts = allProducts.select(fields);
      }

      //Pagination
      const page = query.page;
      const limit = query.limit;
      const skip = (page - 1) * limit;

      if (query.page) {
        allProducts = allProducts.skip(skip).limit(limit);
        const ProductCount = await ProductModel.countDocuments();
        if (skip >= ProductCount) {
          throw { message: "This page doesnot exist" };
        }
      }
      return allProducts;
    } catch (exception) {
      throw exception;
    }
  };

  ProductUpdateById = async (id, data) => {
    try {
      if (data.title) {
        data.slug = slugify(data.title);
      }
      const productUpdate = await ProductModel.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true },
      );
      return productUpdate;
    } catch (exception) {
      throw exception;
    }
  };

  ProductDeleteById = async (id) => {
    try {
      const productDelete = await ProductModel.findByIdAndDelete(id);
      return productDelete;
    } catch (exception) {
      throw exception;
    }
  };
}

const productSvc = new ProductService();
module.exports = productSvc;
