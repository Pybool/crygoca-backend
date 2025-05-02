import mongoose, { Schema, model, Document } from 'mongoose';

interface IDeposit extends Document {
  accountId: mongoose.Schema.Types.ObjectId;
  amount: number;
  currency: string;
  status: 'Pending' | 'Completed' | 'Failed' | 'Cancelled'; // Enum for status
  createdAt: Date;
  updatedAt: Date;
}

const depositSchema = new Schema<IDeposit>({
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: "accounts", required: true },
  amount: { type: Number, required: true },
  currency: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['Pending', 'Completed', 'Failed', 'Cancelled'], // Enum definition
    default: 'Pending'
  },
}, { timestamps: true });

const Deposit = model<IDeposit>('Deposit', depositSchema);
export default Deposit;
