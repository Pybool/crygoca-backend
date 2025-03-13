import mongoose, { Document, Schema } from "mongoose";

export interface IWallet extends Document {
  user: mongoose.Types.ObjectId;
  userType: string;
  balance: number;
  priorBalance?: number;
  walletAccountNo: string;
  currency: string;
  currencySymbol: string;
  updatedAt?: Date;
  createdAt: Date;
}

const WalletSchema = new Schema<IWallet>({
  user: {
    type: Schema.Types.ObjectId,
    refPath: "accounts",
    required: true,
  },
  userType: {
    type: String,
    required: true,
    enum: ["accounts", "merchantAccounts"], // Allowed models
    default:"accounts"
  },
  walletAccountNo: { type: String, required: true, unique: true },
  balance: { type: Number, required: true, default: 0 },
  priorBalance: { type: Number, required: false, default: 0 },
  currency: { type: String, required: false },
  currencySymbol: { type: String, required: false },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

WalletSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});



export const Wallet = mongoose.model<IWallet>("Wallet", WalletSchema);
