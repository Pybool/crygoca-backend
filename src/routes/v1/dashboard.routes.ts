import express from "express";
import { dashboardController } from "../../controllers/v1/dashboard.controller";
import { decode, decodeExt } from "../../middlewares/jwt";

const dashboardRouter = express.Router();
dashboardRouter.get(
  "/fetch-dashboard-data-top",
  decodeExt,
  dashboardController._getImmediatelyVisibleData
);

dashboardRouter.get(
  "/fetch-sales-timeline-data",
  decodeExt,
  dashboardController._fetchSalesTimelineData
);

dashboardRouter.get(
  "/fetch-earnings-timeline-data",
  decodeExt,
  dashboardController._fetchEarningsTimelineData
);

dashboardRouter.get(
  "/fetch-purchase-spend-timeline-data",
  decodeExt,
  dashboardController._fetchPurchaseSpendTimelineData
);




export default dashboardRouter;
