import Joi from "joi";
const profileValidation = Joi.object({
    bio: Joi.string().max(250).allow('').optional(),
    socialLinks: Joi.object({
        instagram: Joi.string().uri().allow(""),
        facebook: Joi.string().uri().allow(""),
        website: Joi.string().uri().allow(""),
    }),
}).unknown(false);
export { profileValidation };
