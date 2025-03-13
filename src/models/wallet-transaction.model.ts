import mongoose, { Document, Schema } from "mongoose";

export interface IuserDetails {
  _id: string;
  firstname: string;
  lastname: string;
  username: string;
  email: string;
  geoData:any;
}

export interface IWalletTransaction extends Document {
  user: mongoose.Types.ObjectId | IuserDetails;
  userDetails?: any;
  amount: number;
  priorBalance?:number;
  creditWalletAccountNo?: string;
  debitWalletAccountNo?: string;
  payout?: any;
  verifiedTransaction?: any;
  type: string;
  operationType: string;
  reference?:string;
  createdAt: any;
}

const WalletTransactionSchema = new Schema<IWalletTransaction>({
  user: {
    type: Schema.Types.ObjectId,
    ref: "accounts",
    required: true,
  },
  creditWalletAccountNo: { type: String, required: false },
  debitWalletAccountNo: { type: String, required: false },
  payout: {
    type: Schema.Types.ObjectId,
    ref: "Payout",
    required: false,
  },
  verifiedTransaction: {
    type: Schema.Types.ObjectId,
    ref: "verifiedTransactions",
    required: false,
  },
  amount: { type: Number, required: true, default: 0 },
  priorBalance:{ type: Number, required: true, default: 0 },
  type: {
    type: String,
    required: true,
    default: "wallet-transfer",
    enum: [
      "wallet-transfer",
      "direct-topup",
      "payout-topup",
      "wallet-withdrawal",
      "wallet-balance-payment",
      "external-wallet-balance-payment"
    ],
  },
  reference: { type: String, required: false },
  operationType: {
    type: String,
    required: true,
    default: "credit",
    enum: ["credit", "debit"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const WalletTransaction = mongoose.model<IWalletTransaction>(
  "WalletTransaction",
  WalletTransactionSchema
);
