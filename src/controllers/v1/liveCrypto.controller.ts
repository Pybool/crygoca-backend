import {Request, Response } from "express";
import { fetchCrypto } from "../../services/v1/cryptolisting.service";

interface Xrequest extends Request {
    body:any;
}

export const liveCryptoCurrenciesController: any = {
    fetchCrypto: async (
    req: Xrequest,
    res: Response
  ) => {
    // try {
      const url:string = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?start=1&limit=${req.query.limit as string}&convert=USD&CMC_PRO_API_KEY=${process.env.COIN_CAP_KEY}`
      const result = await fetchCrypto(url);
      if (result) {
        res.status(200).json(result);
      } else {
        return res.status(422).json(result);
      }
    // } 
    // catch (error: any) {
    //   res.status(500).json({ status: false, message: error?.message });
    // }
  },

};
