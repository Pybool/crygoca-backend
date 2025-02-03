import mongoose from "mongoose";

const failureRegistrySchema = new mongoose.Schema({
  uuid: { type: String, required: false, unique: true },
  type: { type: String, required: true },
  meta: { type: Object, default: null },
  amount: { type: Number, default: 0 },
  cycleCount: { type: Number, default: 0 },
  status: { type: String, default: "pending", enum:["pending", "manual-resolve"] },
  createdAt:{ type: Date , required: false},
});

const FailureRegistry = mongoose.model("FailureRegistry", failureRegistrySchema);

export default FailureRegistry;
