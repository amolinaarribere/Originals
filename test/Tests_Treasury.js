// Chai library for testing
// ERROR tests = First we test the error message then we test the action was not carried out
const BigNumber = require('bignumber.js');

const init = require("../test_libraries/InitializeContracts.js");
const constants = require("../test_libraries/constants.js");
const proposition = require("../test_libraries/Propositions.js");
const aux = require("../test_libraries/auxiliaries.js");

const Treasury = artifacts.require("Treasury");
var TreasuryAbi = Treasury.abi;
const OriginalsToken = artifacts.require("OriginalsToken");
var OriginalsTokenAbi = OriginalsToken.abi;
const MockDai = artifacts.require("MockDai");
const MockDaiAbi = MockDai.abi;

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


const Gas = constants.Gas;
const GasPrice = constants.GasPrice;


// TEST -------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------

contract("Testing Treasury",function(accounts){
    var manager;
    var originalsTokenProxy;
    var TreasuryProxy;
    var mockdai;
    var paymentsProxyAddress;
    // used addresses
    const chairPerson = accounts[0];
    const PublicOwners = [accounts[1], accounts[2], accounts[3]];
    const minOwners = 2;
    const user_1 = accounts[6];
    const tokenOwner = [accounts[7], accounts[8], accounts[9], accounts[1], accounts[2]];
    // test constants
    const NotEnoughBalance = new RegExp("EC20-");

    var PropositionValues = [aux.IntToBytes32(10),
        aux.IntToBytes32(9),
        aux.IntToBytes32(8),
        aux.IntToBytes32(7),
        aux.IntToBytes32(25),
        aux.IntToBytes32(1),
        aux.IntToBytes32(3),
        aux.IntToBytes32(0),
        aux.IntToBytes32(600)];


    beforeEach(async function(){
        let contracts = await init.InitializeContracts(chairPerson, PublicOwners, minOwners, user_1);
        manager = contracts[0];
        TreasuryProxy = new web3.eth.Contract(TreasuryAbi, contracts[1][1]);
        originalsTokenProxy = new web3.eth.Contract(OriginalsTokenAbi, contracts[1][2]);
        paymentsProxyAddress = contracts[1][5];
        mockdai = new web3.eth.Contract(MockDaiAbi, contracts[2][7]);
    });

/*
    // ****** TESTING Price Config ***************************************************************** //
    it("Retrieve Proposals Details",async function(){
        // act
        await proposition.Check_Proposition_Details(TreasuryProxy, originalsTokenProxy, chairPerson, tokenOwner, user_1, PropositionValues);
    });

    it("Vote/Propose/cancel Price Configuration WRONG",async function(){
        await proposition.Config_Treasury_Wrong(TreasuryProxy, originalsTokenProxy, tokenOwner, user_1, chairPerson, PropositionValues);
    });

    it("Vote/Propose/cancel Price Configuration CORRECT",async function(){
        await proposition.Config_Treasury_Correct(TreasuryProxy, originalsTokenProxy, tokenOwner, user_1, chairPerson, PropositionValues);
    });

    it("Votes Reassignment Treasury",async function(){
        await proposition.Check_Votes_Reassignment(TreasuryProxy, originalsTokenProxy, chairPerson, tokenOwner, user_1, PropositionValues);
    });

    // ****** TESTING Withdraws ***************************************************************** //

    it("Withdraw WRONG",async function(){
        // act
        try{
            await TreasuryProxy.methods.withdraw(1).send({from: user_1,  gas: Gas}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(NotEnoughBalance);
        }
    });
*/
    it("Withdraw CORRECT",async function(){
        // act
        let amount = new BigNumber("3000000000000000000");
        let first_withdraw = new BigNumber("1000000000000000000");
        await mockdai.methods.transfer(TreasuryProxy._address, amount).send({from: user_1, gas: Gas}, function(error, result){});

        // assert
        let TreasuryBalance = new BigNumber(await mockdai.methods.balanceOf(TreasuryProxy._address).call());
        let UserBalance_1 = new BigNumber(await mockdai.methods.balanceOf(chairPerson).call());
        let AggregatedAmount = new BigNumber(await TreasuryProxy.methods.retrieveAggregatedAmount().call());
        expect(amount.toString()).to.be.equal(TreasuryBalance.toString());
        expect("0").to.be.equal(UserBalance_1.toString());
        expect(amount.toString()).to.be.equal(AggregatedAmount.toString());

        await TreasuryProxy.methods.withdraw(first_withdraw).send({from: chairPerson, gas: Gas}, function(error, result){});
        TreasuryBalance = new BigNumber(await mockdai.methods.balanceOf(TreasuryProxy._address).call());
        let UserBalance_2 = new BigNumber(await mockdai.methods.balanceOf(chairPerson).call());
        AggregatedAmount = new BigNumber(await TreasuryProxy.methods.retrieveAggregatedAmount().call());
        expect(amount.minus(first_withdraw).toString()).to.be.equal(TreasuryBalance.toString());
        expect(first_withdraw.toString()).to.be.equal(UserBalance_2.toString());
        expect(amount.toString()).to.be.equal(AggregatedAmount.toString());

        await TreasuryProxy.methods.withdrawAll().send({from: chairPerson,  gas: Gas}, function(error, result){});
        TreasuryBalance = new BigNumber(await mockdai.methods.balanceOf(TreasuryProxy._address).call());
        let UserBalance_3 = new BigNumber(await mockdai.methods.balanceOf(chairPerson).call());
        AggregatedAmount = new BigNumber(await TreasuryProxy.methods.retrieveAggregatedAmount().call());
        expect("0").to.be.equal(TreasuryBalance.toString());
        expect(amount.toString()).to.be.equal(UserBalance_3.toString());
        expect(amount.toString()).to.be.equal(AggregatedAmount.toString());
    });


});
