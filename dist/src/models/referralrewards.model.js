"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const referralRewardSchema = new mongoose.Schema({
    referralCode: { type: String, required: true }, // Referral code that triggered the reward
    rewardAmount: { type: Number, required: true }, // Amount rewarded to the referrer
    verifiedTransaction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "verifiedTransactions",
        required: true,
        unique: true
    },
    isPaid: { type: Boolean, default: false }, // Whether the reward has been paid to the referrer
}, { timestamps: true });
const ReferralReward = mongoose.model("ReferralReward", referralRewardSchema);
exports.default = ReferralReward;
