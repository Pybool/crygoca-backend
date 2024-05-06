import mongoose from 'mongoose';
const Schema = mongoose.Schema
import bcrypt from 'bcryptjs';

const AccountsSchema = new Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  email_confirmed: {
    type: Boolean,
    required: true,
    default:false
  },
  firstname: {
    type: String,
    required: false,
    default:''
  },
  surname: {
    type: String,
    required: false,
    default:''
  },
  othername: {
    type: String,
    required: false,
    default:''
  },
  username: {
    type: String,
    required: false,
    default:''
  },
  phone: {
    type: String,
    required: false,
    default:''
  },
  address: {
    type: String,
    required: false,
    default:''
  },
  avatar: {
    type: String,
    required: false,
    default:'/assets/images/anon.png'
  },
  isAdmin: {
    type: Boolean,
    default:false
  },
  reset_password_token: {
    type: String,
    required: false,
    default:''
  },
  reset_password_expires: {
    type: Date,
    required: false,
  },
})

AccountsSchema.pre('save', async function (next) {
  try {
    if (this.isNew) {
      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash(this.password, salt)
      this.password = hashedPassword
      this.username = 'User '+this._id
    }
    next()
  } catch (error:any) {
    next(error)
  }
})

AccountsSchema.methods.isValidPassword = async function (password:string) {
  try {
    return await bcrypt.compare(password, this.password)
  } catch (error) {
    throw error
  }
}

AccountsSchema.methods.getProfile = async function () {
  try {
    return {
      firstname:this.firstname,
      surname:this.surname,
      othername:this.othername,
      email:this.email,
      phone:this.phone,
      username:this.username,
      isAdmin: this.isAdmin,
      avatar: this.avatar,
      address: this.address
    }
  } catch (error) {
    throw error
  }
}


const Accounts = mongoose.model('accounts', AccountsSchema)
export default Accounts
