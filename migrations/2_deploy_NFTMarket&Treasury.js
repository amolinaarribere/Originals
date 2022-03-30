

let Treasury = artifacts.require("./MainContracts/Treasury");
let NFTMarket = artifacts.require("./MainContracts/NFTMarket");

//Mock


let Library = artifacts.require("./Libraries/Library");
let UintLibrary = artifacts.require("./Libraries/UintLibrary");
let ItemsLibrary = artifacts.require("./Libraries/ItemsLibrary");




module.exports = async function(deployer, network, accounts){

// NFT Market -----------------------------------------------------------------------------------------------------------------------------------------------------------------
await deployer.link(Library, NFTMarket);
console.log("Library linked to NFTMarket");

await deployer.link(UintLibrary, NFTMarket);
console.log("UintLibrary linked to NFTMarket");

await deployer.link(ItemsLibrary, NFTMarket);
console.log("Items Library linked to NFTMarket");

await deployer.deploy(NFTMarket);
NFTMarketInstance = await NFTMarket.deployed();
console.log("NFTMarket deployed : " + NFTMarketInstance.address);

  
  // Treasury -----------------------------------------------------------------------------------------------------------------------------------------------------------------
  await deployer.link(Library, Treasury);
  console.log("Library linked to Treasury");

  await deployer.link(UintLibrary, Treasury);
  console.log("UintLibrary linked to Treasury");

  await deployer.link(ItemsLibrary, Treasury);
  console.log("ItemsLibrary linked to Treasury");

  await deployer.deploy(Treasury);
  TreasuryInstance = await Treasury.deployed();
  console.log("Treasury deployed : " + TreasuryInstance.address);

  console.log(" ----------------------------------------------- ");

  console.log("NFT Market Implementation Address : " + NFTMarketInstance.address);
  console.log("Treasury Address : " + TreasuryInstance.address);


}