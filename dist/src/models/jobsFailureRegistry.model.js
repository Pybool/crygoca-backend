"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const failureRegistrySchema = new mongoose_1.default.Schema({
    uuid: { type: String, required: false, unique: true },
    type: { type: String, required: true },
    meta: { type: Object, default: null },
    amount: { type: Number, default: 0 },
    cycleCount: { type: Number, default: 0 },
    status: { type: String, default: "pending", enum: ["pending", "manual-resolve"] },
    createdAt: { type: Date, required: false },
});
const FailureRegistry = mongoose_1.default.model("FailureRegistry", failureRegistrySchema);
exports.default = FailureRegistry;
