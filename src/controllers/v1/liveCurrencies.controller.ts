import {Request, Response } from "express";
import { compareExchangeProviders } from "../../services/v1/comparison.service";
import { Icompare } from "../../interfaces/base.interface";
import { fetchRates } from "../../services/v1/liveCurrencies.service";

interface Xrequest extends Request {
    body:any;
}

export const liveCurrenciesController: any = {
    fetchRates: async (
    req: Xrequest,
    res: Response
  ) => {
    try {
      const result = await fetchRates("https://finance.yahoo.com/currencies");
      if (result) {
        res.status(200).json(result);
      } else {
        return res.status(422).json(result);
      }
    } catch (error: any) {
      res.status(500).json({ status: false, message: error?.message });
    }
  },

};
