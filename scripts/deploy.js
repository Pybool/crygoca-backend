const hre = require("hardhat");

async function main() {
  const ERC20MetaTransfer = await hre.ethers.getContractFactory("ERC20MetaTransfer");
  const contract = await ERC20MetaTransfer.deploy();
  await contract.deployed();

  console.log("✅ Contract deployed to:", contract.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


// npx hardhat run scripts/deploy.js --network sepolia

