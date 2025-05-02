import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema({
  seller: { type: mongoose.Schema.Types.ObjectId, ref: "accounts" },
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: "accounts" },
  amount: Number,
  walletToFund:String,
  checkoutId: String,
  toPay:String,
  listing:{ type: mongoose.Schema.Types.ObjectId, ref: "cryptolisting" },
  status: { type: String, enum: ["Pending", "Approved", "cancelled"], default: "Pending" },
}, { timestamps: true });

export const Order = mongoose.model<any>(
  "Order",
  OrderSchema
);
