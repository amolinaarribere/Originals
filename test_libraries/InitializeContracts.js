const Manager = artifacts.require("Manager");
const AdminPiggyBank = artifacts.require("AdminPiggyBank");
const Treasury = artifacts.require("Treasury");
const PublicPool = artifacts.require("PublicPool");
const NFTMarket = artifacts.require("NFTMarket");
const OriginalsToken = artifacts.require("OriginalsToken");
const PropositionSettings = artifacts.require("PropositionSettings");
const Payments = artifacts.require("Payments");
const MarketsCredits = artifacts.require("MarketsCredits");
const TransparentUpgradeableProxy = artifacts.require("@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol");

const ManagerAbi = Manager.abi;
const TransparentUpgradeableProxyAbi = TransparentUpgradeableProxy.abi;

// Mock -------------
const MockDai = artifacts.require("MockDai"); // Mock
// Mock -------------


const constants = require("../test_libraries/constants.js");
const obj = require("../test_libraries/objects.js");

const NewIssuerFee1 = constants.NewIssuerFee1;
const AdminNewIssuerFee1 = constants.AdminNewIssuerFee1;
const MintingFee1 = constants.MintingFee1;
const AdminMintingFee1 = constants.AdminMintingFee1;
const NewIssuerFee2 = constants.NewIssuerFee2;
const AdminNewIssuerFee2 = constants.AdminNewIssuerFee2;
const MintingFee2 = constants.MintingFee2;
const AdminMintingFee2 = constants.AdminMintingFee2;
const TransferFeeAmount = constants.TransferFeeAmount;
const TransferFeeDecimals = constants.TransferFeeDecimals;
const AdminTransferFeeAmount = constants.AdminTransferFeeAmount;
const AdminTransferFeeDecimals = constants.AdminTransferFeeDecimals;
const OffersLifeTime = constants.OffersLifeTime;
// Mock -------------
const MockName1 = constants.MockName1;
const MockSymbol1 = constants.MockSymbol1;
const MockSupply1 = constants.MockSupply1;
const MockName2 = constants.MockName2;
const MockSymbol2 = constants.MockSymbol2;
const MockSupply2 = constants.MockSupply2;
// Mock -------------
const Fees1 = [NewIssuerFee1.toString(), AdminNewIssuerFee1.toString(), MintingFee1.toString(), AdminMintingFee1.toString()];
const Fees2 = [NewIssuerFee2.toString(), AdminNewIssuerFee2.toString(), MintingFee2.toString(), AdminMintingFee2.toString()];
const AllFees = [Fees1, Fees2];
const TransferFees = [TransferFeeAmount, TransferFeeDecimals, AdminTransferFeeAmount, AdminTransferFeeDecimals];
const OfferSettings = [OffersLifeTime]

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
      "internalType": "uint256[][]",
      "name": "Fees",
      "type": "uint256[][]"
    },
    {
      "internalType": "uint256[]",
      "name": "TransferFees",
      "type": "uint256[]"
    },
    {
      "internalType": "uint256[]",
      "name": "OfferSettings",
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
const PaymentsProxyInitializerMethod = {
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
      "internalType": "address[]",
      "name": "tokenAddresses",
      "type": "address[]"
    }
  ],
  "name": "Payments_init",
  "outputs": [],
  "stateMutability": "nonpayable",
  "type": "function"
};
const MarketsCreditsProxyInitializerMethod = {
  "inputs": [
    {
      "internalType": "address",
      "name": "managerContractAddress",
      "type": "address"
    }
  ],
  "name": "MarketsCredits_init",
  "outputs": [],
  "stateMutability": "nonpayable",
  "type": "function"
};


