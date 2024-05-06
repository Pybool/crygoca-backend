import axios from "axios";
import { JSDOM } from "jsdom";
import { Cache } from "../../middlewares/cache";
const memCache = new Cache();

export const fetchRates = async (url: string) => {
  return new Promise((resolve: any, reject: any) => {
    console.log("Cache ", memCache.get("live-currencies"));

    if (memCache.get("live-currencies")) {
      resolve(memCache.get("live-currencies"));
    } else {
      axios
        .get(url)
        .then((response) => {
          const dom = new JSDOM(response.data);
          const pairRows = dom.window.document.querySelectorAll(
            "#yfin-list table tbody tr"
          );
          const results: {
            name: string;
            price: number;
            change: string;
            percentChange: string;
            symbol: string;
          }[] = [];

          pairRows.forEach((pairRow: any) => {
            const rate = {
              name:
                pairRow.querySelector('td[aria-label="Name"]')?.textContent ||
                "",
              price: parseFloat(
                (
                  pairRow.querySelector('td[aria-label="Last Price"]')
                    ?.textContent || ""
                ).replaceAll(",", "")
              ),
              change:
                pairRow.querySelector('td[aria-label="Change"]')?.textContent ||
                "",
              percentChange:
                pairRow.querySelector('td[aria-label="% Change"]')
                  ?.textContent || "",
              symbol:
                  pairRow.querySelector('td[aria-label="Symbol"]').querySelector('a')
                    ?.textContent || ""
            };
            results.push(rate);
          });
          const _response: { status: boolean; data: any } = {
            status: true,
            data: results,
          };

          memCache.set("live-currencies", _response, 6000);
          resolve(_response);
        })
        .catch((error) => {
          resolve({
            status: false,
            data: null,
            error: error,
          });
        });
    }
  });
};
