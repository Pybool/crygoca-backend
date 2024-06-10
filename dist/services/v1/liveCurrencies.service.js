"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchRates = void 0;
const cheerio = require("cheerio");
const rp = require("request-promise");
const ejs_1 = __importDefault(require("ejs"));
const cache_1 = require("../../middlewares/cache");
const mailtrigger_1 = __importDefault(require("./mailtrigger"));
const juice_1 = __importDefault(require("juice"));
const memCache = new cache_1.Cache();
const fetchRates = (url_1, ...args_1) => __awaiter(void 0, [url_1, ...args_1], void 0, function* (url, isTask = false) {
    return new Promise((resolve, reject) => {
        // if (memCache.get("live-currencies") && !isTask) {
        //   resolve(memCache.get("live-currencies"));
        // } else {
        rp(url)
            .then(function (response) {
            var _a;
            const dom = response; //.data;
            const $ = cheerio.load(dom);
            // Select only the first table element using `eq(0)`:
            const firstTable = $("table").eq(0);
            // If you need the table body rows from the first table:
            const pairRows = firstTable.find("tbody tr");
            const results = [];
            for (const pairRow of pairRows) {
                console.log("NSME ", $(pairRow).find("td:nth-child(2)").find("span.text-ellipsis").text());
                const rate = {
                    name: $(pairRow).find("td:nth-child(2)").find("span.text-ellipsis").text() || "",
                    bid: $(pairRow).find("td:nth-child(3)").find("span").text(),
                    ask: $(pairRow).find("td:nth-child(4)").find("span").text(),
                    high: $(pairRow).find("td:nth-child(5)").text(),
                    low: $(pairRow).find("td:nth-child(6)").text(),
                    change: $(pairRow).find("td:nth-child(7)").text() || "",
                    percentChange: $(pairRow).find("td:nth-child(8)").text() || "",
                    symbol: ((_a = $(pairRow).find('td[aria-label="Symbol"]').find("a")) === null || _a === void 0 ? void 0 : _a.text()) ||
                        "",
                };
                results.push(rate);
            }
            if (results[0].name === "") {
                sendDevMail("Crygoca live exchange rates service seems to be having problems at the moment");
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
});
exports.fetchRates = fetchRates;
const sendDevMail = (msg = null) => {
    return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
        const responseTemplate = yield ejs_1.default.renderFile("dist/templates/serviceDown.ejs", {
            msg
        });
        const mailOptions = {
            from: `info@crygoca.com`,
            to: ['ekoemmanueljavl@gmail.com', 'tayeoyelekan@gmail.com'],
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
    }));
};
