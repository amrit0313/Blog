import joi from "joi";

const CreateBlogValidation = joi.object({
  title: joi.string().min(3).max(100).required(),
  description: joi.string().required(),
  author: joi.string().required(),
  category: joi.string().required(),
  status: joi.string().valid("draft", "published", "unpublished", "submitted", "rejected").required(),
  image: joi.string().optional(),
  tags: joi.string().allow("").optional(),
});

const UpdateBlogValidation = joi.object({
  title: joi.string().min(3).max(100).required(),
  description: joi.string().required(),
  author: joi.string().required(),
  category: joi.string().required(),
  status: joi.string().valid("draft", "published", "unpublished", "submitted", "rejected").required(),
  image:joi.string().optional(),
  tags: joi.string().allow("").optional()
});

export { CreateBlogValidation, UpdateBlogValidation };
