// controllers/escrow.controller.ts
import { Request, Response } from "express";
import { EscrowManager } from "../../services/v1/escrow/escrow-manager.service";

export const EscrowController = {
  async createDepositIntent(req: Request, res: Response) {
    try {
      const data = req.body;

      if (!data.depositorAddress?.trim()) {
        return res
          .status(400)
          .json({ message: "Depositor Wallet Address is required" });
      }
      const result = await EscrowManager.createDepositIntent(req);
      res.status(200).json(result);
    } catch (error: any) {
      console.error("Error creating deposit intent:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  async lockFundsForOrder(req: Request, res: Response) {
    try {
      const {
        intentId,
        listingId,
        sellerId,
        buyerId,
        amount,
        checkoutId,
        walletToFund,
        toPay
      } = req.body;
      const result = await EscrowManager.lockFundsForOrder({
        intentId,
        listingId,
        sellerId,
        buyerId,
        amount,
        checkoutId,
        walletToFund,
        toPay
      });
      res.status(200).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  async releaseFunds(req: Request, res: Response) {
    try {
      const { orderId } = req.params;
      const result = await EscrowManager.releaseFunds(orderId);
      res.status(200).json({ success: result });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  async cancelOrder(req: Request, res: Response) {
    try {
      const { orderId } = req.params;
      const result = await EscrowManager.cancelOrder(orderId);
      res.status(200).json({ success: result });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  async getOrder(req: Request, res: Response) {
    try {
      const { orderId } = req.params;
      const order = await EscrowManager.getOrder(orderId);
      res.status(200).json(order);
    } catch (err: any) {
      res.status(404).json({ error: err.message });
    }
  },

  async getUserBalance(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const balance = await EscrowManager.getUserBalance(userId);
      res.status(200).json(balance);
    } catch (err: any) {
      res.status(404).json({ error: err.message });
    }
  },
};
