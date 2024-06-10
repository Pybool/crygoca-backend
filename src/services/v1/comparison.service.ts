const axios = require("axios");
import { getCountryNameByCode } from "../../helpers/countries";
import { getCountryCurrencyByCountryCode } from "../../helpers/currenciesCountryCodes";
// https://api.transferwise.com/v3/comparisons/?sendAmount=1000&sourceCurrency=CAD&targetCurrency=USD
import "./liveCurrencies.service";
import geoip from "geoip-lite"; // Import geoip-lite library
import { config as dotenvConfig } from "dotenv";
import ejs from "ejs";
import juice from "juice";
import sendMail from "./mailtrigger";
import { Cache } from "../../middlewares/cache";
dotenvConfig();

const memCache = new Cache();
let downtimeCounter = { convert: 0 };
interface Quote {
  rate: number;
  fee: number;
  receivedAmount: number;
}

interface Provider {
  quotes: Quote[];
}

export async function getUserCountry(req: any): Promise<any> {
  try {
    let geoData = geoip.lookup(req.ip) as any;
    const countryCode = geoData.country;
    geoData.country = getCountryNameByCode(countryCode);
    geoData.currency = getCountryCurrencyByCountryCode(countryCode);
    geoData.countryCode = countryCode;
    if (geoData) {
      return {
        geoData,
        connectionRemoteAddress: req.connection.remoteAddress,
        reqIp: req.ip,
        socketRemoteAddress: req.socket.remoteAddress,
        forwardedIp: req.headers["x-forwarded-for"],
      };
    }

    return null;
  } catch (error) {
    console.error("Error fetching geolocation data:", error);
    return null; // Return null in case of errors
  }
}

export async function convertCurrency(
  from: string,
  to: string,
  currencyFrom: string,
  currencyTo: string,
  amount: string
) {
  try {
    const data = {
      lang: "en",
      from: from.toUpperCase(),
      to: to.toUpperCase(),
      currencyFrom: currencyFrom.toUpperCase(),
      currencyTo: currencyTo.toUpperCase(),
      amount: parseInt(amount) || 1,
      maxAge: 0,
    };
    // https://api.currencyapi.com/v3/latest?apikey=cur_live_d52M3q2XMNDurG4Q7kHtSr3P5iqTsNWpUtF5kcNx&currencies=NGN&base_currency=GBP

    const url = `https://api.currencyapi.com/v3/latest?apikey=${process.env.CURRENCYAPI_APP_ID}&base_currency=${data.currencyFrom}&currencies=${data.currencyTo}`;
    console.log("Cache ", memCache.get(url));
    if (memCache.get(url)) {
      console.log("Fetching conversion from cache");
      return { status: true, data: memCache.get(url) };
    } else {
      const response = await axios.get(url);
      console.log("STATUS ", response.status);
      if (response.status) {
        let responseData: any = response.data;
        memCache.set(url, { status: true, data: responseData }, 1200);
        return { status: true, data: responseData };
      }
      return { status: false, data: null };
    }
  } catch (error: any) {
    downtimeCounter.convert += 1;
    if (downtimeCounter.convert >= 3) {
      sendDevMail(
        "Currency conversion service seems to be having some challenges at the moment."
      );
    }
    return { status: false, error: error.message };
  }
}

export async function compareExchangeProviders(
  from: string,
  to: string,
  currencyFrom: string,
  currencyTo: string,
  amount: string,
  compare: string
) {
  const data = {
    lang: "en",
    from: from.toUpperCase(),
    to: to.toUpperCase(),
    currencyFrom: currencyFrom.toUpperCase(),
    currencyTo: currencyTo.toUpperCase(),
    amount: parseInt(amount) || 1,
    maxAge: 0,
  };

  try {
    const response = await axios.get(
      `https://api.transferwise.com/v3/comparisons/?sendAmount=${data.amount}&sourceCurrency=${data.currencyFrom}&targetCurrency=${data.currencyTo}`
    );

    const filter: any[] = [];
    if (response.status) {
      let responseData: any = response.data;
      responseData = response.data;
      return { status: true, filter, data: responseData };
    }
    sendDevMail(
      "Currency comparison service seems to to having challenges at the moment.."
    );
    return { status: false, filter, data: null };
  } catch (error: any) {
    sendDevMail(
      "Currency comparison service seems to to having challenges at the moment.."
    );
    return { status: false, error: error.message };
  }
}

const sendDevMail = (msg: any = null) => {
  console.log("I was called.....");
  return new Promise(async (resolve: any, reject: any) => {
    const responseTemplate = await ejs.renderFile(
      "dist/templates/serviceDown.ejs",
      {
        msg,
      }
    );

    const mailOptions = {
      from: `downtime@crygoca.co.uk`,
      to: ["ekoemmanueljavl@gmail.com", "downtime@crygoca.co.uk"],
      subject: "Crygoca Service Down",
      text: msg || "Currency conversion service is down",
      html: juice(responseTemplate),
    };

    sendMail(mailOptions)
      .then((response: any) => {
        resolve(console.log("Email sent successfully:", response));
      })
      .catch((error: any) => {
        reject(console.error("Failed to send email:", error));
      });
  });
};

function calculateAverageQuotes(providers: Provider[]): any {
  let totalRate = 0;
  let totalReceivedAmount = 0;
  let totalQuotes = 0;

  providers.forEach((provider) => {
    provider.quotes.forEach((quote) => {
      totalRate += quote.rate;
      totalReceivedAmount += quote.receivedAmount;
      totalQuotes++;
    });
  });

  const averageRate = totalRate / totalQuotes;
  const averageReceivedAmount = totalReceivedAmount / totalQuotes;

  // You can return averageRate or averageReceivedAmount, depending on your requirement
  return { averageRate, averageReceivedAmount };
}
