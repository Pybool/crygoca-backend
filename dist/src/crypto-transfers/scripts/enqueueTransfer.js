"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ERC20Transfer = exports.EthereumNetworkTransfer = void 0;
const queues_1 = require("../bullmq/queues");
async function EthereumNetworkTransfer(type, transferPayload) {
    await queues_1.transferQueue.add(type, transferPayload);
}
exports.EthereumNetworkTransfer = EthereumNetworkTransfer;
async function ERC20Transfer(type, transferPayload) {
    await queues_1.transferQueue.add(type, transferPayload);
}
exports.ERC20Transfer = ERC20Transfer;
