"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardController = void 0;
const dashboard_service_1 = require("../../services/v1/dashboard/dashboard.service");
exports.dashboardController = {
    _getImmediatelyVisibleData: async (req, res) => {
        try {
            const result = await dashboard_service_1.DashboardService.getImmediatelyVisibleData(req);
            if (result) {
                res.status(200).json(result);
            }
            else {
                console.log("422 result ===> ", result);
                return res.status(422).json(result);
            }
        }
        catch (error) {
            res.status(500).json({ status: false, message: error?.message });
        }
    },
    _fetchSalesTimelineData: async (req, res) => {
        try {
            const result = await dashboard_service_1.DashboardService.fetchSalesTimelineData(req);
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
    _fetchEarningsTimelineData: async (req, res) => {
        try {
            const result = await dashboard_service_1.DashboardService.fetchEarningsTimelineData(req);
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
    _fetchPurchaseSpendTimelineData: async (req, res) => {
        try {
            const result = await dashboard_service_1.DashboardService.fetchPurchaseSpendTimelineData(req);
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
    _fetchWalletTransactionData: async (req, res) => {
        try {
            const result = await dashboard_service_1.DashboardService.fetchWalletTransactionData(req);
            if (result) {
                res.status(200).json({
                    status: true,
                    data: result
                });
            }
            else {
                return res.status(422).json({
                    status: false,
                    data: result
                });
            }
        }
        catch (error) {
            res.status(500).json({ status: false, message: error?.message });
        }
    },
};
