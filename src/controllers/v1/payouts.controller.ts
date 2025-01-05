import {Request, Response } from "express";
import { PayoutService } from "../../services/v1/listingsServices/payout.service";

interface Xrequest extends Request {
    body:any;
}

export const payoutController: any = {
  _getPayouts: async (
    req: Xrequest,
    res: Response
    ) => {
    try {
      const result = await PayoutService.getPayOuts(req);
      if (result) {
        res.status(200).json(result);
      } else {
        return res.status(422).json(result);
      }
    } catch (error: any) {
      res.status(500).json({ status: false, message: error?.message });
    }
  },
}