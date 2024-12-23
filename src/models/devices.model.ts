import mongoose, { Schema } from "mongoose";

const DeviceSchema = new Schema({
  account: {
    type: Schema.Types.ObjectId,
    ref: "accounts",
    required: true,
  },
  fingerprint: {
    type: String,
    required: true,
    default: "",
  },
  ipAddress: {
    type: String,
    required: true,
  },
  deviceInformation: {
    type: Schema.Types.Mixed,
    required: true,
  },
  canLogin: {
    type: Boolean,
    required: true,
    default: false
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

const Devices = mongoose.model("devices", DeviceSchema);
export default Devices;
