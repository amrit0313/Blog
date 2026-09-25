
import { Request, Response, NextFunction } from "express";
import { ObjectSchema, ValidationError } from "joi";

type ErrorDetail = Record<string, string>;

const bodyValidator = (schema :ObjectSchema) =>{

    return async (req: Request, res: Response, next: NextFunction) =>{
        try{
            const data = req.body
       

        await schema.validateAsync(data, {abortEarly:false})
        next();
        }
        catch(exception){
            console.log(exception)
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

export default bodyValidator;