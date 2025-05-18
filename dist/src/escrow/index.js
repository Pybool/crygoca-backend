"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startEscrowTransfersListeners = void 0;
const blockchain_service_1 = require("./services/blockchain.service");
const startEscrowTransfersListeners = () => {
    (0, blockchain_service_1.listenToERC20)();
    (0, blockchain_service_1.listenToETH)();
};
exports.startEscrowTransfersListeners = startEscrowTransfersListeners;
