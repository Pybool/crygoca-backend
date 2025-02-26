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
exports.ordersController = void 0;
const cryptopurchases_service_1 = require("../../services/v1/listingsServices/cryptopurchases.service");
exports.ordersController = {
    _fetchOrders: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const result = yield (0, cryptopurchases_service_1.fetchOrders)(req);
            if (result) {
                res.status(200).json(result);
            }
            else {
                return res.status(422).json(result);
            }
        }
        catch (error) {
            res.status(500).json({ status: false, message: error === null || error === void 0 ? void 0 : error.message });
        }
    }),
    _fetchMyOrders: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const result = yield (0, cryptopurchases_service_1.fetchMyOrders)(req);
            if (result) {
                res.status(200).json(result);
            }
            else {
                return res.status(422).json(result);
            }
        }
        catch (error) {
            res.status(500).json({ status: false, message: error === null || error === void 0 ? void 0 : error.message });
        }
    }),
    _updateStatus: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const result = yield (0, cryptopurchases_service_1.updateStatus)(req);
            if (result) {
                res.status(200).json(result);
            }
            else {
                return res.status(422).json(result);
            }
        }
        catch (error) {
            res.status(500).json({ status: false, message: error === null || error === void 0 ? void 0 : error.message });
        }
    }),
    _updateBuyerClaim: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const result = yield (0, cryptopurchases_service_1.updateBuyerClaim)(req);
            if (result) {
                res.status(200).json(result);
            }
            else {
                return res.status(422).json(result);
            }
        }
        catch (error) {
            res.status(500).json({ status: false, message: error === null || error === void 0 ? void 0 : error.message });
        }
    }),
};
