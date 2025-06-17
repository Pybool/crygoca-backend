"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaymentMethods = exports.deletePaymentMethod = exports.addPaymentMethod = void 0;
const accounts_model_1 = __importDefault(require("../../models/accounts.model"));
const addPaymentMethod = async (req, res) => {
    try {
        const accountId = req.accountId; // Assuming you extract user from auth middleware
        const { paymentMethod } = req.body;
        if (!paymentMethod) {
            return res
                .status(200)
                .json({ status: false, message: "Error: Invalid data supplied" });
        }
        const account = await accounts_model_1.default.findOne({ _id: accountId });
        if (!account)
            return res
                .status(404)
                .json({ status: false, message: "Account not found" });
        account.paymentMethods.push(paymentMethod);
        await account.save();
        return res.json({
            status: true,
            message: "Payment method added successfully",
            account: account,
        });
    }
    catch (err) {
        console.log(err);
        return res
            .status(500)
            .json({ status: false, message: "Error adding payment method" });
    }
};
exports.addPaymentMethod = addPaymentMethod;
const deletePaymentMethod = async (req, res) => {
    try {
        const accountId = req.accountId;
        const { id } = req.query;
        const account = await accounts_model_1.default.findOne({ _id: accountId });
        if (!account)
            return res
                .status(404)
                .json({ status: false, message: "Account not found" });
        account.paymentMethods = account.paymentMethods.filter((m) => m._id.toString() !== id);
        await account.save();
        return res.json({
            status: true,
            message: "Payment method deleted",
            account: account,
        });
    }
    catch (err) {
        return res
            .status(500)
            .json({ status: false, message: "Error deleting method" });
    }
};
exports.deletePaymentMethod = deletePaymentMethod;
const getPaymentMethods = async (req, res) => {
    try {
        const accountId = req.accountId;
        const account = await accounts_model_1.default.findOne({ _id: accountId }, "paymentMethods");
        if (!account)
            return res
                .status(404)
                .json({ status: false, message: "Account not found" });
        return res.json({ status: true, data: account.paymentMethods });
    }
    catch (err) {
        return res
            .status(500)
            .json({ status: false, message: "Could not retrieve payment methods" });
    }
};
exports.getPaymentMethods = getPaymentMethods;
