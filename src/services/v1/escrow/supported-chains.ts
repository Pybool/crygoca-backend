const ENV = process.env.NODE_ENV!; // dev or prod

enum LiveSupportedChains { //Live
  ETHEREUM = 1,
  BSC = 56,
  POLYGON = 137,
  SOLANA = 101,
  TRON = 20, //NOT Valid Chain for tron
}

enum DevSupportedChains { //Testnet
  ETHEREUM = 11155111,
  BSC = 56,
  POLYGON = 137,
  SOLANA = 101,
  TRON = 20, //NOT Valid Chain for tron
}

const chains: any = {
  prod: LiveSupportedChains,
  dev: DevSupportedChains,
};

export const SupportedChains = chains[ENV];
