import mongoose, { Schema, model, Document } from 'mongoose';

export interface IEscrow extends Document {
  account: mongoose.Schema.Types.ObjectId | string;
  totalEscrowBalance: number;
  availableEscrowBalance: number;
  lockedEscrowBalance: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

const escrowSchema = new Schema<IEscrow>({
  account: { type: mongoose.Schema.Types.ObjectId, ref: "accounts" },
  totalEscrowBalance: { type: Number, default: 0 },
  availableEscrowBalance: { type: Number, default: 0 },
  lockedEscrowBalance: { type: Number, default: 0 },
}, { timestamps: true });

const Escrow = model<IEscrow>('Escrow', escrowSchema);
export default Escrow;
