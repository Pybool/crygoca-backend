import mongoose, { Query } from "mongoose";
const Schema = mongoose.Schema;
import bcrypt from "bcryptjs";
import { generateReferralCode } from "../services/v1/helpers";

const AccountsSchema = new Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    unique: true,
  },
  password: {
    type: String,
    required: false,
    // select: false,
  },
  email_confirmed: {
    type: Boolean,
    required: true,
    default: false,
  },
  firstname: {
    type: String,
    required: false,
    default: "",
  },
  lastname: {
    type: String,
    required: false,
    default: "",
  },
  othername: {
    type: String,
    required: false,
    default: "",
  },
  fullname: {
    type: String,
    required: false,
    default: "",
  },
  googleId: {
    type: String,
    required: false,
    default: "",
  },
  idToken: {
    type: String,
    required: false,
    default: "",
  },
  provider: {
    type: String,
    required: false,
    enum: ["CRYGOCA", "GOOGLE"],
    default: "CRYGOCA",
  },
  username: {
    type: String,
    required: false,
    unique: true,
    default: "",
  },
  phone: {
    type: String,
    required: false,
    default: "",
  },
  address: {
    type: String,
    required: false,
    default: "",
  },
  useLoginOtp: {
    type: Boolean,
    default: true,
  },
  receiveNotifications: {
    type: Boolean,
    default: true,
  },
  allowRealNamesInTransfers: {
    type: Boolean,
    default: true,
  },
  useTransferOtpSms: {
    type: Boolean,
    default: false,
  },
  useTransferOtpEmail: {
    type: Boolean,
    default: true,
  },
  geoData: {
    type: Schema.Types.Mixed,
    required: false,
    default: {},
  },
  bankInfo: {
    type: Schema.Types.Mixed,
    required: false,
    default: {},
  },
  google2fa: {
    type: Boolean,
    default: false,
  },
  sms2fa: {
    type: Boolean,
    default: false,
  },
  email2fa: {
    type: Boolean,
    default: true,
  },
  walletCreated: {
    type: Boolean,
    default: false,
  },
  referralCode: { type: String, unique: true, required: false },
  referredBy: { type: String, default: null }, // This will store the referral code of the referrer
  referralCount: { type: Number, default: 0 },
  avatar: {
    type: String,
    required: false,
    default: "/assets/images/anon.png",
  },

  isAdmin: {
    type: Boolean,
    default: false,
  },

  isPlatform: {
    type: Boolean,
    default: false,
  },

  reset_password_token: {
    type: String,
    required: false,
    default: "",
  },
  reset_password_expires: {
    type: Date,
    required: false,
  },
  createdAt: {
    type: Date,
    default: null,
    required: false,
  },
  lastLogin: {
    type: Date,
    default: null,
    required: false,
  },
  lastSeen: {
    type: Date,
    default: null,
    required: false,
  },
  paymentMethods: [
    {
      country: { type: String, required: false },
      provider: { type: String, required: true },
      accountName: { type: String, required: true },
      accountNumber: { type: String, required: true },
      swiftCode: { type: String, required: false },
      routingNumber: { type: String , required: false},
      _id: { type: Schema.Types.ObjectId, auto: true }, // For easier editing/deleting
    }
  ],
  
});



AccountsSchema.pre(/^find/, function (next) {
  const fields = (this as Query<any, any> & { _fields?: any })._fields;
  if (!fields) {
   (this as Query<any, any>).select('-password');
  }
  next();
});



interface IAccountModel extends mongoose.Model<any> {
  changePassword(
    accountId: string,
    oldPassword: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<{ status: boolean; message: string }>;
  addPassword(
    accountId: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<{ status: boolean; message: string }>;
}

AccountsSchema.pre("save", async function (next) {
  try {
    if (this.isNew && this.googleId == "") {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(this.password!, salt);
      this.password = hashedPassword;
      this.referralCode = await generateReferralCode(this.username);
    }
    next();
  } catch (error: any) {
    next(error);
  }
});

AccountsSchema.methods.isValidPassword = async function (password: string) {
  try {
    return await bcrypt.compare(password, this.password);
  } catch (error) {
    throw error;
  }
};

AccountsSchema.statics.addPassword = async function (
  accountId: string,
  newPassword: string,
  confirmPassword: string
): Promise<{ status: boolean; message: string }> {
  try {
    // Fetch the account by ID
    const account = await this.findById(accountId);
    if (!account) {
      return { status: false, message: "Account not found" };
    }

    if(account?.password){
      return {
        status: false,
        message: "You already have an existing password, you can only change this password.",
      };
    }

    // Check if new password and confirm password match
    if (newPassword !== confirmPassword) {
      return {
        status: false,
        message: "New password and confirm password do not match",
      };
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update the account's password
    account.password = hashedPassword;
    await account.save();

    return { status: true, message: "Password created successfully" };
  } catch (error) {
    return { status: false, message: "Error updating password" };
  }
};

AccountsSchema.statics.changePassword = async function (
  accountId: string,
  oldPassword: string,
  newPassword: string,
  confirmPassword: string
): Promise<{ status: boolean; message: string }> {
  try {
    // Fetch the account by ID
    const account = await this.findById(accountId);
    if (!account) {
      return { status: false, message: "Account not found" };
    }

    // Compare old password
    try{
      const isMatch = await bcrypt.compare(oldPassword, account.password);
      if (!isMatch) {
        return { status: false, message: "Incorrect old password" };
      }
    }catch{
      return { status: false, message: "Incorrect old password" };
    }
    

    // Check if new password and confirm password match
    if (newPassword !== confirmPassword) {
      return {
        status: false,
        message: "New password and confirm password do not match",
      };
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update the account's password
    account.password = hashedPassword;
    await account.save();

    return { status: true, message: "Password updated successfully" };
  } catch (error) {
    return { status: false, message: "Error updating password" };
  }
};

AccountsSchema.methods.getProfile = async function () {
  try {
    return {
      firstname: this.firstname,
      lastname: this.lastname,
      othername: this.othername,
      email: this.email,
      phone: this.phone,
      username: this.username,
      isAdmin: this.isAdmin,
      avatar: this.avatar,
      address: this.address,
    };
  } catch (error) {
    throw error;
  }
};

AccountsSchema.index(
  { username: 1 },
  { collation: { locale: "en", strength: 2 } }
);

const Accounts = mongoose.model<any, IAccountModel>("accounts", AccountsSchema);
export default Accounts;
