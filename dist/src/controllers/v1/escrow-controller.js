"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EscrowController = void 0;
const escrow_manager_service_1 = require("../../services/v1/escrow/escrow-manager.service");
exports.EscrowController = {
    createDepositIntent(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const data = req.body;
                if (!((_a = data.depositorAddress) === null || _a === void 0 ? void 0 : _a.trim())) {
                    return res
                        .status(400)
                        .json({ message: "Depositor Wallet Address is required" });
                }
                const result = yield escrow_manager_service_1.EscrowManager.createDepositIntent(req);
                res.status(200).json(result);
            }
            catch (error) {
                console.error("Error creating deposit intent:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });
    },
    lockFundsForOrder(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { intentId, listingId, sellerId, buyerId, amount, checkoutId, walletToFund, toPay } = req.body;
                const result = yield escrow_manager_service_1.EscrowManager.lockFundsForOrder({
                    intentId,
                    listingId,
                    sellerId,
                    buyerId,
                    amount,
                    checkoutId,
                    walletToFund,
                    toPay
                });
                res.status(200).json(result);
            }
            catch (err) {
                res.status(400).json({ error: err.message });
            }
        });
    },
    releaseFunds(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { orderId } = req.params;
                const result = yield escrow_manager_service_1.EscrowManager.releaseFunds(orderId);
                res.status(200).json({ success: result });
            }
            catch (err) {
                res.status(400).json({ error: err.message });
            }
        });
    },
    cancelOrder(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { orderId } = req.params;
                const result = yield escrow_manager_service_1.EscrowManager.cancelOrder(orderId);
                res.status(200).json({ success: result });
            }
            catch (err) {
                res.status(400).json({ error: err.message });
            }
        });
    },
    getOrder(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { orderId } = req.params;
                const order = yield escrow_manager_service_1.EscrowManager.getOrder(orderId);
                res.status(200).json(order);
            }
            catch (err) {
                res.status(404).json({ error: err.message });
            }
        });
    },
    getUserBalance(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { userId } = req.params;
                const balance = yield escrow_manager_service_1.EscrowManager.getUserBalance(userId);
                res.status(200).json(balance);
            }
            catch (err) {
                res.status(404).json({ error: err.message });
            }
        });
    },
};
