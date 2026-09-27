import { Request, Response, NextFunction } from "express";
import { ObjectSchema, ValidationError } from "joi";

type ErrorDetail = Record<string, string>;

const bodyValidator = (schema: ObjectSchema) => {
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

const paramsValidator = (schema: ObjectSchema) => {
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
