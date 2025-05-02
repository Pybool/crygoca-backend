"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// web3 config placeholder
const web3_1 = __importDefault(require("web3"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
console.log("process.env.INFURA_WSS! ", process.env.INFURA_WSS);
// const web3 = new Web3(new Web3.providers.WebsocketProvider(process.env.INFURA_WSS!));
// const web3 = new Web3(process.env.INFURA_WSS!);
const options = {
    reconnect: {
        auto: true,
        delay: 5000, // 5 seconds between reconnect attempts
        maxAttempts: 5,
        onTimeout: false
    }
};
const web3 = new web3_1.default(new web3_1.default.providers.WebsocketProvider(process.env.INFURA_WSS));
exports.default = web3;
// banana involve canoe simple visa pluck absent danger speed physical danger casino
