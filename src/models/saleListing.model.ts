import mongoose from 'mongoose';
const Schema = mongoose.Schema

export interface ISalelisting{
  _id?:string;
  account?: string;
  cryptoName: string;
  cryptoCode: string;
  cryptoLogo?:string;
  cryptoCurrency?:string;
  depositConfirmed?:boolean;
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
  isArchived:{
    type: Boolean,
    required: false,
    default: false,
  },
  depositConfirmed:{
    type: Boolean,
    required: false,
    default: false,
  },
  escrow:{
    type: Schema.Types.ObjectId, ref: "Escrow",
    required: false,
  },
  isCrygoca:{
    type: Boolean,
    required: false,
    default: false,
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
