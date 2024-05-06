import { RequestHandler } from "express";

export interface IAuth{
    register:RequestHandler;
    sendEmailConfirmationOtp: RequestHandler;
    sendPasswordResetLink: RequestHandler;
    resetPassword: RequestHandler;
    verifyEmail: RequestHandler;
    login: RequestHandler;
    getRefreshToken: RequestHandler;
    getUserProfile: RequestHandler;
    saveUserProfile: RequestHandler;
  }
  