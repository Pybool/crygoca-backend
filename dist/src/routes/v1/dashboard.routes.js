"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dashboard_controller_1 = require("../../controllers/v1/dashboard.controller");
const jwt_1 = require("../../middlewares/jwt");
const dashboardRouter = express_1.default.Router();
dashboardRouter.get("/fetch-dashboard-data-top", jwt_1.decodeExt, dashboard_controller_1.dashboardController._getImmediatelyVisibleData);
dashboardRouter.get("/fetch-sales-timeline-data", jwt_1.decodeExt, dashboard_controller_1.dashboardController._fetchSalesTimelineData);
dashboardRouter.get("/fetch-earnings-timeline-data", jwt_1.decodeExt, dashboard_controller_1.dashboardController._fetchEarningsTimelineData);
dashboardRouter.get("/fetch-purchase-spend-timeline-data", jwt_1.decodeExt, dashboard_controller_1.dashboardController._fetchPurchaseSpendTimelineData);
dashboardRouter.get("/fetch-wallet-timeline-data", jwt_1.decodeExt, dashboard_controller_1.dashboardController._fetchWalletTransactionData);
exports.default = dashboardRouter;
