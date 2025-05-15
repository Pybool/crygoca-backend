import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IComplaint extends Document {
  checkoutId: string;
  ticketNo: string;
  message: string;
  attachment?: string; // optional URL or path to the file
  account?: Types.ObjectId | string; // optional: who submitted the complaint
  listingPurchase?: Types.ObjectId | string; // optional: order ref if needed
  status: 'pending' | 'reviewing' | 'resolved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const complaintSchema = new Schema<IComplaint>(
  {
    ticketNo: { type: String, required: true, index: true },
    checkoutId: { type: String, required: true, index: true },
    message: { type: String, required: true },
    attachment: { type: String }, // file URL or path
    account: { type: Schema.Types.ObjectId, ref: 'accounts' }, // reference to user, optional
    listingPurchase: { type: Schema.Types.ObjectId, ref: 'cryptolistingpurchase' }, // reference to order, optional
    status: {
      type: String,
      enum: ['pending', 'reviewing', 'resolved', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

const Complaint = mongoose.model<IComplaint>('Complaint', complaintSchema);
export default Complaint;
