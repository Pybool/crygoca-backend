import mongoose from 'mongoose';
const Schema = mongoose.Schema

const VerifiedTransactionsSchema = new Schema({
  tx_ref: {
    type: String,
    required: true
  },
  data:{
    type: Schema.Types.Mixed,
    required: true,
  },
  paymentProcessor:{
    type: String,
    required: false,
    enum: ["FLUTTERWAVE", "STRIPE","ALCHEMY PAY", "GOOGLE PAY"],
    default: "FLUTTERWAVE"
  },
  account: {
    type: Schema.Types.ObjectId, ref: "accounts",
    required: true,
  },
  valueProvided:{
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now
  },


})

const VerifiedTransactions = mongoose.model('verifiedTransactions', VerifiedTransactionsSchema)
export default VerifiedTransactions;
