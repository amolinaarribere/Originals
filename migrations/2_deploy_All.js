const BigNumber = require('bignumber.js');

let Manager = artifacts.require("./DeployedContracts/Manager");
let Treasury = artifacts.require("./DeployedContracts/Treasury");
let PublicPool = artifacts.require("./DeployedContracts/PublicPool");
let NFTMarket = artifacts.require("./DeployedContracts/NFTMarket");
let OriginalsToken = artifacts.require("./DeployedContracts/OriginalsToken");
let PropositionSettings = artifacts.require("./DeployedContracts/PropositionSettings");
let AdminPiggyBank = artifacts.require("./DeployedContracts/AdminPiggyBank");
let Payments = artifacts.require("./DeployedContracts/Payments");
let TransparentUpgradeableProxy = artifacts.require("@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol")

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
const NewIssuerFee = new BigNumber("500000000000000000");
const AdminNewIssuerFee = new BigNumber("250000000000000000");
const MintingFee = new BigNumber("100000000000000000");
const AdminMintingFee = new BigNumber("50000000000000000");
const TransferFeeAmount = 55;
const TransferFeeDecimals = 1;
const AdminTransferFeeAmount = 1;
const AdminTransferFeeDecimals = 0;
const OffersLifeTime = 600;
const Prices = [NewIssuerFee, AdminNewIssuerFee, MintingFee, AdminMintingFee, TransferFeeAmount, TransferFeeDecimals, AdminTransferFeeAmount, AdminTransferFeeDecimals, OffersLifeTime ];

const PublicMinOwners = 1;

