"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendDevMail = exports.fetchRates = void 0;
const cheerio = require("cheerio");
const rp = require("request-promise");
const ejs_1 = __importDefault(require("ejs"));
const cache_1 = require("../../../middlewares/cache");
const mailtrigger_1 = __importDefault(require("../mail/mailtrigger"));
const juice_1 = __importDefault(require("juice"));
const memCache = new cache_1.Cache();
const fetchRates = async (url, isTask = false) => {
    return new Promise((resolve, reject) => {
        // if (memCache.get("live-currencies") && !isTask) {
        //   resolve(memCache.get("live-currencies"));
        // } else {
        rp(url)
            .then(function (response) {
            const dom = response; //.data;
            const $ = cheerio.load(dom);
            // Select only the first table element using `eq(0)`:
            const firstTable = $("table").eq(0);
            // If you need the table body rows from the first table:
            const pairRows = firstTable.find("tbody tr");
            const results = [];
            for (const pairRow of pairRows) {
                // console.log(
                //   "NSME ",
                //   $(pairRow).find("td:nth-child(2)").find("span.text-ellipsis").text()
                // );
                const rate = {
                    name: $(pairRow).find("td:nth-child(2)").find("span.text-ellipsis").text() || "",
                    bid: $(pairRow).find("td:nth-child(3)").find("span").text(),
                    ask: $(pairRow).find("td:nth-child(4)").find("span").text(),
                    high: $(pairRow).find("td:nth-child(5)").text(),
                    low: $(pairRow).find("td:nth-child(6)").text(),
                    change: $(pairRow).find("td:nth-child(7)").text() || "",
                    percentChange: $(pairRow).find("td:nth-child(8)").text() || "",
                    symbol: $(pairRow).find('td[aria-label="Symbol"]').find("a")?.text() ||
                        "",
                };
                results.push(rate);
            }
            if (results[0].name === "") {
                (0, exports.sendDevMail)("Crygoca live exchange rates service seems to be having problems at the moment");
            }
            const _response = {
                status: true,
                data: results,
            };
            memCache.set("live-currencies", _response, 120);
            resolve(_response);
        })
            .catch((error) => {
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
exports.fetchRates = fetchRates;
const sendDevMail = (msg = null) => {
    return new Promise(async (resolve, reject) => {
        const responseTemplate = await ejs_1.default.renderFile("dist/templates/serviceDown.ejs", {
            msg
        });
        const mailOptions = {
            from: `downtime@crygoca.co.uk`,
            to: ['ekoemmanueljavl@gmail.com', 'downtime@crygoca.co.uk'],
            subject: "Crygoca Service Down",
            text: msg || 'Exchange rate service is down',
            html: (0, juice_1.default)(responseTemplate),
        };
        (0, mailtrigger_1.default)(mailOptions)
            .then((response) => {
            resolve(console.log("Email sent successfully:", response));
        })
            .catch((error) => {
            reject(console.error("Failed to send email:", error));
        });
    });
};
exports.sendDevMail = sendDevMail;
