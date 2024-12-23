import {Request, Response } from "express";
import { getListingChanges, purchaseListingQuota } from "../../services/v1/listingsServices/cryptolisting.service";

interface Xrequest extends Request {
    body:any;
}

export const checkOutController: any = {
    saveCheckout: async (
    req: Xrequest,
    res: Response
    ) => {
    try {
      const result = await purchaseListingQuota(req.body);
      if (result) {
        res.status(200).json(result);
      } else {
        return res.status(422).json(result);
      }
    } catch (error: any) {
      res.status(500).json({ status: false, message: error?.message });
    }
  },

  getListingChanges: async (
    req: Xrequest,
    res: Response
    ) => {
    try {
      const result = await getListingChanges(req.body.data);
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