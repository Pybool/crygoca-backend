import {Request, Response } from "express";
import { fetchOrders, fetchMyOrders, updateStatus, updateBuyerClaim } from "../../services/v1/listingsServices/cryptopurchases.service";

interface Xrequest extends Request {
    body:any;
}

export const ordersController: any = {
  _fetchOrders: async (
    req: Xrequest,
    res: Response
    ) => {
    try {
      const result = await fetchOrders(req);
      if (result) {
        res.status(200).json(result);
      } else {
        return res.status(422).json(result);
      }
    } catch (error: any) {
      res.status(500).json({ status: false, message: error?.message });
    }
  },

  _fetchMyOrders: async (
    req: Xrequest,
    res: Response
    ) => {
    try {
      const result = await fetchMyOrders(req);
      if (result) {
        res.status(200).json(result);
      } else {
        return res.status(422).json(result);
      }
    } catch (error: any) {
      res.status(500).json({ status: false, message: error?.message });
    }
  },

  _updateStatus: async (
    req: Xrequest,
    res: Response
    ) => {
    try {
      const result = await updateStatus(req);
      if (result) {
        res.status(200).json(result);
      } else {
        return res.status(422).json(result);
      }
    } catch (error: any) {
      res.status(500).json({ status: false, message: error?.message });
    }
  },

  _updateBuyerClaim: async (
    req: Xrequest,
    res: Response
    ) => {
    try {
      const result = await updateBuyerClaim(req);
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