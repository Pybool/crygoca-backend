import mongoose from 'mongoose';
const Schema = mongoose.Schema

export interface ISalelisting{
  account?: string;
  cryptoName: string;
  cryptoCode: string;
  cryptoLogo?:string;
  cryptoCurrency?:string;
  units: number;
  minUnits: number;
  currency: string;
  unitPrice: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const CryptoListingSchema = new Schema({
  account: {
    type: Schema.Types.ObjectId, ref: "accounts",
    required: true,
  },
  cryptoName: {
    type: String,
    required: true
  },
  cryptoCode: {
    type: String,
    required: true, 
  },
  cryptoLogo: {
    type: String,
    required: true
  },
  cryptoCurrency:{
    type: Schema.Types.ObjectId, ref: "cryptocurrencies",
    required: true,
  },
  units: {
    type: Number,
    required: true,
    default: 0
  },
  currency: {
    type: String,
    required: true,
  },
  unitPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  minUnits: {
    type: Number,
    required: true,
    default: 0
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

const CryptoListing = mongoose.model('cryptolisting', CryptoListingSchema)
export default CryptoListing;
