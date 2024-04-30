import express from "express";
import { compareController } from "../../controllers/v1/compare.controller";

const compareRoute = express.Router();
compareRoute.post("/compare", compareController.compareExchangeProviders);
compareRoute.get("/get-country", compareController.getUserCountry)

export default compareRoute;
