import { ValidationError } from "joi";
const bodyValidator = (schema) => {
    return async (req, res, next) => {
        try {
            const data = req.body;
            await schema.validateAsync(data, { abortEarly: false });
            next();
        }
        catch (exception) {
            console.log(exception);
            const detail = {};
            if (exception instanceof ValidationError) {
                exception.details.forEach((error) => {
                    detail[String(error.path[0])] = error.message;
                });
            }
            next({ status: 400, detail });
        }
    };
};
const paramsValidator = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.params, { abortEarly: false });
        if (!error)
            return next();
        const detail = {};
        error.details.forEach((item) => {
            detail[String(item.path[0])] = item.message;
        });
        next({ status: 400, detail });
    };
};
export { bodyValidator, paramsValidator };
export default bodyValidator;
