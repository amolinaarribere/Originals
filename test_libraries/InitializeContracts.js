const Manager = artifacts.require("Manager");
const AdminPiggyBank = artifacts.require("AdminPiggyBank");
const Treasury = artifacts.require("Treasury");
const PublicPool = artifacts.require("PublicPool");
const NFTMarket = artifacts.require("NFTMarket");
const OriginalsToken = artifacts.require("OriginalsToken");
const PropositionSettings = artifacts.require("PropositionSettings");
const TransparentUpgradeableProxy = artifacts.require("@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol");

const ManagerAbi = Manager.abi;
const TransparentUpgradeableProxyAbi = TransparentUpgradeableProxy.abi;

const constants = require("../test_libraries/constants.js");
const obj = require("../test_libraries/objects.js");

const NewIssuerFee = constants.NewIssuerFee;
const AdminNewIssuerFee = constants.AdminNewIssuerFee;
const MintingFee = constants.MintingFee;
const AdminMintingFee = constants.AdminMintingFee;
const TransferFeeAmount = constants.TransferFeeAmount;
const TransferFeeDecimals = constants.TransferFeeDecimals;
const AdminTransferFeeAmount = constants.AdminTransferFeeAmount;
const AdminTransferFeeDecimals = constants.AdminTransferFeeDecimals;
const OffersLifeTime = constants.OffersLifeTime;
const Prices = [NewIssuerFee, AdminNewIssuerFee, MintingFee, AdminMintingFee, TransferFeeAmount, TransferFeeDecimals, AdminTransferFeeAmount, AdminTransferFeeDecimals, OffersLifeTime ];

const PropositionLifeTime = constants.PropositionLifeTime;
const PropositionThreshold = constants.PropositionThreshold;
const minToPropose = constants.minToPropose;
const TotalTokenSupply = constants.TotalTokenSupply;
const Gas = constants.Gas;


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
const PropositionSettingsProxyInitializerMethod = {
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
const OriginalsTokenProxyInitializerMethod = {
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
const TreasuryProxyInitializerMethod = {
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
const PublicPoolProxyInitializerMethod = {
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
const AdminPiggyBankProxyInitializerMethod = {
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
    }
  ],
  "name": "AdminPiggyBank_init",
  "outputs": [],
  "stateMutability": "nonpayable",
  "type": "function"
};


async function InitializeContracts(chairPerson, PublicOwners, minOwners, user_1){
  let Manager = await Manager.new({from: chairPerson, gas: Gas});
  let ManagerProxyData = getProxyData(ManagerProxyInitializerMethod, [chairPerson]);

  // New
  let TransparentUpgradeableProxyIns = await TransparentUpgradeableProxy.new(Manager.address, chairPerson, ManagerProxyData, {from: chairPerson, gas: Gas});
  let ManagerProxyAddress = TransparentUpgradeableProxyIns.address;

  var ManagerProxy = new web3.eth.Contract(ManagerAbi, ManagerProxyAddress);
  var TransparentUpgradeableProxyInstance = new web3.eth.Contract(TransparentUpgradeableProxyAbi, ManagerProxyAddress);


  let ProxyAdmin = await ManagerProxy.methods.retrieveProxyAdmin().call({from: user_1});
  await TransparentUpgradeableProxyInstance.methods.changeAdmin(ProxyAdmin).send({from: chairPerson, gas: Gas});;

  let implementations = await deployImplementations(user_1);
  let ProxyData = returnProxyInitData(PublicOwners, minOwners, ManagerProxyAddress, chairPerson, implementations[8]);

  await ManagerProxy.methods.InitializeContracts(obj.returnUpgradeObject(implementations[0], implementations[1], implementations[2], implementations[3], implementations[4], implementations[5],
    ProxyData[0], ProxyData[1], ProxyData[2], ProxyData[3], ProxyData[4]),
    ManagerProxy._address).send({from: chairPerson, gas: Gas});

  let proxies = await retrieveProxies(ManagerProxy, user_1);
  
  return [ManagerProxy._address, proxies, implementations, ProxyAdmin, Manager.address];
}

async function deployImplementations(user_1){
    let manager = await Manager.new({from: user_1});
    let publicPool = await PublicPool.new({from: user_1});
    let treasury = await Treasury.new({from: user_1});
    let originalsToken = await OriginalsToken.new({from: user_1});
    let propositionSettings = await PropositionSettings.new({from: user_1});
    let adminPiggyBank = await AdminPiggyBank.new({from: user_1});
    let nFTMarket = await NFTMarket.new({from: user_1});


    return [publicPool.address, treasury.address, originalsToken.address, propositionSettings.address, adminPiggyBank.address, nFTMarket.address, manager.address];
}

async function retrieveProxies(Manager, user_1){
  let TransparentProxies = await Manager.methods.retrieveTransparentProxies().call({from: user_1});

  let i = 1;
  let publicPoolProxy = TransparentProxies[i];
  i++;
  let treasuryProxy = TransparentProxies[i];
  i++;
  let originalsTokenProxy = TransparentProxies[i];
  i++;
  let propositionSettingsProxy = TransparentProxies[i];
  i++;
  let adminPiggyBank = TransparentProxies[i];

  return [publicPoolProxy, treasuryProxy, originalsTokenProxy, propositionSettingsProxy, adminPiggyBank];
}

function getProxyData(method, parameters){
  return web3.eth.abi.encodeFunctionCall(method, parameters);
}

function returnProxyInitData(PublicOwners, minOwners, Manager, chairPerson, mockChainLinkFeedRegistry){
  let PublicPoolProxyData = getProxyData(PublicPoolProxyInitializerMethod, [PublicOwners, minOwners, Manager]);
  let TreasuryProxyData = getProxyData(TreasuryProxyInitializerMethod, [Prices, Manager, chairPerson]);
  let OriginalsProxyData = getProxyData(OriginalsTokenProxyInitializerMethod, ["Originals Token for Test", "ORI", TotalTokenSupply, Manager, 0, chairPerson]);
  let PropositionSettingsProxyData = getProxyData(PropositionSettingsProxyInitializerMethod, [Manager, chairPerson, PropositionLifeTime, PropositionThreshold, minToPropose]);
  let AdminPiggyBankProxyData = getProxyData(AdminPiggyBankProxyInitializerMethod, [PublicOwners, minOwners]);

  return [PublicPoolProxyData, TreasuryProxyData, OriginalsProxyData, PropositionSettingsProxyData, AdminPiggyBankProxyData];
}


exports.InitializeContracts = InitializeContracts;
exports.deployImplementations = deployImplementations;
exports.returnProxyInitData = returnProxyInitData;