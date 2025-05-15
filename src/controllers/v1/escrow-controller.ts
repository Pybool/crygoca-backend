// controllers/escrow.controller.ts
import { Request, Response } from "express";
import { EscrowManager } from "../../services/v1/escrow/escrow-manager.service";
import { ERC20_TOKENS } from "../../escrow/config/tokens.config";
import web3 from "../../escrow/config/web3";
import { DepositIntent } from "../../models/depositIntent.model";
import mongoose from "mongoose";
import CryptoListing from "../../models/saleListing.model";
import Escrow from "../../models/escrow.model";
import { escrowBalanceQueue } from "../../escrow/queues/escrow-balance-queue";
import { sendTransferNotification } from "../../escrow/services/notify-ui";

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

  async fetchDepositIntents(req: Request, res: Response) {
    try {
      const result = await EscrowManager.fetchDepositIntents(req);
      res.status(200).json(result);
    } catch (error: any) {
      console.error("Error fetching deposit intent:", error);
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
        toPay,
        selectedBank
      } = req.body;
      const result = await EscrowManager.lockFundsForOrder({
        intentId,
        listingId,
        sellerId,
        buyerId,
        amount,
        checkoutId,
        walletToFund,
        toPay,
        selectedBank
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

  async manuallyConfirmDeposit(req: Request, res: Response) {
    const { sender, receivingAddress, amount, tokenSymbol } =
      req.body;

    if (!sender || !receivingAddress || !amount) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const token = ERC20_TOKENS.find(
      (t) => t.symbol.toLowerCase() === tokenSymbol.toLowerCase()
    );
    if (!token) {
      return res.status(404).json({ error: "Token not recognized" });
    }

    try {
      
      const fromBlock = (await web3.eth.getBlockNumber()) - 1000n; // search past ~5000 blocks
      const logs = await web3.eth.getPastLogs({
        fromBlock,
        toBlock: "latest",
        address: token.address,
        topics: [
          web3.utils.sha3("Transfer(address,address,uint256)")!,
          web3.utils.padLeft(sender.toLowerCase(), 64),
          web3.utils.padLeft(receivingAddress.toLowerCase(), 64),
        ],
      });

      console.log("=================> ", logs)

      for (let log of logs) {
        const _log: any = log;
        const decoded: any = web3.eth.abi.decodeLog(
          [
            { type: "address", name: "from", indexed: true },
            { type: "address", name: "to", indexed: true },
            { type: "uint256", name: "value" },
          ],
          _log.data,
          _log.topics.slice(1)
        );

        const decodedAmount = Number(decoded.value) / 10 ** token.decimals;
        if (Math.abs(decodedAmount - Number(amount)) > 0.00001) continue;

        const filter = {
          sender: decoded.from.toLowerCase(),
          tokenAddress: token.address.toLowerCase(),
          status: "pending",
          amount: decodedAmount.toString(),
          receivingAddress: decoded.to?.toLowerCase(),
        };

        const match = await DepositIntent.findOne(filter);
        if (!match) continue;

        console.log("Match found ", match)

        const session = await mongoose.startSession();
        try {
          session.startTransaction();

          match.status = "confirmed";
          match.txHash = _log.transactionHash;

          const listing = await CryptoListing.findOne({
            _id: match.listing,
          }).session(session);
          if (listing) {
            let escrow: any;
            const data = {
              account: listing.account?.toString(),
              totalEscrowBalance: decodedAmount,
              availableEscrowBalance: decodedAmount,
              lockedEscrowBalance: 0,
            };

            if (!match.isTopUp) {
              escrow = await Escrow.create([data], { session });
              listing.depositConfirmed = true;
              listing.escrow = escrow[0]._id;
              await listing.save({ session });
            } else {
              escrow = await Escrow.findOne({ _id: listing.escrow });
              await escrowBalanceQueue.add("topUpEscrow", {
                buyerId: listing.account,
                escrowId: escrow._id,
                amount: filter.amount,
              });
            }
            await match.save({ session });
            await session.commitTransaction();

            sendTransferNotification(match.account.toString(), match);
            return res.json({ message: "Deposit confirmed manually." });
          }
        } catch (err) {
          await session.abortTransaction();
          console.error("Manual confirmation error:", err);
          return res.status(500).json({ error: "Transaction failed" });
        } finally {
          session.endSession();
        }
      }

      return res.status(404).json({ message: "No matching deposit found" });
    } catch (error) {
      console.error("Manual deposit lookup error:", error);
      return res.status(500).json({ error: "Server error" });
    }
  },

  async cancelDeposit(req: Request, res: Response){
    try {
      const { orderId } = req.params;
      const result = await EscrowManager.cancelDeposit(orderId);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
};
