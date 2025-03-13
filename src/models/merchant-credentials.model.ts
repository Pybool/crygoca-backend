import mongoose, { Schema, Document } from "mongoose";
import { generateKeys } from "../services/v1/externalIntegration/credentials";

interface IMerchantCredentials extends Document {
  account: mongoose.Schema.Types.ObjectId;
  fingerprint: string;
  testPublicKey: string;
  testSecretKey: string;
  livePublicKey: string;
  liveSecretKey: string;
  createdAt: Date;
  updatedAt: Date;
}

const MerchantCredentialsSchema = new Schema<IMerchantCredentials>({
  account: {
    type: Schema.Types.ObjectId,
    ref: "merchantAccounts",
    required: true,
  },
  testPublicKey: {
    type: String,
    required: true,
    default: () => generateKeys("public", "test"),
  },
  testSecretKey: {
    type: String,
    required: true,
    default: () => generateKeys("secret", "test"),
  },
  livePublicKey: {
    type: String,
    required: true,
    default: () => generateKeys("public", "live"),
  },
  liveSecretKey: {
    type: String,
    required: true,
    default: () => generateKeys("secret", "live"),
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Auto-update the `updatedAt` field before saving
MerchantCredentialsSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const MerchantCredentials = mongoose.model<IMerchantCredentials>("merchantCredentials", MerchantCredentialsSchema);
export default MerchantCredentials;
