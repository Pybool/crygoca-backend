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
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = require("dotenv");
const logger_1 = __importDefault(require("./logger"));
// import { appendCryptoToListings } from './services/v2/onboardCrypto';
// import { insertLogos, onBoardCryptos } from "./services/v2/onboardCrypto";
(0, dotenv_1.config)();
(0, dotenv_1.config)({ path: `.env.${process.env.NODE_ENV}` });
const mongouri = process.env.CRYGOCA_MONGODB_URI;
logger_1.default.info("MONGO_URI: " + mongouri);
logger_1.default.info("DATABASE NAME " + process.env.CRYGOCA_DATABASE_NAME);
mongoose_1.default
    .connect(mongouri, {
    dbName: process.env.CRYGOCA_DATABASE_NAME,
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info('MongoDB connected Successfully.');
    // const result1 = await onBoardCryptos()
    // console.log(result1)
    // const result2 = await insertLogos()
    // console.log(result2)
    // const result3 = await appendCryptoToListings();
    // console.log(result3)
}))
    .catch((err) => logger_1.default.info(err.message));
mongoose_1.default.connection.on('connected', () => {
    logger_1.default.info('Mongoose connected to db');
});
mongoose_1.default.connection.on('error', (err) => {
    logger_1.default.info(err.message);
});
mongoose_1.default.connection.on('disconnected', () => {
    logger_1.default.info('Mongoose connection is disconnected');
});
process.on('SIGINT', () => __awaiter(void 0, void 0, void 0, function* () {
    yield mongoose_1.default.connection.close();
    process.exit(0);
}));
