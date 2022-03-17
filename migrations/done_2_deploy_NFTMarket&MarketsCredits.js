const BigNumber = require('bignumber.js');
let ExternalRegistries = require("./ExternalRegistries.js");

let Manager = artifacts.require("./MainContracts/Manager");
let Treasury = artifacts.require("./MainContracts/Treasury");
let PublicPool = artifacts.require("./MainContracts/PublicPool");
let NFTMarket = artifacts.require("./MainContracts/NFTMarket");
let OriginalsToken = artifacts.require("./MainContracts/OriginalsToken");
let PropositionSettings = artifacts.require("./MainContracts/PropositionSettings");
let AdminPiggyBank = artifacts.require("./MainContracts/AdminPiggyBank");
let Payments = artifacts.require("./MainContracts/Payments");
let MarketsCredits = artifacts.require("./MainContracts/MarketsCredits");
let TransparentUpgradeableProxy = artifacts.require("@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol")

//Mock
let MockDai = artifacts.require("./Mock/MockDai");
const MockName = "Mock Dai";
const MockSymbol = "MDA";
const MockSupply = new BigNumber("1000000000000000000000000000");

const ManagerAbi = Manager.abi;
const TransparentUpgradeableProxyAbi = TransparentUpgradeableProxy.abi;

const obj = require("../test_libraries/objects.js");

let Library = artifacts.require("./Libraries/Library");
let UintLibrary = artifacts.require("./Libraries/UintLibrary");
let AddressLibrary = artifacts.require("./Libraries/AddressLibrary");
let ItemsLibrary = artifacts.require("./Libraries/ItemsLibrary");

const Gas = 6721975;
const PropositionLifeTime = 604800;
const PropositionThreshold = 50000000;
const minToPropose = 5000000;
const TokenName = "OriginalsToken";
const TokenSymbol = "ORI";
const TokenSupply = 100000000;
const TokenDecimals = 0;
const NewIssuerFee = new BigNumber("100000000000000000000").toString();
const AdminNewIssuerFee = new BigNumber("50000000000000000000").toString();
const MintingFee = new BigNumber("1000000000000000000").toString();
const AdminMintingFee = new BigNumber("500000000000000000").toString();
const TransferFeeAmount = 55;
const TransferFeeDecimals = 1;
const AdminTransferFeeAmount = 1;
const AdminTransferFeeDecimals = 0;
const OffersLifeTime = 600;
const Fees = [NewIssuerFee, AdminNewIssuerFee, MintingFee, AdminMintingFee];
const AllFees = [Fees];
const TransferFees = [TransferFeeAmount, TransferFeeDecimals, AdminTransferFeeAmount, AdminTransferFeeDecimals];
const OfferSettings = [OffersLifeTime]
const PublicMinOwners = 1;

module.exports = async function(deployer, network, accounts){
  let TokenContractAddress = await ExternalRegistries.GetTokenContractAddress(network, deployer, MockDai, MockName, MockSymbol, MockSupply, accounts[0]);
  
  const PublicOwners = [accounts[0]];

  // Libraries -----------------------------------------------------------------------------------------------------------------------------------------------------------------
  await deployer.deploy(Library);
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
  console.log("ItemsLibrary deployed");


  
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


   // Markets Credits -----------------------------------------------------------------------------------------------------------------------------------------------------------------
 await deployer.link(Library, MarketsCredits);
 console.log("Library linked to MarketsCredits");

 await deployer.link(UintLibrary, MarketsCredits);
 console.log("Uint Library linked to MarketsCredits");

 await deployer.link(AddressLibrary, MarketsCredits);
 console.log("AddressLibrary linked to MarketsCredits");

 await deployer.link(ItemsLibrary, MarketsCredits);
 console.log("Items Library linked to MarketsCredits");

 await deployer.deploy(MarketsCredits);
 MarketsCreditsInstance = await MarketsCredits.deployed();
 console.log("MarketsCredits deployed : " + MarketsCreditsInstance.address);


  // -----------------------------------------------------------------------------------------------------------------------------------------------------------------


 console.log("Markets Credits Address : " + MarketsCreditsInstance.address);
 console.log("NFT Market Implementation Address : " + NFTMarketInstance.address);

}