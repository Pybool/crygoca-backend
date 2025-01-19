import mongoose, { Document, Schema } from "mongoose";

export interface IWallet extends Document {
  user: mongoose.Types.ObjectId;
  balance: number;
  walletAccountNo:string;
  currency: string;
  currencySymbol:string;
  createdAt: Date;
}

const WalletSchema = new Schema<IWallet>({
  user: {
    type: Schema.Types.ObjectId,
    ref: "accounts",
    required: true,
    },
  walletAccountNo:{ type: String, required: true, unique: true },
  balance: { type: Number, required: true, default: 0 },
  currency: { type: String, required: false },
  currencySymbol: { type: String, required: false },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Wallet = mongoose.model<IWallet>("Wallet", WalletSchema);
