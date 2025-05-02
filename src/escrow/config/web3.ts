// web3 config placeholder
// import Web3 from 'web3';
// import dotenv from 'dotenv';

// dotenv.config();
// const web3 = new Web3(new Web3.providers.WebsocketProvider(process.env.INFURA_WSS!));
  
import Web3 from 'web3';
import dotenv from 'dotenv';

dotenv.config();

const INFURA_WSS = process.env.INFURA_WSS!;
const RECONNECT_INTERVAL = 5000;

let web3: Web3;
let provider: any;
let reconnecting = false;

function createWeb3() {
  provider = new Web3.providers.WebsocketProvider(INFURA_WSS);

  provider.on('connect', () => {
    console.log('[Web3] Connected to Infura WebSocket');
    reconnecting = false;
  });

  provider.on('error', (err:any) => {
    console.error('[Web3] WebSocket error', err);
    if (!reconnecting) reconnectWeb3();
  });

  provider.on('end', () => {
    console.warn('[Web3] WebSocket disconnected');
    if (!reconnecting) reconnectWeb3();
  });

  web3 = new Web3(provider);
  return web3;
}

async function reconnectWeb3() {
  reconnecting = true;

  // Clean up old provider listeners
  if (provider) {
    provider?.removeAllListeners();
    provider = null as any;
  }

  while (reconnecting) {
    try {
      console.log('[Web3] Attempting reconnection...');
      createWeb3();

      // If no error is thrown, break the loop
      reconnecting = false;
    } catch (err) {
      console.error('[Web3] Reconnection failed:', err);
      await new Promise((res) => setTimeout(res, RECONNECT_INTERVAL));
    }
  }
}

// Initialize
web3 = createWeb3();

export default web3;



// banana involve canoe simple visa pluck absent danger speed physical danger casino