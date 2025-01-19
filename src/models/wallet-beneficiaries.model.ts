import mongoose, { Document, Schema } from "mongoose";
import { IWallet } from "./wallet.model";

export interface IuserDetails {
  _id: string;
  firstname: string;
  lastname: string;
  username: string;
  email: string;
}

export interface IWalletBeneficiary {
    account: mongoose.Types.ObjectId | Object;
    beneficiaryAccount: mongoose.Types.ObjectId | Object;
    receiverWallet: IWallet;
    bankDetails?:any;
    isCrygocaAccount?: boolean;
    createdAt?: Date;
  }

export interface IModelWalletBeneficiary extends Document {
  account: mongoose.Types.ObjectId | Object;
  beneficiaryAccount: mongoose.Types.ObjectId | Object;
  receiverWallet: IWallet;
  bankDetails?:any;
  isCrygocaAccount?: boolean;
  createdAt?: Date;
}

const WalletBeneficiarySchema = new Schema<IModelWalletBeneficiary>({
  account: {
    type: Schema.Types.ObjectId,
    ref: "accounts",
    required: true,
  },
  beneficiaryAccount: {
    type: Schema.Types.ObjectId,
    ref: "accounts",
    required: true,
  },
  receiverWallet: {
    type: Schema.Types.ObjectId,
    ref: "Wallet",
    required: true,
  },
  bankDetails: {
    type: Schema.Types.Mixed,
    required: false,
  },
  isCrygocaAccount: { type: Boolean, required: false, default: true },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const WalletBeneficiary = mongoose.model<IModelWalletBeneficiary>(
  "WalletBeneficiary",
  WalletBeneficiarySchema
);
