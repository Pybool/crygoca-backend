import express from 'express';
const authRouter = express.Router();
import { handleInvalidMethod } from '../../middlewares/invalidrequest'
import authController from '../../controllers/v1/authentication.controller';
import { decode, ensureAdmin } from '../../middlewares/jwt';

authRouter.post('/register', authController.register)
authRouter.get('/verify-email-address', authController.verifyEmail)
authRouter.post('/resend-email-verification-otp', authController.sendEmailConfirmationOtp)
authRouter.post('/send-reset-password-link', authController.sendPasswordResetLink)
authRouter.post('/reset-password', authController.resetPassword)
authRouter.post('/login', authController.login)
authRouter.post('/refresh-token', authController.getRefreshToken)
authRouter.get('/user-profile', decode, authController.getUserProfile)
authRouter.put('/user-profile', decode, authController.saveUserProfile)
authRouter.put('/verify-account', authController.verifyEmail)



authRouter.all('/register', handleInvalidMethod);
authRouter.all('/verify-email-address', handleInvalidMethod);
authRouter.all('/resend-email-verification', handleInvalidMethod);
authRouter.all('/send-reset-password-link', handleInvalidMethod);
authRouter.all('/reset-password', handleInvalidMethod);
authRouter.all('/login', handleInvalidMethod);
authRouter.all('/refresh-token', handleInvalidMethod);
authRouter.all('/user-profile', handleInvalidMethod);
authRouter.all('/user-profile', handleInvalidMethod);
export default authRouter;

