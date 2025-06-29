import mongoose from 'mongoose';
const Schema = mongoose.Schema

const CryptoCurrenciesSchema = new Schema({
  cryptoId: {
    type: Number,
    required: false
  },
  logo: {
    type: Schema.Types.Mixed,
    required: false, 
    default: null
  },
  logo2: {
    type: String,
    required: false, 
  },
  quote: {
    type: Schema.Types.Mixed,
    required: false,
    default: {},
  },
  name: {
    type: String,
    required: false, 
  },
  symbol: {
    type: String,
    required: false,
  },
  slug: {
    type: String,
    required: false,
  },
  address: {
    type: String,
    required: false,
  },
  decimals: {
    type: Number,
    required: false,
  },
  chainId:{
    type: Number,
    required: false,
  },
  tags: {
    type: String,
    required: false,
  },
  platform:{
    type: Schema.Types.Mixed,
    required: false,
  },
  crygocaSupported: {
    type: Boolean,
    required: false,
    default: false,
  },
  dateAdded: {//Date crypto currency went live
    type: Date,
    required: false
  },
  createdAt: {
    type: Date,
    required: false
  },
 

})

const Cryptocurrencies = mongoose.model('cryptocurrencies', CryptoCurrenciesSchema)
export default Cryptocurrencies;
