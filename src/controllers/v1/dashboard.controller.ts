
import {Request, Response } from "express";
import { fetchOrders, fetchMyOrders, updateStatus, updateBuyerClaim } from "../../services/v1/listingsServices/cryptopurchases.service";
import { DashboardService } from "../../services/v1/dashboard/dashboard.service";

interface Xrequest extends Request {
    body:any;
}

export const dashboardController: any = {
  _getImmediatelyVisibleData: async (
    req: Xrequest,
    res: Response
    ) => {
    try {
      const result = await DashboardService.getImmediatelyVisibleData(req);
      if (result) {
        res.status(200).json(result);
      } else {
        console.log("422 result ===> ", result)
        return res.status(422).json(result);
      }
    } catch (error: any) {
      res.status(500).json({ status: false, message: error?.message });
    }
  },

  _fetchSalesTimelineData: async (
    req: Xrequest,
    res: Response
    ) => {
    try {
      const result = await DashboardService.fetchSalesTimelineData(req);
      if (result) {
        res.status(200).json(result);
      } else {
        return res.status(422).json(result);
      }
    } catch (error: any) {
      res.status(500).json({ status: false, message: error?.message });
    }
  },

  _fetchEarningsTimelineData: async (
    req: Xrequest,
    res: Response
    ) => {
    try {
      const result = await DashboardService.fetchEarningsTimelineData(req);
      if (result) {
        res.status(200).json(result);
      } else {
        return res.status(422).json(result);
      }
    } catch (error: any) {
      res.status(500).json({ status: false, message: error?.message });
    }
  },

  _fetchPurchaseSpendTimelineData: async (
    req: Xrequest,
    res: Response
    ) => {
    try {
      const result = await DashboardService.fetchPurchaseSpendTimelineData(req);
      if (result) {
        res.status(200).json(result);
      } else {
        return res.status(422).json(result);
      }
    } catch (error: any) {
      res.status(500).json({ status: false, message: error?.message });
    }
  },

  _fetchWalletTransactionData: async (
    req: Xrequest,
    res: Response
    ) => {
    try {
      const result = await DashboardService.fetchWalletTransactionData(req);
      if (result) {
        res.status(200).json({
          status: true,
          data: result
        });
      } else {
        return res.status(422).json({
          status: false,
          data: result
        });
      }
    } catch (error: any) {
      res.status(500).json({ status: false, message: error?.message });
    }
  },
}