// Chai library for testing
// ERROR tests = First we test the error message then we test the action was not carried out
const BigNumber = require('bignumber.js');

const pool_common = require("../test_libraries/Pools.js");
const init = require("../test_libraries/InitializeContracts.js");
const constants = require("../test_libraries/constants.js");
const proposition = require("../test_libraries/Propositions.js");
const aux = require("../test_libraries/auxiliaries.js");

const CertificatesPoolManager = artifacts.require("CertificatesPoolManager");
const PublicCertificates = artifacts.require("PublicCertificatesPool");
var PublicCertificatesAbi = PublicCertificates.abi;
const Treasury = artifacts.require("Treasury");
var TreasuryAbi = Treasury.abi;
const CertisToken = artifacts.require("CertisToken");
var CertisTokenAbi = CertisToken.abi;
const UintLibrary = artifacts.require("./Libraries/UintLibrary");

const FactorUSDtoETH = Math.pow(10, 18 + constants.decimals - 2) / constants.rate;
const PublicPriceWei = constants.PublicPriceUSD * FactorUSDtoETH;
const PrivatePriceWei = constants.PrivatePriceUSD * FactorUSDtoETH;
const ProviderPriceWei = constants.ProviderPriceUSD * FactorUSDtoETH;
const CertificatePriceWei = constants.CertificatePriceUSD * FactorUSDtoETH;
const OwnerRefundPriceWei = constants.OwnerRefundPriceUSD * FactorUSDtoETH;

const PublicPriceUSD = constants.PublicPriceUSD;
const PrivatePriceUSD = constants.PrivatePriceUSD;
const ProviderPriceUSD = constants.ProviderPriceUSD;
const CertificatePriceUSD = constants.CertificatePriceUSD ;
const OwnerRefundPriceUSD = constants.OwnerRefundPriceUSD ;

const Gas = constants.Gas;

// TEST -------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------

