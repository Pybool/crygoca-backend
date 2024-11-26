import Joi from '@hapi/joi';

const authSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().min(8).required(),
});

const authSendEmailConfirmOtpSchema = Joi.object({
  accountId: Joi.string().required(),
});

const authSendResetPasswordOtp = Joi.object({
  email: Joi.string().email().lowercase().required(),
});

const authResetPassword = Joi.object({
  uid: Joi.string().required(),
  token: Joi.string().required(),
  password: Joi.string().min(8).required(),
});

const validations = {
  authSchema,
  authSendEmailConfirmOtpSchema,
  authSendResetPasswordOtp,
  authResetPassword,
}

export default validations