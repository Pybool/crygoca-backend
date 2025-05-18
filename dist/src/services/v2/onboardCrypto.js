"use strict";
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
const onBoardCryptos = async () => {
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
            platform: crypto?.platform || null,
            crygocaSupported: false,
            dateAdded: crypto.date_added,
            createdAt: new Date()
        };
        await cryptocurrencies_model_1.default.create(payload);
    }
    return {
        status: true,
        message: "Done importing cryptocurrencies",
        code: 200
    };
};
exports.onBoardCryptos = onBoardCryptos;
const insertLogos = async () => {
    const cryptodata = legacycrypto_1.legacyCrypto;
    for (let crypto of cryptodata) {
        const cryptocurrency = await cryptocurrencies_model_1.default.findOne({ symbol: crypto.symbol });
        if (cryptocurrency) {
            if (!cryptocurrency.logo) {
                cryptocurrency.logo = crypto.img_url
                    .replace("https://raw.githubusercontent.com/ErikThiart/cryptocurrency-icons/master", "https://be.crygoca.co.uk");
                await cryptocurrency.save();
            }
        }
        else {
            const payload = {
                cryptoId: crypto?.id || null,
                name: crypto.name,
                logo: crypto.img_url.replace("https://raw.githubusercontent.com/ErikThiart/cryptocurrency-icons/master", "https://be.crygoca.co.uk"),
                symbol: crypto?.symbol,
                slug: crypto?.slug,
                tags: crypto?.tags?.join(",") || "",
                platform: crypto?.platform || null,
                crygocaSupported: false,
                dateAdded: crypto?.date_added || new Date(),
                createdAt: new Date()
            };
            await cryptocurrencies_model_1.default.create(payload);
        }
    }
    return {
        status: true,
        message: "Done Filling Logos",
        code: 200
    };
};
exports.insertLogos = insertLogos;
const appendCryptoToListings = async () => {
    const listings = await saleListing_model_1.default.find({});
    for (let listing of listings) {
        const _crypto = await cryptocurrencies_model_1.default.findOne({ symbol: listing.cryptoCode });
        if (_crypto) {
            listing.cryptoCurrency = _crypto._id;
            await listing.save();
        }
    }
    return {
        status: true,
        message: "Done Filling Listings With crypto ID",
        code: 200
    };
};
exports.appendCryptoToListings = appendCryptoToListings;
