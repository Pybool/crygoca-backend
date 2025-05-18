"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.payoutController = void 0;
const payout_service_1 = require("../../services/v1/listingsServices/payout.service");
exports.payoutController = {
    _getPayouts: async (req, res) => {
        try {
            const result = await payout_service_1.PayoutService.getPayOuts(req);
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
