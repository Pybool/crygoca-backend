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
exports.appendCryptoToListings = exports.insertLogos = exports.onBoardCryptos = void 0;
// Import the JSON file
const cryptocurrencies_model_1 = __importDefault(require("../../models/cryptocurrencies.model"));
const saleListing_model_1 = __importDefault(require("../../models/saleListing.model"));
const cryptolist_json_1 = __importDefault(require("./cryptolist.json"));
const legacycrypto_1 = require("./legacycrypto");
const onBoardCryptos = () => __awaiter(void 0, void 0, void 0, function* () {
    const cryptodata = cryptolist_json_1.default;
    console.log("Data count ", cryptodata.data.length);
    for (let crypto of cryptodata["data"]) {
        const payload = {
            cryptoId: crypto.id,
            name: crypto.name,
            logo: null,
            symbol: crypto.symbol,
            slug: crypto.slug,
            tags: crypto.tags.join(","),
            platform: (crypto === null || crypto === void 0 ? void 0 : crypto.platform) || null,
            crygocaSupported: false,
            dateAdded: crypto.date_added,
            createdAt: new Date()
        };
        yield cryptocurrencies_model_1.default.create(payload);
    }
    return {
        status: true,
        message: "Done importing cryptocurrencies",
        code: 200
    };
});
exports.onBoardCryptos = onBoardCryptos;
const insertLogos = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const cryptodata = legacycrypto_1.legacyCrypto;
    for (let crypto of cryptodata) {
        const cryptocurrency = yield cryptocurrencies_model_1.default.findOne({ symbol: crypto.symbol });
        if (cryptocurrency) {
            if (!cryptocurrency.logo) {
                cryptocurrency.logo = crypto.img_url
                    .replace("https://raw.githubusercontent.com/ErikThiart/cryptocurrency-icons/master", "https://be.crygoca.co.uk");
                yield cryptocurrency.save();
            }
        }
        else {
            const payload = {
                cryptoId: (crypto === null || crypto === void 0 ? void 0 : crypto.id) || null,
                name: crypto.name,
                logo: crypto.img_url.replace("https://raw.githubusercontent.com/ErikThiart/cryptocurrency-icons/master", "https://be.crygoca.co.uk"),
                symbol: crypto === null || crypto === void 0 ? void 0 : crypto.symbol,
                slug: crypto === null || crypto === void 0 ? void 0 : crypto.slug,
                tags: ((_a = crypto === null || crypto === void 0 ? void 0 : crypto.tags) === null || _a === void 0 ? void 0 : _a.join(",")) || "",
                platform: (crypto === null || crypto === void 0 ? void 0 : crypto.platform) || null,
                crygocaSupported: false,
                dateAdded: (crypto === null || crypto === void 0 ? void 0 : crypto.date_added) || new Date(),
                createdAt: new Date()
            };
            yield cryptocurrencies_model_1.default.create(payload);
        }
    }
    return {
        status: true,
        message: "Done Filling Logos",
        code: 200
    };
});
exports.insertLogos = insertLogos;
const appendCryptoToListings = () => __awaiter(void 0, void 0, void 0, function* () {
    const listings = yield saleListing_model_1.default.find({});
    for (let listing of listings) {
        const _crypto = yield cryptocurrencies_model_1.default.findOne({ symbol: listing.cryptoCode });
        if (_crypto) {
            listing.cryptoCurrency = _crypto._id;
            yield listing.save();
        }
    }
    return {
        status: true,
        message: "Done Filling Listings With crypto ID",
        code: 200
    };
});
exports.appendCryptoToListings = appendCryptoToListings;
