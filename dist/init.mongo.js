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
// import logger from './logger';
(0, dotenv_1.config)();
// const uri = `mongodb+srv://ekoemmanueljavl:${process.env.MONGODB_PASSWORD}@cluster0.n8o8vva.mongodb.net/?retryWrites=true&w=majority`;
const mongouri = `mongodb+srv://10111011qweQWE:10111011qweQWE@all4one.fgxnfw3.mongodb.net/?retryWrites=true&w=majority&appName=All4One` || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
console.log(process.env.DB_NAME, mongouri);
mongoose_1.default
    .connect(mongouri, {
    dbName: 'CRYGOCA',
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => {
    console.log('MongoDB connected Successfully.');
})
    .catch((err) => console.log(err.message));
mongoose_1.default.connection.on('connected', () => {
    console.log('Mongoose connected to db');
});
mongoose_1.default.connection.on('error', (err) => {
    console.log(err.message);
});
mongoose_1.default.connection.on('disconnected', () => {
    console.log('Mongoose connection is disconnected');
});
process.on('SIGINT', () => __awaiter(void 0, void 0, void 0, function* () {
    yield mongoose_1.default.connection.close();
    process.exit(0);
}));
