import mongoose, { Document, Schema } from "mongoose";

export interface IWalletExternalTransaction{
  creditWallet: mongoose.Types.ObjectId;
  debitWallet:mongoose.Types.ObjectId;
  amount: number;
  status: "PENDING" | "AUTHORIZED" | "SUCCESS";
  paymentProcessor?: string;
  txRef: string;
  currency: string;
  convertedAmount: number;
  app_fee: number;
  payment_type: string;
  authorized:boolean;
  exchangeRate: number,
  conversionPayload:any;
  isConverted:boolean;
  mode: "test" | "live"
  businessName: string,
  logo: string,
  redirectUrl: string,
  updatedAt?: Date;
  createdAt?: Date;
}



export interface IWalletExternalTransactions extends Document {
  creditWallet: mongoose.Types.ObjectId;
  debitWallet:mongoose.Types.ObjectId;
  amount: number;
  status: "PENDING" | "SUCCESS";
  paymentProcessor: string;
  txRef: string;
  currency: string;
  convertedAmount: number;
  app_fee: number;
  payment_type: string;
  authorized:boolean;
  exchangeRate: number,
  conversionPayload:any;
  isConverted:boolean;
  mode: "test" | "live"
  businessName: string,
  logo: string,
  redirectUrl: string,
  updatedAt?: Date;
  createdAt?: Date;
}

const WalletExternalTransactionsSchema = new Schema<IWalletExternalTransactions>(
  {
    debitWallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
      required: true,
    },
    creditWallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "SUCCESS"],
      required: true,
    },
    paymentProcessor: {
      type: String,
      required: true,
      default:"CRYGOCA"
    },
    txRef: {
      type: String,
      required: true,
      unique: true
    },
    currency: {
      type: String,
      required: true,
    },
    convertedAmount: {
      type: Number,
      required: false,
    },
    app_fee: {
      type: Number,
      default: 0,
    },
    payment_type: {
      type: String,
      required: true,
    },
    authorized: {
      type: Boolean,
      required: true,
      default: false
    },
    exchangeRate: {
      type: Number,
      default: 0,
    },
    conversionPayload: {
      type: Schema.Types.Mixed,
      required: false,
      default: {},
    },
    isConverted: {
      type: Boolean,
      required: true,
      default: false
    },
    mode: {
      type: String,
      required: true,
      default: "test"
    },
    businessName: {
      type: String,
      required: true,
    },
    logo: {
      type: String,
      required: true,
    },
    redirectUrl: {
      type: String,
      required: true,
    },
  },
  { timestamps: true } // Automatically manages `createdAt` and `updatedAt`
);

export const WalletExternalTransactions = mongoose.model<IWalletExternalTransactions>(
  "WalletExternalTransactions",
  WalletExternalTransactionsSchema
);
