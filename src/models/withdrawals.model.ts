import mongoose from "mongoose";
const Schema = mongoose.Schema;

const WithdrawalsSchema = new Schema({
  reference: {
    type: String,
    required: true,
  },
  account: {
    type: Schema.Types.ObjectId,
    ref: "accounts",
    required: true,
  },
  wallet: {
    type: Schema.Types.ObjectId,
    ref: "wallet",
    required: true,
  },
  status: {
    type: String,
    required: true,
  },
  hash: {
    type: String,
    required: true,
  },
  payload: {
    type: Schema.Types.Mixed,
    required: true,
  },
  queuedResponse: {
    type: Schema.Types.Mixed,
    required: true,
  },
  verificationResponse: {
    type: Schema.Types.Mixed,
    required: false,
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

const Withdrawals = mongoose.model("withdrawals", WithdrawalsSchema);
export default Withdrawals;
