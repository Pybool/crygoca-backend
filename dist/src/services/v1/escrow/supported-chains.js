"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupportedChains = void 0;
const ENV = process.env.NODE_ENV; // dev or prod
var LiveSupportedChains;
(function (LiveSupportedChains) {
    LiveSupportedChains[LiveSupportedChains["ETHEREUM"] = 1] = "ETHEREUM";
    LiveSupportedChains[LiveSupportedChains["BSC"] = 56] = "BSC";
    LiveSupportedChains[LiveSupportedChains["POLYGON"] = 137] = "POLYGON";
    LiveSupportedChains[LiveSupportedChains["SOLANA"] = 101] = "SOLANA";
    LiveSupportedChains[LiveSupportedChains["TRON"] = 20] = "TRON";
})(LiveSupportedChains || (LiveSupportedChains = {}));
var DevSupportedChains;
(function (DevSupportedChains) {
    DevSupportedChains[DevSupportedChains["ETHEREUM"] = 11155111] = "ETHEREUM";
    DevSupportedChains[DevSupportedChains["BSC"] = 56] = "BSC";
    DevSupportedChains[DevSupportedChains["POLYGON"] = 137] = "POLYGON";
    DevSupportedChains[DevSupportedChains["SOLANA"] = 101] = "SOLANA";
    DevSupportedChains[DevSupportedChains["TRON"] = 20] = "TRON";
})(DevSupportedChains || (DevSupportedChains = {}));
const chains = {
    prod: LiveSupportedChains,
    dev: DevSupportedChains,
};
exports.SupportedChains = chains[ENV];
