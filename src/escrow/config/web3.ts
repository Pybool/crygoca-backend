// web3 config placeholder
import Web3 from 'web3';
import dotenv from 'dotenv';

dotenv.config();
console.log("process.env.INFURA_WSS! ", process.env.INFURA_WSS!)
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
  
const web3 = new Web3(new Web3.providers.WebsocketProvider(process.env.INFURA_WSS!));
  
export default web3;



// banana involve canoe simple visa pluck absent danger speed physical danger casino