module.exports = async function(deployer, network, accounts){
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

  var ManagerProxyInitializerMethod = {
    "inputs": [
      {
        "internalType": "address",
        "name": "chairPerson",
        "type": "address"
      }
    ],
    "name": "Manager_init",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  };

  var ManagerProxyInitializerParameters = [accounts[0]];
  var ManagerProxyData = web3.eth.abi.encodeFunctionCall(ManagerProxyInitializerMethod, ManagerProxyInitializerParameters);

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
  await TransparentUpgradeableProxyInstance.methods.changeAdmin(ProxyAdmin).send({from: accounts[0], gas: Gas});;

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

  var AdminPiggyBankProxyInitializerMethod = {
    "inputs": [
      {
        "internalType": "address[]",
        "name": "owners",
        "type": "address[]"
      },
      {
        "internalType": "uint256",
        "name": "minOwners",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "managerContractAddress",
        "type": "address"
      }
    ],
    "name": "AdminPiggyBank_init",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  };

  var AdminPiggyBankProxyInitializerParameters = [PublicOwners, PublicMinOwners, ManagerProxyAddress];
  var AdminPiggyBankProxyData = web3.eth.abi.encodeFunctionCall(AdminPiggyBankProxyInitializerMethod, AdminPiggyBankProxyInitializerParameters);

  
  // Proposition Settings -----------------------------------------------------------------------------------------------------------------------------------------------------------------
  await deployer.link(Library, PropositionSettings);
  console.log("Library linked to Proposition Settings");

  await deployer.link(UintLibrary, PropositionSettings);
  console.log("UintLibrary linked to Proposition Settings");

  await deployer.deploy(PropositionSettings);
  PropositionSettingsInstance = await PropositionSettings.deployed();
  console.log("PropositionSettings deployed : " + PropositionSettingsInstance.address);

  var PropositionSettingsProxyInitializerMethod = {
    "inputs": [
      {
        "internalType": "address",
        "name": "managerContractAddress",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "chairPerson",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "PropositionLifeTime",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "PropositionThreshold",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "minToPropose",
        "type": "uint256"
      }
    ],
    "name": "PropositionSettings_init",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  };

  var PropositionSettingsProxyInitializerParameters = [ManagerProxyAddress, accounts[0], PropositionLifeTime, PropositionThreshold, minToPropose];
  var PropositionSettingsProxyData = web3.eth.abi.encodeFunctionCall(PropositionSettingsProxyInitializerMethod, PropositionSettingsProxyInitializerParameters);

  // Originals Token -----------------------------------------------------------------------------------------------------------------------------------------------------------------
  await deployer.link(Library, OriginalsToken);
  console.log("Library linked to OriginalsToken");

  await deployer.link(AddressLibrary, OriginalsToken);
  console.log("AddressLibrary linked to OriginalsToken");

  await deployer.deploy(OriginalsToken);
  OriginalsTokenInstance = await OriginalsToken.deployed();
  console.log("OriginalsToken deployed : " + OriginalsTokenInstance.address);

  var OriginalsTokenProxyInitializerMethod = {
    "inputs": [
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "symbol",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "MaxSupply",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "managerContractAddress",
        "type": "address"
      },
      {
        "internalType": "uint8",
        "name": "decimalsValue",
        "type": "uint8"
      },
      {
        "internalType": "address",
        "name": "initialOwner",
        "type": "address"
      }
    ],
    "name": "OriginalsToken_init",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  };

  var OriginalsTokenProxyInitializerParameters = [TokenName, TokenSymbol, TokenSupply, ManagerProxyAddress, TokenDecimals, accounts[0]];
  var OriginalsProxyData = web3.eth.abi.encodeFunctionCall(OriginalsTokenProxyInitializerMethod, OriginalsTokenProxyInitializerParameters);

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

  var TreasuryProxyInitializerMethod = {
  "inputs": [
    {
      "internalType": "uint256[]",
      "name": "Prices",
      "type": "uint256[]"
    },
    {
      "internalType": "address",
      "name": "managerContractAddress",
      "type": "address"
    },
    {
      "internalType": "address",
      "name": "chairPerson",
      "type": "address"
    }
  ],
  "name": "Treasury_init",
  "outputs": [],
  "stateMutability": "nonpayable",
  "type": "function"
  };

  var TreasuryProxyInitializerParameters = [Prices, ManagerProxyAddress, accounts[0]];
  var TreasuryProxyData = web3.eth.abi.encodeFunctionCall(TreasuryProxyInitializerMethod, TreasuryProxyInitializerParameters);

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

  var PublicPoolProxyInitializerMethod = {
    "inputs": [
      {
        "internalType": "address[]",
        "name": "owners",
        "type": "address[]"
      },
      {
        "internalType": "uint256",
        "name": "minOwners",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "managerContractAddress",
        "type": "address"
      }
    ],
    "name": "PublicPool_init",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  };
  var PublicPoolProxyInitializerParameters = [PublicOwners, PublicMinOwners, ManagerProxyAddress];
  var PublicPoolProxyData = web3.eth.abi.encodeFunctionCall(PublicPoolProxyInitializerMethod, PublicPoolProxyInitializerParameters);
  
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

 var PaymentsProxyInitializerMethod = {
  "inputs": [
    {
      "internalType": "address",
      "name": "managerContractAddress",
      "type": "address"
    },
    {
      "internalType": "address",
      "name": "chairPerson",
      "type": "address"
    },
    {
      "internalType": "address",
      "name": "tokenAddress",
      "type": "address"
    }
  ],
  "name": "Payments_init",
  "outputs": [],
  "stateMutability": "nonpayable",
  "type": "function"
};
 var PaymentsProxyInitializerParameters = [ManagerProxyAddress, accounts[0], !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!];
 var PaymentsProxyData = web3.eth.abi.encodeFunctionCall(PaymentsProxyInitializerMethod, PaymentsProxyInitializerParameters);
 

 await ManagerProxyInstance.methods.InitializeContracts(
  obj.returnUpgradeObject(PublicPoolInstance.address,
      TreasuryInstance.address,
      OriginalsTokenInstance.address, 
      PropositionSettingsInstance.address,
      AdminPiggyBankInstance.address,
      NFTMarketInstance.address, 
      PublicPoolProxyData, 
      TreasuryProxyData, 
      OriginalsProxyData, 
      PropositionSettingsProxyData, 
      AdminPiggyBankProxyData),
      ManagerProxyAddress).send({from: accounts[0], gas: Gas});

  console.log("Manager initialized");

  let TransparentProxies = await ManagerProxyInstance.methods.retrieveTransparentProxies().call();
  let TransparentImpl = await ManagerProxyInstance.methods.retrieveTransparentProxiesImpl().call();
  let Beacons = await ManagerProxyInstance.methods.retrieveBeacons().call();
  let BeaconsImpl = await ManagerProxyInstance.methods.retrieveBeaconsImpl().call();
  let init = await ManagerProxyInstance.methods.isInitialized().call();

  console.log("Deployment Summary ----------------------------------------------- ");

  console.log("Libraries ******* ");

  console.log("Library Address : " + LibraryInstance.address);
  console.log("UintLibrary Address : " + UintLibraryInstance.address);
  console.log("AddressLibrary Address : " + AddressLibraryInstance.address);
  console.log("ItemsLibrary Address : " + ItemsLibraryInstance.address);

  console.log("Contracts ******* ");

  console.log("Proxy Admin Address : " + ProxyAdmin);

  let i=0;
  console.log("Manager Proxy Address : " + TransparentProxies[i]);
  console.log("Manager Address : " + TransparentImpl[i++] + " is iniitalized : " + init);

  console.log("Public Pool Proxy Address : " + TransparentProxies[i]);
  console.log("Public Pool Address : " + TransparentImpl[i++]);

  console.log("Treasury Proxy Address : " + TransparentProxies[i]);
  console.log("Treasury Address : " + TransparentImpl[i++]);

  console.log("Originals Proxy Address : " + TransparentProxies[i]);
  console.log("Originals Address : " + TransparentImpl[i++]);

  console.log("Proposition Settings Proxy Address : " + TransparentProxies[i]);
  console.log("Proposition Settings Address : " + TransparentImpl[i++]);

  console.log("AdminPiggyBank Proxy Address : " + TransparentProxies[i]);
  console.log("AdminPiggyBank Address : " + TransparentImpl[i++]);


  let j=0;
  console.log("NFT Market Beacon Address : " + Beacons[j]);
  console.log("NFT Market Implementation Address : " + BeaconsImpl[j++]);

  console.log(" ----------------------------------------------- ");

}