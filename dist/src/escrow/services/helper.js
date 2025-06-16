"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChainId = void 0;
const tokens_config_1 = require("../config/tokens.config");
const getChainId = (tokenAddress) => {
    const token = tokens_config_1.ERC20_TOKENS.find((token) => token.address.toLowerCase() === tokenAddress.toLowerCase());
    return token ? token.chainId : null;
};
exports.getChainId = getChainId;
