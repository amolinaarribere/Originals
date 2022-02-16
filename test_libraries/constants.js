const BigNumber = require('bignumber.js');

const NewIssuerFee = new BigNumber("500");
const AdminNewIssuerFee = new BigNumber("250");
const MintingFee = new BigNumber("10");
const AdminMintingFee = new BigNumber("5");
const TransferFeeAmount = 55;
const TransferFeeDecimals = 1;
const AdminTransferFeeAmount = 1;
const AdminTransferFeeDecimals = 0;
const OffersLifeTime = 600;
const TotalTokenSupply = 1000;
const PropositionLifeTime = 604800;
const PropositionThreshold = 500;
const minToPropose = 50;
const Gas = 6721975;
const GasPrice = 10;
// Mock -----------
const MockName = "Mock DAI";
const MockSymbol = "MDA";
const MockSupply = new BigNumber("100000000000000000000000000");
// Mock -----------


exports.NewIssuerFee = NewIssuerFee;
exports.AdminNewIssuerFee = AdminNewIssuerFee;
exports.MintingFee = MintingFee;
exports.AdminMintingFee = AdminMintingFee;
exports.TransferFeeAmount = TransferFeeAmount;
exports.TransferFeeDecimals = TransferFeeDecimals;
exports.AdminTransferFeeAmount = AdminTransferFeeAmount;
exports.AdminTransferFeeDecimals = AdminTransferFeeDecimals;
exports.OffersLifeTime = OffersLifeTime;
exports.TotalTokenSupply = TotalTokenSupply;
exports.PropositionLifeTime = PropositionLifeTime;
exports.PropositionThreshold = PropositionThreshold;
exports.minToPropose = minToPropose;
exports.Gas = Gas;
exports.GasPrice = GasPrice;
// Mock -----------
exports.MockName = MockName;
exports.MockSymbol = MockSymbol;
exports.MockSupply = MockSupply;
// Mock -----------

