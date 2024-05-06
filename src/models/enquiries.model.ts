import mongoose from 'mongoose';
const Schema = mongoose.Schema

const EnquiriesSchema = new Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    unique: true,
  },
  name: {
    type: String,
    required: false,
    default:''
  },
  phone: {
    type: String,
    required: false,
    default:''
  },
  message: {
    type: String,
    required: false,
    default:''
  },
  createdAt: {
    type: Date,
    required: true
  },
 

})

const Enquiries = mongoose.model('enquiries', EnquiriesSchema)
export default Enquiries;
