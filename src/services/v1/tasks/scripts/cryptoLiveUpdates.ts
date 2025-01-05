const axios = require("axios");
import { config as dotenvConfig } from "dotenv";
import { Cache } from "../../../../middlewares/cache";
import { sendDevMail } from "../../conversions/liveCurrencies.service";

dotenvConfig({ path: `.env` });

const memCache = new Cache();
let downtimeCounter = { convert: 0 };

async function saveCryptoQuotes(cryptocurrenciesData: any[]): Promise<void> {
  try {
    const response = await axios.post(
      `${process.env.CRYGOCA_SERVER_URL}/api/v1/update-crypto-quotes`,
      { data: cryptocurrenciesData }, // Pass the data in the request body
      {
        headers: {
          "Content-Type": "application/json", // Specify JSON content type
        },
      }
    );

    // Log response from the server
    console.log("Crypto quotes updated successfully:", response.data);
  } catch (error: any) {
    // Handle errors and log useful details
    if (error.response) {
      console.error("Error response from server:", error.response.data);
      console.error("Status code:", error.response.status);
    } else if (error.request) {
      console.error("No response received from server:", error.request);
    } else {
      console.error("Error during request setup:", error.message);
    }
  }
}


export async function cryptoLiveUpdates(
  start: number = 1,
  limit: number = 2
) {
  try {
   
    const url = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?start=${start}&limit=${limit}&convert=${"USD"}&CMC_PRO_API_KEY=${
      process.env.CMC_PRO_API_KEY as string
    }`;

    console.log("URL ", url);
    if (await memCache.get(url)) {
      console.log("Fetching cryptoliveUpdates from cache");
      const result = { status: true, data: await memCache.get(url) }
      process.send?.(result)
      return result
    } else {
      const response = await axios.get(url);

      if (response.status==200) {
        let responseData: any = response.data;
        if(responseData?.status?.error_code==0){
          const result = { status: true, data: responseData.data }
          await saveCryptoQuotes(responseData.data)
          await memCache.set(url, responseData.data, 3600);
          process.send?.(result)
          return result
        }else{
          process.send?.({status:false, data: null})
          return {status:false, data: null}
        }
      }
      process.send?.({ status: false, data: null })
      return { status: false, data: null };
    }
  } catch (error: any) {
    downtimeCounter.convert += 1;
    if (downtimeCounter.convert >= 3) {
      sendDevMail(
        "cryptoliveUpdates service seems to be having some challenges at the moment."
      );
      downtimeCounter.convert = 0;
    }
    process.send?.({ status: false, error: error.message })
    return { status: false, error: error.message };
  }
}

// Entry point for the script
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error("Invalid arguments");
    process.exit(1);
  }

  const start = Number(args[0]);
  const limit = Number(args[1]);

  cryptoLiveUpdates(start, limit);
}
