const BigNumber = require('bignumber.js');

const NewIssuerFee = new BigNumber("100000000000000000000");
const AdminNewIssuerFee = new BigNumber("50000000000000000000");
const MintingFee = new BigNumber("10000000000000000000");
const AdminMintingFee = new BigNumber("5000000000000000000");
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
const MockName1 = "Mock USD";
const MockSymbol1 = "USD";
const MockSupply1 = new BigNumber("100000000000000000000000000");
const MockName2 = "Mock EUR";
const MockSymbol2 = "EUR";
const MockSupply2 = new BigNumber("100000000000000000000000000");
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
exports.MockName1 = MockName1;
exports.MockSymbol1 = MockSymbol1;
exports.MockSupply1 = MockSupply1;
exports.MockName2 = MockName2;
exports.MockSymbol2 = MockSymbol2;
exports.MockSupply2 = MockSupply2;
// Mock -----------

