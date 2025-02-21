const axios = require("axios");
import { getCountryNameByCode } from "../../../helpers/countries";
import { getCountryCurrencyByCountryCode } from "../../../helpers/currenciesCountryCodes";
// https://api.transferwise.com/v3/comparisons/?sendAmount=1000&sourceCurrency=CAD&targetCurrency=USD
import "./liveCurrencies.service";
import geoip from "geoip-lite"; // Import geoip-lite library
import { config as dotenvConfig } from "dotenv";
import ejs from "ejs";
import juice from "juice";
import sendMail from "../mail/mailtrigger";
import { Cache } from "../../../middlewares/cache";
dotenvConfig({ path: `.env` });

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
    const countryCode = geoData?.country;
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
      from: from?.toUpperCase(),
      to: to?.toUpperCase(),
      currencyFrom: currencyFrom?.toUpperCase(),
      currencyTo: currencyTo?.toUpperCase(),
      amount: parseInt(amount) || 1,
      maxAge: 0,
    };
    const url = `https://api.currencyapi.com/v3/latest?apikey=${
      process.env.CURRENCYAPI_APP_ID ||
      "cur_live_d52M3q2XMNDurG4Q7kHtSr3P5iqTsNWpUtF5kcNx"
      }&base_currency=${data.currencyFrom}&currencies=${data.currencyTo}&amount=${
      data.amount
    }`;

    console.log("process.env.MOCK_EXCHANGE_RATE==='true'", process.env.MOCK_EXCHANGE_RATE)

    if(process.env.MOCK_EXCHANGE_RATE==='true'){
      let value = 0.00
      if(data.currencyFrom=='USD' && data.currencyTo=='GHS'){
        value = 15.30
      }
      if(data.currencyFrom=='GHS' && data.currencyTo=='USD'){
        value = 0.065
      }
      if(data.currencyFrom=='USD' && data.currencyTo=='ZAR'){
        value = 18.50
      }
      if(data.currencyFrom=='ZAR' && data.currencyTo=='USD'){
        value = 0.054
      }
      if(data.currencyFrom=='GHS' && data.currencyTo=='ZAR'){
        value = 1.20
      }
      if(data.currencyFrom=='ZAR' && data.currencyTo=='GHS'){
        value = 0.83
      }

      return {status: true, data:{
        "meta": {
          "last_updated_at": "2025-01-29T12:59:59Z"
        },
        "data": {
          [data.currencyTo]: {
            "code": data.currencyTo,
            "value": value
          }
        }
      }}
    }

    console.log("URL ", url);
    const cacheData = await memCache.get(url);
    if (cacheData) {
      console.log("Fetching conversion from cache", cacheData);
      return cacheData;
    } else {
      const response = await axios.get(url);
      if (response.status) {
        let responseData: any = response.data;
        memCache.set(url, { status: true, data: responseData }, 14400);
        console.log("Exchange rate ",{ status: true, data: responseData })
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
      downtimeCounter.convert = 0;
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
