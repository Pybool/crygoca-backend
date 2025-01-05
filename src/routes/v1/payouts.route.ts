import express from "express";
import { decode } from "../../middlewares/jwt";
import { payoutController } from "../../controllers/v1/payouts.controller";

const payoutRouter = express.Router();
payoutRouter.get("/payouts/fetch-payouts", decode, payoutController._getPayouts);

export default payoutRouter;