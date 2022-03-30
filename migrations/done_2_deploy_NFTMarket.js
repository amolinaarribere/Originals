const BigNumber = require('bignumber.js');

let NFTMarket = artifacts.require("./MainContracts/NFTMarket");

//Mock


const obj = require("../test_libraries/objects.js");

let Library = artifacts.require("./Libraries/Library");
let UintLibrary = artifacts.require("./Libraries/UintLibrary");
let ItemsLibrary = artifacts.require("./Libraries/ItemsLibrary");






module.exports = async function(deployer, network, accounts){
  //let TokenContractAddress = await ExternalRegistries.GetTokenContractAddress(network, deployer, MockDai, MockName, MockSymbol, MockSupply, accounts[0]);
  
  //const PublicOwners = [accounts[0]];

  // Libraries -----------------------------------------------------------------------------------------------------------------------------------------------------------------
  /*await deployer.deploy(Library);
  LibraryInstance = await Library.deployed();
  console.log("Library deployed");

  await deployer.deploy(UintLibrary);
  UintLibraryInstance = await UintLibrary.deployed();
  console.log("UintLibrary deployed");

  await deployer.deploy(AddressLibrary);
  AddressLibraryInstance = await AddressLibrary.deployed();
  console.log("AddressLibrary deployed");

  await deployer.link(Library, ItemsLibrary);
  console.log("Library linked to Items Library");

  await deployer.link(UintLibrary, ItemsLibrary);
  console.log("Uint Library linked to Items Library");

  await deployer.deploy(ItemsLibrary);
  ItemsLibraryInstance = await ItemsLibrary.deployed();
  console.log("ItemsLibrary deployed");*/


  
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


  // -----------------------------------------------------------------------------------------------------------------------------------------------------------------


 console.log("NFT Market Implementation Address : " + NFTMarketInstance.address);

}