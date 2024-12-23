import Joi from '@hapi/joi';

const authSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().min(8).required(),
  deviceInformation: Joi.object()
});

const registerSchema = Joi.object({
  username: Joi.string().min(5).required(),
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().min(8).required(),
  referralCode:Joi.string().min(8),
  geoData:Joi.object()
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
  registerSchema,
  authSendEmailConfirmOtpSchema,
  authSendResetPasswordOtp,
  authResetPassword,
}

export default validations