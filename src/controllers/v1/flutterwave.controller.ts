import {Request, Response } from "express";
import { FlutterWaveService } from "../../services/v1/payments/flutterwave.service";
import { GooglePayService } from "../../services/v1/payments/googlePay.service";

interface Xrequest extends Request {
    body:any;
}

export const flutterWaveController: any = {
    initiateCardPayment: async (
    req: Xrequest,
    res: Response
    ) => {
    try {
      const result = await FlutterWaveService.initiateCardPayment(req);
      if (result) {
        res.status(200).json(result);
      } else {
        return res.status(422).json(result);
      }
    } catch (error: any) {
      res.status(500).json({ status: false, message: error?.message });
    }
  },

  verifyCardPayment: async (
    req: Xrequest,
    res: Response
    ) => {
    try {
      const result = await FlutterWaveService.verifyCardPayment(req.body);
      if (result) {
        res.status(200).json(result);
      } else {
        return res.status(422).json(result);
      }
    } catch (error: any) {
      res.status(500).json({ status: false, message: error?.message });
    }
  },

  initiateACHPayment: async (
    req: Xrequest,
    res: Response
    ) => {
    try {
      const result = await FlutterWaveService.initiateACHPayment(req);
      if (result) {
        res.status(200).json(result);
      } else {
        return res.status(422).json(result);
      }
    } catch (error: any) {
      res.status(500).json({ status: false, message: error?.message });
    }
  },

  initiateGooglePayPayment: async (
    req: Xrequest,
    res: Response
    ) => {
    try {
      const result = await GooglePayService.makeGooglePayCharge(req);
      if (result) {
        res.status(200).json(result);
      } else {
        return res.status(422).json(result);
      }
    } catch (error: any) {
      res.status(500).json({ status: false, message: error?.message });
    }
  },

  googlePayTokenizedCharge: async (
    req: Xrequest,
    res: Response
    ) => {
    try {
      const result = await GooglePayService.googlePayTokenizedCharge(req);
      if (result) {
        res.status(200).json(result);
      } else {
        return res.status(422).json(result);
      }
    } catch (error: any) {
      res.status(500).json({ status: false, message: error?.message });
    }
  },

};
