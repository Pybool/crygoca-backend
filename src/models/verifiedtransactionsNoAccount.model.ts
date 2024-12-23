import mongoose from "mongoose";
const Schema = mongoose.Schema;

const VerifiedTransactionsNoAuthSchema = new Schema({
  tx_ref: {
    type: String,
    required: true,
  },
  data: {
    type: Schema.Types.Mixed,
    required: true,
  },
  valueProvided: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now
  },
});

const VerifiedTransactionsNoAuth = mongoose.model(
  "verifiedTransactionsNoAuth",
  VerifiedTransactionsNoAuthSchema
);
export default VerifiedTransactionsNoAuth;
