import { Request, Response, NextFunction, RequestHandler } from "express";
import { ObjectSchema, ValidationError } from "joi";

type ErrorDetail = Record<string, string>;

/**
 * Creates middleware that validates a request body against a Joi schema.
 *
 * @param {ObjectSchema} schema - Joi schema used to validate `req.body`.
 * @returns {Function} Express middleware that calls `next()` when valid or
 * passes a `400` validation error to the error handler.
 *
 * @example
 * router.post("/register", bodyValidator(registerSchema), addUser);
 */
const bodyValidator = (schema: ObjectSchema): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;

      await schema.validateAsync(data, { abortEarly: false });
      next();
    } catch (exception) {
      console.log(exception);
      const detail: ErrorDetail = {};

      if (exception instanceof ValidationError) {
        exception.details.forEach((error) => {
          detail[String(error.path[0])] = error.message;
        });
      }

      next({ status: 400, detail });
    }
  };
};

/**
 * Creates middleware that validates route parameters against a Joi schema.
 *
 * @param {ObjectSchema} schema - Joi schema used to validate `req.params`.
 * @returns {Function} Express middleware that calls `next()` when valid or
 * passes a `400` validation error to the error handler.
 *
 * @example
 * router.get("/blogs/:id", paramsValidator(blogIdSchema), getBlog);
 */
const paramsValidator = (schema: ObjectSchema): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.params, { abortEarly: false });

    if (!error) return next();

    const detail: ErrorDetail = {};
    error.details.forEach((item) => {
      detail[String(item.path[0])] = item.message;
    });

    next({ status: 400, detail });
  };
};

export { bodyValidator, paramsValidator };
export default bodyValidator;
