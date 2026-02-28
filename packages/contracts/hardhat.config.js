require("@nomicfoundation/hardhat-toolbox");
require("dotenv/config");

const { PRIVATE_KEY, BASE_SEPOLIA_RPC_URL } = process.env;

module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      evmVersion: "cancun",
    },
  },
  networks: {
    baseSepolia: {
      url: BASE_SEPOLIA_RPC_URL || "",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },
};
