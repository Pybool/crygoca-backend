// deposit intent model placeholder
import mongoose, { Schema } from "mongoose";

const depositIntentSchema = new mongoose.Schema(
  {
    intentId: String,
    sender: String,
    receivingAddress: String,
    currency: String,
    amount: String,
    gasFeeEth:String,
    gasFeeToken: String,
    gasConversionRate: String,
    tokenAddress: String,
    isTopUp: { type: Boolean, default: false },
    account: {
      type: Schema.Types.ObjectId,
      ref: "accounts",
      required: true,
    },
    listing: {
      type: Schema.Types.ObjectId,
      ref: "cryptolisting",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed"],
      default: "pending",
    },
    txHash: {
      type: String,
      required: false,
    },
    blockchain: {
      type: String,
      required: false,
    },
    chainId: {
      type: String,
      required: false,
    },
    blockHash: {
      type: String,
      required: false,
    },
    blockNumber: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

export const DepositIntent = mongoose.model(
  "DepositIntent",
  depositIntentSchema
);
