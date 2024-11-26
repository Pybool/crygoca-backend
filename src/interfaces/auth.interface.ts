import { RequestHandler } from "express";

export interface IAuth{
    register:RequestHandler;
    sendEmailConfirmationOtp: RequestHandler;
    sendPasswordResetOtp: RequestHandler;
    verifyPasswordResetOtp:RequestHandler;
    resetPassword: RequestHandler;
    verifyEmail: RequestHandler;
    login: RequestHandler;
    checkUserName: RequestHandler;
    getRefreshToken: RequestHandler;
    getUserProfile: RequestHandler;
    saveUserProfile: RequestHandler;
  }
  