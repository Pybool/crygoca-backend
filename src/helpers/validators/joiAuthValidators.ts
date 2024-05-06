import Joi from '@hapi/joi';

const authSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().min(4).required(),
});

const authSendEmailConfirmOtpSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
});

const authSendResetPasswordLink = Joi.object({
  email: Joi.string().email().lowercase().required(),
});

const authResetPassword = Joi.object({
  password: Joi.string().min(4).required(),
});

const validations = {
  authSchema,
  authSendEmailConfirmOtpSchema,
  authSendResetPasswordLink,
  authResetPassword,
}

export default validations