contract("Testing Treasury",function(accounts){
    var certPoolManager;
    var certisTokenProxy;
    var publicCertPool;
    var Treasury;
    // used addresses
    const chairPerson = accounts[0];
    const PublicOwners = [accounts[1], accounts[2], accounts[3]];
    const minOwners = 2;
    const provider_1 = accounts[4]; 
    const provider_2 = accounts[5];
    const user_1 = accounts[6];
    const tokenOwner = [accounts[7], accounts[8], accounts[9], accounts[1], accounts[2]];
    // providers info
    const provider_1_Info = "Provider 1 Info";
    const provider_2_Info = "Provider 2 Info";
    // owner info
    const extra_owner_Info = "Extra Owner";
    // certificates
    const hash_1 = "0x3fd54831f488a22b28398de0c567a3b064b937f54f81739ae9bd545967f3abab";
    const hash_2 = "0x3fd54832f488a22b28398de0c567a3b064b937f54f81739ae9bd545967f3abab";
    // test constants
    const NotEnoughFunds = new RegExp("EC2-");
    const Unauthorized = new RegExp("EC8-");
    const CannotProposeChanges = new RegExp("EC22-");
    const WrongSender = new RegExp("EC8-");
    const NotEnoughBalance = new RegExp("EC20-");
    const WrongConfig = new RegExp("EC21-");
    const NoPropositionActivated = new RegExp("EC25-");
    const PropositionAlreadyInProgress = new RegExp("EC24-");
    const CanNotVote = new RegExp("EC23-");
    var PropositionValues = [aux.IntToBytes32(PublicPriceUSD), 
        aux.IntToBytes32(PrivatePriceUSD), 
        aux.IntToBytes32(ProviderPriceUSD),
        aux.IntToBytes32(CertificatePriceUSD),
        aux.IntToBytes32(OwnerRefundPriceUSD)];


    beforeEach(async function(){
        let contracts = await init.InitializeContracts(chairPerson, PublicOwners, minOwners, user_1);
        certPoolManager = contracts[0];
        publicCertPool = new web3.eth.Contract(PublicCertificatesAbi, contracts[1][0]);   
        TreasuryProxy = new web3.eth.Contract(TreasuryAbi, contracts[1][1]);
        certisTokenProxy = new web3.eth.Contract(CertisTokenAbi, contracts[1][2]);
    });

    async function SendingNewProviders(){
        await publicCertPool.methods.addProvider(provider_1, provider_1_Info).send({from: user_1, value: PublicPriceWei, gas: Gas}, function(error, result){});
        await publicCertPool.methods.addProvider(provider_2, provider_2_Info).send({from: user_1, value: PublicPriceWei, gas: Gas}, function(error, result){});
        await pool_common.ValidatingProviders(publicCertPool, PublicOwners, provider_1, provider_2, user_1);
    }

    // ****** TESTING Price Config ***************************************************************** //
    it("Retrieve Proposals Details",async function(){
        // act
        await proposition.Check_Proposition_Details(TreasuryProxy, certisTokenProxy, chairPerson, tokenOwner, user_1, PropositionValues);
    });

    it("Vote/Propose/cancel Price Configuration WRONG",async function(){
        await proposition.Config_Treasury_Wrong(TreasuryProxy, certisTokenProxy, tokenOwner, user_1, chairPerson, PropositionValues);

    });

    it("Vote/Propose/cancel Price Configuration CORRECT",async function(){
        await proposition.Config_Treasury_Correct(TreasuryProxy, certisTokenProxy, tokenOwner, user_1, chairPerson, PropositionValues);

    });

    it("Votes Reassignment Treasury",async function(){
        await proposition.Check_Votes_Reassignment(TreasuryProxy, certisTokenProxy, chairPerson, tokenOwner, user_1, PropositionValues);
    });


    // ****** TESTING Paying ***************************************************************** //

    it("Pay New Proposal & New Pool & New Certificate & New Provider WRONG",async function(){
        // act
        try{
            await TreasuryProxy.methods.pay(0).send({from: user_1, value: PublicPriceWei - 1}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(NotEnoughFunds);
        }
        // act
        try{
            await TreasuryProxy.methods.pay(1).send({from: user_1, value: PrivatePriceWei - 1}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(NotEnoughFunds);
        }
        // act
        try{
            await TreasuryProxy.methods.pay(2).send({from: user_1, value: CertificatePriceWei - 1}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(NotEnoughFunds);
        }
        // act
        try{
            await TreasuryProxy.methods.pay(3).send({from: user_1, value: ProviderPriceWei - 1}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(NotEnoughFunds);
        }
        // act
        try{
            var Amount = 100 * (PublicPriceWei + PrivatePriceWei + CertificatePriceWei + ProviderPriceWei);
            await TreasuryProxy.methods.pay(4).send({from: user_1, value: Amount}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.not.match(NotEnoughFunds);
        }
    });

    it("Pay New Proposal & New Pool & New Certificate & New Provider CORRECT",async function(){
        // act
        var CertisTokenBalance = (new BigNumber(await certisTokenProxy.methods.balanceOf(chairPerson).call({from: chairPerson, gas: Gas}))).dividedBy(2);
        await certisTokenProxy.methods.transfer(user_1, CertisTokenBalance.toNumber()).send({from: chairPerson, gas: Gas}, function(error, result){});
        await TreasuryProxy.methods.pay(0).send({from: user_1, value: PublicPriceWei, gas: Gas}, function(error, result){});
        await TreasuryProxy.methods.pay(0).send({from: user_1, value: PublicPriceWei + 1, gas: Gas}, function(error, result){});
        await TreasuryProxy.methods.pay(1).send({from: user_1, value: PrivatePriceWei, gas: Gas}, function(error, result){});
        await TreasuryProxy.methods.pay(1).send({from: user_1, value: PrivatePriceWei + 1, gas: Gas}, function(error, result){});
        await TreasuryProxy.methods.pay(2).send({from: user_1, value: CertificatePriceWei, gas: Gas}, function(error, result){});
        await TreasuryProxy.methods.pay(2).send({from: user_1, value: CertificatePriceWei + 1, gas: Gas}, function(error, result){});
        await TreasuryProxy.methods.pay(3).send({from: user_1, value: ProviderPriceWei, gas: Gas}, function(error, result){});
        await TreasuryProxy.methods.pay(3).send({from: user_1, value: ProviderPriceWei + 1, gas: Gas}, function(error, result){});
        // assert
        var balance = parseInt(await web3.eth.getBalance(TreasuryProxy._address));
        expect(balance).to.be.equal(PublicPriceWei + (PublicPriceWei + 1) + PrivatePriceWei + (PrivatePriceWei + 1) + ProviderPriceWei + (ProviderPriceWei + 1) + CertificatePriceWei + (CertificatePriceWei + 1));
        var Balance1 = parseInt(await TreasuryProxy.methods.retrieveFullBalance(chairPerson).call({from: user_1}, function(error, result){}));
        var Balance2 = parseInt(await TreasuryProxy.methods.retrieveFullBalance(user_1).call({from: user_1}, function(error, result){}));
        expect(Balance1).to.be.equal(Balance2);
        expect(Balance2).to.be.equal((balance - 2 * OwnerRefundPriceWei) / 2);
    });

    // ****** TESTING Owners Refunding ***************************************************************** //

    it("Owners Refunding WRONG",async function(){
        // act
        try{
            await TreasuryProxy.methods.getRefund(user_1, 1).send({from: user_1}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(WrongSender);
        }
    });

    it("Owners Refunding CORRECT",async function(){
        // act
        await SendingNewProviders();
        // asert
        var BalanceOwners = 0;
        for(var i=0; i < PublicOwners.length; i++){
            BalanceOwners += parseInt(await TreasuryProxy.methods.retrieveFullBalance(PublicOwners[i]).call({from: user_1}, function(error, result){}));
        }
        expect(BalanceOwners).to.be.equal(2 * OwnerRefundPriceWei);
    });

    // ****** TESTING Owners Refunding ***************************************************************** //

    it("Withdraw WRONG",async function(){
        // act
        try{
            await TreasuryProxy.methods.withdraw(1).send({from: user_1}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(NotEnoughBalance);
        }
    });

    it("Withdraw CORRECT",async function(){
        // act
        await SendingNewProviders();
        // assert
        let TreasuryBalance = parseInt(await web3.eth.getBalance(TreasuryProxy._address));
        for(let i=0; i < PublicOwners.length; i++){
            let balance = new BigNumber(await TreasuryProxy.methods.retrieveFullBalance(PublicOwners[i]).call({from: user_1}, function(error, result){}));
            TreasuryBalance -= balance.toNumber();
            let initialBalance = new BigNumber(await web3.eth.getBalance(PublicOwners[i]));
            let request = "";

            if(i % 2 == 0) request = await TreasuryProxy.methods.withdraw(balance).send({from: PublicOwners[i], gas: Gas, gasPrice: 1}, function(error, result){});
            else request = await TreasuryProxy.methods.withdrawAll().send({from: PublicOwners[i], gas: Gas, gasPrice: 1}, function(error, result){});
            
            // assert that money has been transfered
            let finalBalance = new BigNumber(await web3.eth.getBalance(PublicOwners[i]));
            expect(finalBalance.minus(initialBalance.minus(request.gasUsed).plus(balance)).toString()).to.be.equal("0");
            // assert that account balance has been updated
            balance = new BigNumber(await TreasuryProxy.methods.retrieveFullBalance(PublicOwners[i]).call({from: user_1}, function(error, result){}));
            expect(balance.toString()).to.be.equal("0");
        }
        let FinalTreasuryBalance = parseInt(await web3.eth.getBalance(TreasuryProxy._address));
        expect(FinalTreasuryBalance).to.be.equal(TreasuryBalance);
    });


});
