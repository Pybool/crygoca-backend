import message from "../../helpers/messages";
import { NextFunction, Response } from "express";
import Xrequest from "../../interfaces/extensions.interface";
import { IAuth } from "../../interfaces/auth.interface";
import { Authentication } from "../../services/v1/auth/auth.service";

const authController: IAuth = {
  register: async (req: Xrequest, res: Response, next: NextFunction) => {
    let status = 200;
    try {
      const authentication = new Authentication(req);
      const result = await authentication.register();
      if (result.status) {
        status = 201;
        res.status(status).json(result);
      } else {
        console.log("result ", result);
        return res.status(200).json(result);
      }
    } catch (error: any) {
      console.log("Auth error ", error.message);
      if (error.isJoi === true) {
        error.status = 422;
      }
      res.status(status).json({ status: false, message: error?.message });
    }
  },

  sendPasswordResetOtp: async (
    req: Xrequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      let status = 400;
      const authentication = new Authentication(req);
      const result = await authentication.sendPasswordResetOtp();
      if (result.status) status = 200;
      res.status(status).json(result);
    } catch (error: any) {
      if (error.isJoi === true) error.status = 422;
      next(error);
    }
  },

  sendEmailConfirmationOtp: async (
    req: Xrequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      let status = 200;
      const authentication = new Authentication(req);
      const result: any = await authentication.sendEmailConfirmationOtp();
      if (!result.status) status = 400;
      res.status(status).json(result);
    } catch (error: any) {
      if (error.isJoi === true) error.status = 422;
      next(error);
    }
  },

  verifyPasswordResetOtp: async (
    req: Xrequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      let status = 200;
      const authentication = new Authentication(req);
      const result: any = await authentication.verifyPasswordResetOtp();
      if (!result.status) status = 400;
      res.status(status).json(result);
    } catch (error: any) {
      if (error.isJoi === true) error.status = 422;
      next(error);
    }
  },

  resetPassword: async (req: Xrequest, res: Response, next: NextFunction) => {
    console.log("reset password token ", req.query.token);
    try {
      let status = 400;
      const authentication = new Authentication(req);
      const result = await authentication.resetPassword();
      if (result.status) status = 200;
      res.status(status).json(result);
    } catch (error: any) {
      if (error.isJoi === true) error.status = 422;
      next(error);
    }
  },

  verifyEmail: async (req: Xrequest, res: Response, next: NextFunction) => {
    try {
      let status = 400;
      const authentication = new Authentication(req);
      const result = await authentication.verifyEmail();
      if (result.status) status = 200;
      res.status(status).json(result);
    } catch (error: any) {
      error.status = 422;
      next(error);
    }
  },

  login: async (req: Xrequest, res: Response, next: NextFunction) => {
    try {
      let status = 400;
      const authentication = new Authentication(req);
      const result = await authentication.login();
      status = 200;
      return res.status(status).json(result);
    } catch (error: any) {
      if (error.isJoi === true) {
        res
          .status(400)
          .json({ status: false, message: message.auth.invalidCredentials });
      } else {
        res
          .status(400)
          .json({ status: false, message: "Could not process login request!" });
      }
    }
  },

  checkUserName:async (req: Xrequest, res: Response, next: NextFunction) => {
    try {
      let status = 400;
      const authentication = new Authentication(req);
      const result = await authentication.checkUserName();
      status = 200;
      return res.status(status).json(result);
    } catch (error: any) {
      if (error.isJoi === true) {
        res
          .status(400)
          .json({ status: false, message: "" });
      } else {
        res
          .status(400)
          .json({ status: false, message: "Could not process request!" });
      }
    }
  },

  getRefreshToken: async (req: Xrequest, res: Response, next: NextFunction) => {
    try {
      let status = 400;
      const authentication = new Authentication(req);
      if (req.body.refreshToken == "") {
        res.status(200).json({ status: false });
      }
      const result = await authentication.getRefreshToken(next);
      if (result) status = 200;
      res.status(status).json(result);
    } catch (error: any) {
      error.status = 422;
      next(error);
    }
  },

  getUserProfile: async (req: Xrequest, res: Response, next: NextFunction) => {
    try {
      let status = 400;
      const authentication = new Authentication(req);
      const result = await authentication.getUserProfile();
      if (result) status = 200;
      res.status(status).json(result);
    } catch (error: any) {
      error.status = 422;
      next(error);
    }
  },

  saveUserProfile: async (req: Xrequest, res: Response, next: NextFunction) => {
    try {
      let status = 400;
      const authentication = new Authentication(req);
      const result = await authentication.saveUserProfile();
      if (result) status = 200;
      res.status(status).json(result);
    } catch (error: any) {
      error.status = 422;
      next(error);
    }
  },
};

export default authController;
