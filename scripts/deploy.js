const { ethers } = require("hardhat");
const hre = require("hardhat");
const fs = require("fs");


async function main() {
  //get the signer that we will use to deploy
  const [deployer] = await ethers.getSigners();
  const balance = await deployer.getBalance();
  //get the NFTMarketplace smart contract object and deploy it
  const Marketplace = await hre.ethers.getContractFactory("NFTMarketplace");
  const marketplace = await Marketplace.deploy();

  await marketplace.deployed();

  console.log("Contract deployed to address:", marketplace.address);

  //Pull the address and ABI out while you deploy, since that will be key in interacting with the smart contract later
  const data = {
    address: marketplace.address,
    abi: JSON.parse(marketplace.interface.format('json'))
  }

  //This writes the ABI and address to the mktplace.json
  fs.writeFileSync('./src/Marketplace.json', JSON.stringify(data))
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
