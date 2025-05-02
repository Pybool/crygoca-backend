// models/TransferLog.ts
import mongoose from "mongoose";

const TransferLogSchema = new mongoose.Schema({
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "accounts",
    required: true,
  },
  escrow: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Escrow",
    required: true,
  },
  checkOutId:String,
  recipient: String,
  symbol: String,
  amount: String,
  tokenAddress: String,
  type: String,
  txHash: String,
  status: String,
  error: String,
  createdAt: { type: Date, default: Date.now },
});

export const TransferLog = mongoose.model("TransferLog", TransferLogSchema);
