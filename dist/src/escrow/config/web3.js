"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const web3_1 = __importDefault(require("web3"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const INFURA_WSS = process.env.INFURA_WSS;
const RECONNECT_INTERVAL = 5000;
let web3;
let provider;
let reconnecting = false;
function createWeb3() {
    try {
        provider = new web3_1.default.providers.WebsocketProvider(INFURA_WSS);
        provider.on('connect', () => {
            console.log('[Web3] Connected to Infura WebSocket');
            reconnecting = false;
        });
        provider.on('error', (err) => {
            console.error('[Web3] WebSocket error', err);
            // if (!reconnecting) reconnectWeb3().catch(console.error);
        });
        provider.on('end', () => {
            console.warn('[Web3] WebSocket disconnected');
            // if (!reconnecting) reconnectWeb3().catch(console.error);
        });
        web3 = new web3_1.default(provider);
        return web3;
    }
    catch (err) {
        console.error('[Web3] Failed to create Web3 instance:', err);
        // throw err;
        return null;
    }
}
async function reconnectWeb3() {
    reconnecting = true;
    try {
        // Clean up old provider listeners
        if (provider) {
            try {
                provider?.removeAllListeners();
            }
            catch (cleanupErr) {
                console.warn('[Web3] Error cleaning up old listeners:', cleanupErr);
            }
            provider = null;
        }
        while (reconnecting) {
            try {
                console.log('[Web3] Attempting reconnection...');
                createWeb3();
                reconnecting = false;
            }
            catch (err) {
                console.error('[Web3] Reconnection failed:', err);
                await new Promise((res) => setTimeout(res, RECONNECT_INTERVAL));
            }
        }
    }
    catch (err) {
        console.error('[Web3] Unexpected error during reconnection:', err);
    }
}
// Initialize
try {
    web3 = createWeb3();
}
catch (err) {
    console.error('[Web3] Initialization failed:', err);
}
exports.default = web3;
// banana involve canoe simple visa pluck absent danger speed physical danger casino
