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


module.exports = async function(deployer, network, accounts){  

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


  // Manager -----------------------------------------------------------------------------------------------------------------------------------------------------------------
  await deployer.link(Library, Manager);
  console.log("Library linked to Manager");

  await deployer.link(AddressLibrary, Manager);
  console.log("AddressLibrary linked to Manager");

  await deployer.link(UintLibrary, Manager);
  console.log("UintLibrary linked to Manager");

  await deployer.deploy(Manager);
  ManagerInstance = await Manager.deployed();
  console.log("Manager deployed : " + ManagerInstance.address);

  /*
  // Deploy Certificate Proxy and attach it to the impl ("accounts[0]" is the admin) : ManagerProxyAddress
  // initialize Certificate Main contract (so that ProxyAdmin gets created), 
  await deployer.deploy(TransparentUpgradeableProxy, ManagerInstance.address, accounts[0], ManagerProxyData);
  TransparentUpgradeableProxyIns = await TransparentUpgradeableProxy.deployed();
  var ManagerProxyAddress = TransparentUpgradeableProxyIns.address;
  console.log("Manager Proxy deployed : " + ManagerProxyAddress);

  // Initialize Contract Manager
  var TransparentUpgradeableProxyInstance = new web3.eth.Contract(TransparentUpgradeableProxyAbi, ManagerProxyAddress);
  var ManagerProxyInstance = new web3.eth.Contract(ManagerAbi, ManagerProxyAddress);

  // retrieve the ProxyAdmin from Certificate
  let ProxyAdmin = await ManagerProxyInstance.methods.retrieveProxyAdmin().call({from: accounts[1]});
  // assign the Certificate Proxy (deployed in step 1) admin rights from "user1" to the retrieved ProxyAdmin (step 3)
  await TransparentUpgradeableProxyInstance.methods.changeAdmin(ProxyAdmin).send({from: accounts[0], gas: Gas});;*/

  // AdminPiggyBank -----------------------------------------------------------------------------------------------------------------------------------------------------------------
  await deployer.link(Library, AdminPiggyBank);
  console.log("Library linked to AdminPiggyBank");

  await deployer.link(UintLibrary, AdminPiggyBank);
  console.log("UintLibrary linked to AdminPiggyBank");

  await deployer.link(AddressLibrary, AdminPiggyBank);
  console.log("AddressLibrary linked to AdminPiggyBank");

  await deployer.link(ItemsLibrary, AdminPiggyBank);
  console.log("ItemsLibrary linked to AdminPiggyBank");

  await deployer.deploy(AdminPiggyBank);
  AdminPiggyBankInstance = await AdminPiggyBank.deployed();
  console.log("AdminPiggyBank deployed : " + AdminPiggyBankInstance.address);
  
  // Proposition Settings -----------------------------------------------------------------------------------------------------------------------------------------------------------------
  await deployer.link(Library, PropositionSettings);
  console.log("Library linked to Proposition Settings");

  await deployer.link(UintLibrary, PropositionSettings);
  console.log("UintLibrary linked to Proposition Settings");

  await deployer.deploy(PropositionSettings);
  PropositionSettingsInstance = await PropositionSettings.deployed();
  console.log("PropositionSettings deployed : " + PropositionSettingsInstance.address);

  // Originals Token -----------------------------------------------------------------------------------------------------------------------------------------------------------------
  await deployer.link(Library, OriginalsToken);
  console.log("Library linked to OriginalsToken");

  await deployer.link(AddressLibrary, OriginalsToken);
  console.log("AddressLibrary linked to OriginalsToken");

  await deployer.deploy(OriginalsToken);
  OriginalsTokenInstance = await OriginalsToken.deployed();
  console.log("OriginalsToken deployed : " + OriginalsTokenInstance.address);

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

  // Public Pool -----------------------------------------------------------------------------------------------------------------------------------------------------------------
  await deployer.link(Library, PublicPool);
  console.log("Library linked to PublicPool");

  await deployer.link(UintLibrary, PublicPool);
  console.log("Uint Library linked to PublicPool");

  await deployer.link(AddressLibrary, PublicPool);
  console.log("AddressLibrary linked to PublicPool");

  await deployer.link(ItemsLibrary, PublicPool);
  console.log("Items Library linked to PublicPool");

  await deployer.deploy(PublicPool);
  PublicPoolInstance = await PublicPool.deployed();
  console.log("PublicPool deployed : " + PublicPoolInstance.address);
  
 // Payment -----------------------------------------------------------------------------------------------------------------------------------------------------------------
 await deployer.link(Library, Payments);
 console.log("Library linked to Payments");

 await deployer.link(UintLibrary, Payments);
 console.log("Uint Library linked to Payments");

 await deployer.link(AddressLibrary, Payments);
 console.log("AddressLibrary linked to Payments");

 await deployer.deploy(Payments);
 PaymentsInstance = await Payments.deployed();
 console.log("Payments deployed : " + PaymentsInstance.address);
 
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
 

  console.log("Deployment Summary ----------------------------------------------- ");

  console.log("Libraries ******* ");

  console.log("Library Address : " + LibraryInstance.address);
  console.log("UintLibrary Address : " + UintLibraryInstance.address);
  console.log("AddressLibrary Address : " + AddressLibraryInstance.address);
  console.log("ItemsLibrary Address : " + ItemsLibraryInstance.address);

  console.log("Contracts ******* ");

  console.log("Manager Address : " + ManagerInstance.address);

  console.log("Public Pool Address : " + PublicPoolInstance.address);

  console.log("Treasury Address : " + TreasuryInstance.address);

  console.log("Originals Address : " + OriginalsTokenInstance.address);

  console.log("Proposition Settings Address : " + PropositionSettingsInstance.address);

  console.log("AdminPiggyBank Address : " + AdminPiggyBankInstance.address);

  console.log("Payments Address : " + PaymentsInstance.address);

  console.log("Markets Credits Address : " + MarketsCreditsInstance.address);

  console.log("NFT Market Implementation Address : " + NFTMarketInstance.address);

  console.log(" ----------------------------------------------- ");

}