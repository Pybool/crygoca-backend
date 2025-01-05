"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const message = {
    auth: {
        alreadyExistPartText: 'User with email address already exists!',
        notRegisteredPartText: 'was not found as a registered user',
        emailAlreadyVerified: 'This email has already been verified',
        missingConfToken: 'Confirmation token is missing',
        emailVerifiedOk: 'User email has been verified successfully',
        invalidConfToken: 'Invalid confirmation token',
        userNotRegistered: 'User not registered',
        invalidCredentials: 'Username/password not valid',
        emailNotVerified: 'You have not verified your email address',
        userNotRequestPasswordReset: 'did not request for a password reset.',
        invalidTokenSupplied: 'No valid token was received, request new otp',
        passwordResetOk: 'Password has been reset successfully.',
        passwordResetFailed: 'Password could not be reset',
        loginError: 'Something went wrong while authenticating..'
    }
};
exports.default = message;
