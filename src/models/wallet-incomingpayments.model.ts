
import mongoose, { Document, Schema } from "mongoose";

export interface IWalletIncomingPayments extends Document {
  wallet: mongoose.Types.ObjectId;
  amount: number;
  status:"PENDING" | "APPROVED";
  checkOutId:string;
  debitWalletAccountNo:string;
  updatedAt?:Date;
  createdAt: Date | string;
}

const WalletIncomingPaymentsSchema = new Schema<IWalletIncomingPayments>({
  wallet: {
    type: Schema.Types.ObjectId,
    ref: "wallet",
    required: true,
    },
  checkOutId:{ type: String },
  status:{ type: String },
  amount: { type: Number, required: true, default: 0 },
  debitWalletAccountNo:{ type: String },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

WalletIncomingPaymentsSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});



export const WalletIncomingPayments = mongoose.model<IWalletIncomingPayments>("WalletIncomingPayments", WalletIncomingPaymentsSchema);
