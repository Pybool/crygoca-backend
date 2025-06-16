"use strict";
require("@nomiclabs/hardhat-ethers");
require("dotenv").config();
module.exports = {
    solidity: {
        version: "0.8.20",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },
    networks: {
        sepolia: {
            url: `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`,
            accounts: [process.env.RELAYER_PRIVATE_KEY],
        },
        mainnet: {
            url: `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
            accounts: [process.env.RELAYER_PRIVATE_KEY],
        },
    }
};
