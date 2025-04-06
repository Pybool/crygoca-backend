import express from "express";
import { liveCryptoCurrenciesController } from "../../controllers/v1/liveCrypto.controller";
import { decode } from "../../middlewares/jwt";
import Cryptocurrencies from "../../models/cryptocurrencies.model";

const liveCrypto = express.Router();
liveCrypto.get(
  "/fetch-live-cryptocurrencies",
  liveCryptoCurrenciesController.fetchCrypto
);

liveCrypto.get("/get-cryptos", liveCryptoCurrenciesController.getCryptos);

liveCrypto.post(
  "/create-crypto-sales-listing",
  decode,
  liveCryptoCurrenciesController.createListing
);

liveCrypto.put(
  "/edit-crypto-sales-listing",
  decode,
  liveCryptoCurrenciesController.editListing
);

liveCrypto.post(
  "/bookmarking-crypto-sales-listing",
  decode,
  liveCryptoCurrenciesController.bookMarkingListing
);





liveCrypto.get(
  "/fetch-crypto-sales-listings",
  decode,
  liveCryptoCurrenciesController.fetchOrFilterListings
);

liveCrypto.post(
  "/archive-crypto-sales-listing",
  decode,
  liveCryptoCurrenciesController.archiveListings
)

liveCrypto.post("/update-crypto-quotes", async (req: any, res: any) => {
  const cryptocurrenciesData = req.body.data;
  for (let cryptocurrency of cryptocurrenciesData) {
    const crypto = await Cryptocurrencies.findOne({
      name: cryptocurrency.name,
      symbol: cryptocurrency.symbol,
    });
    if (crypto) {
      crypto.quote = cryptocurrency.quote;
      await crypto.save();
    }
  }
  return res.send({ success: "ok" });
});

export default liveCrypto;