async function InitializeContracts(chairPerson, PublicOwners, minOwners, user_1){
  let manager = await Manager.new({from: chairPerson, gas: Gas});
  let ManagerProxyData = getProxyData(ManagerProxyInitializerMethod, [chairPerson]);

  // New
  let TransparentUpgradeableProxyIns = await TransparentUpgradeableProxy.new(manager.address, chairPerson, ManagerProxyData, {from: chairPerson, gas: Gas});
  let ManagerProxyAddress = TransparentUpgradeableProxyIns.address;

  var ManagerProxy = new web3.eth.Contract(ManagerAbi, ManagerProxyAddress);
  var TransparentUpgradeableProxyInstance = new web3.eth.Contract(TransparentUpgradeableProxyAbi, ManagerProxyAddress);

  let ProxyAdmin = await ManagerProxy.methods.retrieveProxyAdmin().call({from: user_1});
  await TransparentUpgradeableProxyInstance.methods.changeAdmin(ProxyAdmin).send({from: chairPerson, gas: Gas});;

  let implementations = await deployImplementations(user_1);

  let ProxyData = returnProxyInitData(PublicOwners, minOwners, ManagerProxyAddress, chairPerson, [implementations[9], implementations[10]]);

  await ManagerProxy.methods.InitializeContracts(obj.returnUpgradeObject(
    [implementations[0], implementations[1], implementations[2], implementations[3], implementations[4], implementations[6], implementations[7]],
    [implementations[5]],
    ProxyData),
    ManagerProxy._address).send({from: chairPerson, gas: Gas});

  let proxies = await retrieveProxies(ManagerProxy, user_1);

  return [ManagerProxy._address, proxies, implementations, ProxyAdmin, manager.address];
}

async function deployImplementations(user_1){
    let manager = await Manager.new({from: user_1});
    let publicPool = await PublicPool.new({from: user_1});
    let treasury = await Treasury.new({from: user_1});
    let originalsToken = await OriginalsToken.new({from: user_1});
    let propositionSettings = await PropositionSettings.new({from: user_1});
    let adminPiggyBank = await AdminPiggyBank.new({from: user_1});
    let nFTMarket = await NFTMarket.new({from: user_1});
    let payments = await Payments.new({from: user_1});
    let marketsCredits = await MarketsCredits.new({from: user_1});
    // Mock ---------------
    let mockDai1 = await MockDai.new(MockName1, MockSymbol1, MockSupply1, user_1, {from: user_1});
    let mockDai2 = await MockDai.new(MockName2, MockSymbol2, MockSupply2, user_1, {from: user_1});
    // Mock ---------------

    return [publicPool.address, treasury.address, originalsToken.address, propositionSettings.address, adminPiggyBank.address, nFTMarket.address, payments.address, marketsCredits.address, manager.address, mockDai1.address, mockDai2.address];
}

async function retrieveProxies(manager, user_1){
  let TransparentProxies = await manager.methods.retrieveTransparentProxies().call({from: user_1});

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
  i++;
  let payments = TransparentProxies[i];
  i++;
  let marketsCredits = TransparentProxies[i];

  return [publicPoolProxy, treasuryProxy, originalsTokenProxy, propositionSettingsProxy, adminPiggyBank, payments, marketsCredits];
}

function getProxyData(method, parameters){
  return web3.eth.abi.encodeFunctionCall(method, parameters);
}

function returnProxyInitData(PublicOwners, minOwners, manager, chairPerson, tokenAddresses){
  let PublicPoolProxyData = getProxyData(PublicPoolProxyInitializerMethod, [PublicOwners, minOwners, manager]);
  let TreasuryProxyData = getProxyData(TreasuryProxyInitializerMethod, [AllFees, TransferFees, OfferSettings, manager, chairPerson]);
  let OriginalsProxyData = getProxyData(OriginalsTokenProxyInitializerMethod, ["Originals Token for Test", "ORI", TotalTokenSupply, manager, 0, chairPerson]);
  let PropositionSettingsProxyData = getProxyData(PropositionSettingsProxyInitializerMethod, [manager, chairPerson, PropositionLifeTime, PropositionThreshold, minToPropose]);
  let AdminPiggyBankProxyData = getProxyData(AdminPiggyBankProxyInitializerMethod, [PublicOwners, minOwners, manager]);
  let PaymentsProxyData = getProxyData(PaymentsProxyInitializerMethod, [manager, chairPerson, tokenAddresses]);
  let MarketsCreditsProxyData = getProxyData(MarketsCreditsProxyInitializerMethod, [manager]);

  return [PublicPoolProxyData, TreasuryProxyData, OriginalsProxyData, PropositionSettingsProxyData, AdminPiggyBankProxyData, PaymentsProxyData, MarketsCreditsProxyData];
}


exports.InitializeContracts = InitializeContracts;
exports.deployImplementations = deployImplementations;
exports.returnProxyInitData = returnProxyInitData;