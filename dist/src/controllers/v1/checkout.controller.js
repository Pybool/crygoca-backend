"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkOutController = void 0;
const cryptolisting_service_1 = require("../../services/v1/listingsServices/cryptolisting.service");
exports.checkOutController = {
    saveCheckout: async (req, res) => {
        try {
            const result = await (0, cryptolisting_service_1.purchaseListingQuota)(req.body);
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
    getListingChanges: async (req, res) => {
        try {
            const result = await (0, cryptolisting_service_1.getListingChanges)(req.body.data);
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
};
