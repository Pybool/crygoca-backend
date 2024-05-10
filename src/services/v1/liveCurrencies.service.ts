const cheerio = require("cheerio");
const rp = require("request-promise");
import { Cache } from "../../middlewares/cache";
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
          const pairRows = $("#yfin-list table tbody tr", dom);
          const results: {
            name: string;
            price: number;
            change: string;
            percentChange: string;
            symbol: string;
          }[] = [];
          for (const pairRow of pairRows) {
            const rate = {
              name: $(pairRow).find('td[aria-label="Name"]')?.text() || "",
              price: parseFloat(
                (
                  $(pairRow).find('td[aria-label="Last Price"]')?.text() || ""
                ).replaceAll(",", "")
              ),
              change: $(pairRow).find('td[aria-label="Change"]')?.text() || "",
              percentChange:
                $(pairRow).find('td[aria-label="% Change"]')?.text() || "",
              symbol:
                $(pairRow).find('td[aria-label="Symbol"]')!.find("a")?.text() ||
                "",
            };
            console.log(rate)
            results.push(rate);
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
