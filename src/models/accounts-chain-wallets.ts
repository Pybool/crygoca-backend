import mongoose, { Schema, Document, Types } from "mongoose";

export interface IChainWallets extends Document {
  account: string | Schema.Types.ObjectId;
  chainId: number;
  address: string;
  privateKey: string;
  nonce: number;
  isRelayer: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const accountsBlockChainWallets = new Schema<IChainWallets>(
  {
    account: {
      type: Schema.Types.ObjectId,
      ref: "accounts",
      required: true,
    },
    chainId: { type: Number, required: true },
    address: { type: String, required: true },
    privateKey: { type: String, required: true },
    nonce: { type: Number, required: true, default: 0 },
    isRelayer: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
);

const BlockChainWallets = mongoose.model<IChainWallets>(
  "BlockChainWallets",
  accountsBlockChainWallets
);
export default BlockChainWallets;
