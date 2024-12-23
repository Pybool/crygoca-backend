import mongoose, { Schema } from "mongoose";

const PayoutSchema = new Schema({
  checkOutId: {
    type: String,
    required: true,
  },
  cryptoListingPurchase: {
    type: Schema.Types.ObjectId,
    ref: "cryptolistingpurchase",
    required: true,
  },
  vendorAccount: {
    type: Schema.Types.ObjectId,
    ref: "accounts",
    required: true,
  },
  payout: {
    type: Number,
    required: true,
  },
  paymentMethod: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["Pending", "Completed", "Failed"],
    default: "Pending",
  },
  payoutDate: {
    type: Date,
  },
  transactionId: {
    type: String,
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Payout = mongoose.model("Payout", PayoutSchema);
export default Payout;
