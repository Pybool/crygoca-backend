"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ordersController = void 0;
const cryptopurchases_service_1 = require("../../services/v1/listingsServices/cryptopurchases.service");
exports.ordersController = {
    _fetchOrders: async (req, res) => {
        try {
            const result = await (0, cryptopurchases_service_1.fetchOrders)(req);
            if (result) {
                res.status(200).json(result);
            }
            else {
                return res.status(422).json(result);
            }
        }
        catch (error) {
            res.status(500).json({ status: false, message: error?.message });
        }
    },
    _fetchMyOrders: async (req, res) => {
        try {
            const result = await (0, cryptopurchases_service_1.fetchMyOrders)(req);
            if (result) {
                res.status(200).json(result);
            }
            else {
                return res.status(422).json(result);
            }
        }
        catch (error) {
            res.status(500).json({ status: false, message: error?.message });
        }
    },
    _updateStatus: async (req, res) => {
        try {
            const result = await (0, cryptopurchases_service_1.updateStatus)(req);
            if (result) {
                res.status(200).json(result);
            }
            else {
                return res.status(422).json(result);
            }
        }
        catch (error) {
            res.status(500).json({ status: false, message: error?.message });
        }
    },
    _updateBuyerClaim: async (req, res) => {
        try {
            const result = await (0, cryptopurchases_service_1.updateBuyerClaim)(req);
            if (result) {
                res.status(200).json(result);
            }
            else {
                return res.status(422).json(result);
            }
        }
        catch (error) {
            res.status(500).json({ status: false, message: error?.message });
        }
    },
    _submitComplaint: async (req, res) => {
        try {
            let status = 400;
            const result = await (0, cryptopurchases_service_1.submitOrderComplaint)(req);
            if (result)
                status = 200;
            return res.status(status).json(result);
        }
        catch (error) {
            res.status(500).json({ status: false, message: error?.message });
        }
    },
};
