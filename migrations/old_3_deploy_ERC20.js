const BigNumber = require('bignumber.js');
let ExternalRegistries = require("./ExternalRegistries.js");

let MockDai = artifacts.require("./Mock/MockDai");

const MockNameEUR = "Mock Dai EUR";
const MockSymbolEUR = "EUR";
const MockSupplyEUR = new BigNumber("1000000000000000000000000000");

const MockNameCHF = "Mock Dai CHF";
const MockSymbolCHF = "CHF";
const MockSupplyCHF = new BigNumber("1000000000000000000000000000");

const MockNameUSD = "Mock Dai USD";
const MockSymbolUSD = "USD";
const MockSupplyUSD = new BigNumber("1000000000000000000000000000");

module.exports = async function(deployer, network, accounts){
    await ExternalRegistries.GetTokenContractAddress(network, deployer, MockDai, MockNameEUR, MockSymbolEUR, MockSupplyEUR, accounts[0]);
    await ExternalRegistries.GetTokenContractAddress(network, deployer, MockDai, MockNameCHF, MockSymbolCHF, MockSupplyCHF, accounts[0]);
    await ExternalRegistries.GetTokenContractAddress(network, deployer, MockDai, MockNameUSD, MockSymbolUSD, MockSupplyUSD, accounts[0]);
}