import mongoose from 'mongoose';
const Schema = mongoose.Schema

export interface IPurchaseSalelisting{
    account:string;
    cryptoListing: string;
    units: number;
    notes?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const CryptoListingPurchaseSchema = new Schema({
  account: {
    type: Schema.Types.ObjectId, ref: "accounts",
    required: true,
  },
  cryptoListing: {
    type: Schema.Types.ObjectId, ref: "cryptolisting",
    required: true,
  },
  units: {
    type: Number,
    required: true,
    default: 0
  },
  notes:{
    type: String,
    required: false
  },
  paymentConfirmed: {
    type: Boolean,
    required: false,
    default: false
  },
  createdAt: {
    type: Date,
    required: true
  },
  updatedAt: {
    type: Date,
    required: true
  },
 

})

const CryptoListingPurchase = mongoose.model('cryptolistingpurchase', CryptoListingPurchaseSchema)
export default CryptoListingPurchase;
