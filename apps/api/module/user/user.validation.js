import Joi from "joi";
const userUpdateValidation = Joi.object({
    name: Joi.string().trim().min(2).max(100),
    email: Joi.string().trim().email(),
})
    .min(1)
    .unknown(false);
const userParamsValidation = Joi.object({
    id: Joi.string().hex().length(24).required(),
});
export { userParamsValidation, userUpdateValidation };
