const cheerio = require("cheerio");
const rp = require("request-promise");
import ejs from "ejs";
import { Cache } from "../../../middlewares/cache";
import sendMail from "../mail/mailtrigger";
import juice from "juice";
const memCache = new Cache();

export const fetchRates = async (url: string, isTask = false) => {
  return new Promise((resolve: any, reject: any) => {
    // if (memCache.get("live-currencies") && !isTask) {
    //   resolve(memCache.get("live-currencies"));
    // } else {
    rp(url)
      .then(function (response: { data: any }) {
        const dom = response; //.data;
        const $ = cheerio.load(dom);
        // Select only the first table element using `eq(0)`:
        const firstTable = $("table").eq(0);

        // If you need the table body rows from the first table:
        const pairRows = firstTable.find("tbody tr");
        const results: {
          name: string;
          bid: number;
          ask: number;
          high: number;
          low: number;
          change: string;
          percentChange: string;
          symbol: string;
        }[] = [];
        for (const pairRow of pairRows) {
          // console.log(
          //   "NSME ",
          //   $(pairRow).find("td:nth-child(2)").find("span.text-ellipsis").text()
          // );
          const rate = {
            name: $(pairRow).find("td:nth-child(2)").find("span.text-ellipsis").text()|| "",
            bid: $(pairRow).find("td:nth-child(3)").find("span").text(),
            ask: $(pairRow).find("td:nth-child(4)").find("span").text(),
            high: $(pairRow).find("td:nth-child(5)").text(),
            low: $(pairRow).find("td:nth-child(6)").text(),
            change: $(pairRow).find("td:nth-child(7)").text() || "",
            percentChange:$(pairRow).find("td:nth-child(8)").text() || "",
            symbol:
              $(pairRow).find('td[aria-label="Symbol"]')!.find("a")?.text() ||
              "",
          };
          results.push(rate);
        }
        if(results[0].name === ""){
          sendDevMail("Crygoca live exchange rates service seems to be having problems at the moment")
        }
        const _response: { status: boolean; data: any } = {
          status: true,
          data: results,
        };

        memCache.set("live-currencies", _response, 120);
        resolve(_response);
      })
      .catch((error: any) => {
        console.log(error);
        resolve({
          status: false,
          data: null,
          error: error,
        });
      });
    // }
  });
};


export const sendDevMail = (msg:any= null) => {
  return new Promise(async (resolve: any, reject: any) => {
    const responseTemplate = await ejs.renderFile(
      "dist/templates/serviceDown.ejs",
      {
        msg
      }
    );

    const mailOptions = {
      from: `downtime@crygoca.co.uk`,
      to: ['ekoemmanueljavl@gmail.com', 'downtime@crygoca.co.uk'],
      subject: "Crygoca Service Down",
      text: msg || 'Exchange rate service is down',
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