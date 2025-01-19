import mongoose from "mongoose";
const Schema = mongoose.Schema;

const BanksSchema = new Schema({
  countryCode: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  routingNumber: {
    type: String,
    required: false,
    default: "",
  },
  swiftCode: {
    type: String,
    required: false,
    default: "",
  },
});

const Banks = mongoose.model("banks", BanksSchema);
export default Banks;
