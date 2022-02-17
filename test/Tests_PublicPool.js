const BigNumber = require('bignumber.js');

const constants = require("../test_libraries/constants.js");
const init = require("../test_libraries/InitializeContracts.js");
const multisigcontract = require("../test_libraries/MultiSigContract.js");
const obj = require("../test_libraries/objects.js");

const PublicPool = artifacts.require("PublicPool");
const PublicPoolAbi = PublicPool.abi;
const Treasury = artifacts.require("Treasury");
const TreasuryAbi = Treasury.abi;
const MockDai = artifacts.require("MockDai");
const MockDaiAbi = MockDai.abi;

const Gas = constants.Gas;
const NewIssuerFee = constants.NewIssuerFee;
const AdminNewIssuerFee = constants.AdminNewIssuerFee;




// TEST -------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------

contract("Testing Public Pool",function(accounts){
    var manager;
    var publicpoolProxy;
    var treasuryProxy;
    var mockdai;
    var paymentsProxyAddress;
    var piggybankAddress;

    // used addresses
    const chairPerson = accounts[0];
    const PublicOwners = [accounts[1], accounts[2], accounts[3]];
    const minOwners = 2;
    const user_1 = accounts[4];
    const extra_owner = accounts[5];
    const issuer_1 = accounts[6];
    const issuer_1_name = "issuer 1";
    const issuer_1_symbol = "I1";
    const issuer_1_fee = 10;
    const issuer_1_decimals = 0;
    const issuer_1_paymentplans = 0;
    const issuer_2 = accounts[6];

    var NewIssuerAmount = NewIssuerFee.plus(AdminNewIssuerFee);


    const address_0 = "0x0000000000000000000000000000000000000000";

    const FeesNOK = new RegExp("fees cannot be larger than 100 percent");
    const AddressNOK = new RegExp("NFT Market owner cannot be address 0");
    const NameNOK = new RegExp("Name is empty");
    const SymbolNOK = new RegExp("Symbol is empty");
    const NotEnoughFees = new RegExp("Contract does not have enough approved funds");
    const TooMuch = new RegExp("EC20-");
    const NotAnOwner = new RegExp("EC9-");
    const OwnerAlreadyvoted = new RegExp("EC5-");
    const IssuerIDTaken = new RegExp("This Issuer Name has already been taken");
    const NotPending = new RegExp("This issuer id is not pending");



    beforeEach(async function(){
        let contracts = await init.InitializeContracts(chairPerson, PublicOwners, minOwners, user_1);
        manager = contracts[0];
        publicpoolProxy = new web3.eth.Contract(PublicPoolAbi, contracts[1][0]);
        treasuryProxy = new web3.eth.Contract(TreasuryAbi, contracts[1][1]);
        piggybankAddress = contracts[1][4];
        paymentsProxyAddress = contracts[1][5];
        mockdai = new web3.eth.Contract(MockDaiAbi, contracts[2][7]);
    });

    // ****** TESTING Adding Owners ***************************************************************** //

    it("Add Owner WRONG",async function(){
        await multisigcontract.AddOwnerWrong(publicpoolProxy, PublicOwners, extra_owner, user_1);
    });

    it("Add Owner CORRECT 1",async function(){
        await multisigcontract.AddOwnerCorrect(publicpoolProxy, PublicOwners, extra_owner, user_1);
    });

    it("Add Owner CORRECT 2",async function(){
        await multisigcontract.AddOwnerCorrect2(publicpoolProxy, PublicOwners, extra_owner, user_1);
    });

    // ****** TESTING Removing Owner ***************************************************************** //

    it("Removing Owner WRONG",async function(){
        await multisigcontract.RemoveOwnerWrong(publicpoolProxy, PublicOwners, extra_owner, user_1);
    });

    it("Removing Owner CORRECT 1",async function(){
        await multisigcontract.RemoveOwnerCorrect(publicpoolProxy, PublicOwners, user_1);
    });

    it("Removing Owner CORRECT 2",async function(){
        await multisigcontract.RemoveOwnerCorrect2(publicpoolProxy, PublicOwners, user_1);
    });

     // ****** TESTING Updating Min Owners ***************************************************************** //

    it("Update Min Owner WRONG",async function(){
        await multisigcontract.UpdateMinOwnersWrong(publicpoolProxy, PublicOwners, user_1);
    });

    it("Update Min Owner CORRECT 1",async function(){
        await multisigcontract.UpdateMinOwnersCorrect(publicpoolProxy, PublicOwners, user_1);
    });

    it("Update Min Owner CORRECT 2",async function(){
        await multisigcontract.UpdateMinOwnersCorrect2(publicpoolProxy, PublicOwners, user_1);
    });

    // ****** TESTING New Issuers ***************************************************************** //

    it("Add Issuer WRONG",async function(){
        try{
            await publicpoolProxy.methods.requestIssuer(obj.returnIssuerObject(issuer_1, issuer_1_name, issuer_1_symbol, 1001, 1, 0)).send({from: user_1, gas: Gas}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(FeesNOK);
        }
        // act
        try{
            await publicpoolProxy.methods.requestIssuer(obj.returnIssuerObject(address_0, issuer_1_name, issuer_1_symbol, 10, 0, 0)).send({from: user_1, gas: Gas}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(AddressNOK);
        }
        // act
        try{
            await publicpoolProxy.methods.requestIssuer(obj.returnIssuerObject(issuer_1, "", issuer_1_symbol, 10, 0, 0)).send({from: user_1, gas: Gas}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(NameNOK);
        }
        // act
        try{
            await publicpoolProxy.methods.requestIssuer(obj.returnIssuerObject(issuer_1, issuer_1_name, "", 10, 0, 0)).send({from: user_1, gas: Gas}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(SymbolNOK);
        }
        // act
        try{
            let amount = NewIssuerAmount.minus(1)
            await mockdai.methods.approve(paymentsProxyAddress, amount).send({from: user_1, gas: Gas}, function(error, result){});
            await publicpoolProxy.methods.requestIssuer(obj.returnIssuerObject(issuer_1, issuer_1_name, issuer_1_symbol, 10, 0, 0)).send({from: user_1, gas: Gas}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(NotEnoughFees);
        }
        // act
        try{
            await mockdai.methods.approve(paymentsProxyAddress, 1 + NewIssuerAmount).send({from: user_1, gas: Gas}, function(error, result){});
            await publicpoolProxy.methods.requestIssuer(obj.returnIssuerObject(issuer_1, issuer_1_name, issuer_1_symbol, 10, 0, 0)).send({from: user_1, gas: Gas}, function(error, result){});
            await publicpoolProxy.methods.requestIssuer(obj.returnIssuerObject(issuer_2, issuer_1_name, "test", 10, 0, 0)).send({from: user_1, gas: Gas}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(IssuerIDTaken);
        }
    });

    it("Add Issuer CORRECT",async function(){
        await mockdai.methods.approve(paymentsProxyAddress, 3 * NewIssuerAmount).send({from: user_1, gas: Gas}, function(error, result){});
        var AggregatedAmount = new BigNumber(await treasuryProxy.methods.retrieveAggregatedAmount().call());
        var TreasuryBalance = new BigNumber(await mockdai.methods.balanceOf(treasuryProxy._address).call());
        var PiggyBankBalance = new BigNumber(await mockdai.methods.balanceOf(piggybankAddress).call());
        expect(TreasuryBalance.toString()).to.equal("0");
        expect(PiggyBankBalance.toString()).to.equal("0");
        expect(AggregatedAmount.toString()).to.equal("0");

        let response = await publicpoolProxy.methods.requestIssuer(obj.returnIssuerObject(issuer_1, issuer_1_name, issuer_1_symbol, issuer_1_fee, issuer_1_decimals, issuer_1_paymentplans)).send({from: user_1, gas: Gas}, function(error, result){});
        let issuerId = new BigNumber(response.events._NewIssuerRequest.returnValues.id);

        let pendingIssuers = await publicpoolProxy.methods.retrievePendingIssuers().call();
        let pendingIssuer = await publicpoolProxy.methods.retrievePendingIssuer(issuerId).call();
        AggregatedAmount = new BigNumber(await treasuryProxy.methods.retrieveAggregatedAmount().call());
        TreasuryBalance = new BigNumber(await mockdai.methods.balanceOf(treasuryProxy._address).call());
        PiggyBankBalance = new BigNumber(await mockdai.methods.balanceOf(piggybankAddress).call());
        expect(TreasuryBalance.toString()).to.equal(NewIssuerFee.toString());
        expect(PiggyBankBalance.toString()).to.equal(AdminNewIssuerFee.toString());
        expect(AggregatedAmount.toString()).to.equal(NewIssuerFee.toString());
        expect(pendingIssuers.length).to.equal(1);
        expect(pendingIssuer._issuer._owner).to.equal(issuer_1);
        expect(pendingIssuer._issuer._name).to.equal(issuer_1_name);
        expect(pendingIssuer._issuer._symbol).to.equal(issuer_1_symbol);
        expect(pendingIssuer._issuer._feeAmount).to.equal(issuer_1_fee.toString());
        expect(pendingIssuer._issuer._feeDecimals).to.equal(issuer_1_decimals.toString());
        expect(pendingIssuer._issuer._paymentPlan).to.equal(issuer_1_paymentplans.toString());

        await publicpoolProxy.methods.rejectIssuer(issuerId).send({from: PublicOwners[0], gas: Gas}, function(error, result){});
        await publicpoolProxy.methods.rejectIssuer(issuerId).send({from: PublicOwners[1], gas: Gas}, function(error, result){});
        pendingIssuers = await publicpoolProxy.methods.retrievePendingIssuers().call();
        expect(pendingIssuers.length).to.equal(0);

        response = await publicpoolProxy.methods.requestIssuer(obj.returnIssuerObject(issuer_1, issuer_1_name, issuer_1_symbol, issuer_1_fee, issuer_1_decimals, issuer_1_paymentplans)).send({from: user_1, gas: Gas}, function(error, result){});
        issuerId = new BigNumber(response.events._NewIssuerRequest.returnValues.id);

        pendingIssuers = await publicpoolProxy.methods.retrievePendingIssuers().call();
        pendingIssuer = await publicpoolProxy.methods.retrievePendingIssuer(issuerId).call();
        AggregatedAmount = new BigNumber(await treasuryProxy.methods.retrieveAggregatedAmount().call());
        TreasuryBalance = new BigNumber(await mockdai.methods.balanceOf(treasuryProxy._address).call());
        PiggyBankBalance = new BigNumber(await mockdai.methods.balanceOf(piggybankAddress).call());
        expect(TreasuryBalance.toString()).to.equal((2 * NewIssuerFee).toString());
        expect(PiggyBankBalance.toString()).to.equal((2 * AdminNewIssuerFee).toString());
        expect(AggregatedAmount.toString()).to.equal((2 * NewIssuerFee).toString());
        expect(pendingIssuers.length).to.equal(1);
        expect(pendingIssuer._issuer._owner).to.equal(issuer_1);
        expect(pendingIssuer._issuer._name).to.equal(issuer_1_name);
        expect(pendingIssuer._issuer._symbol).to.equal(issuer_1_symbol);
        expect(pendingIssuer._issuer._feeAmount).to.equal(issuer_1_fee.toString());
        expect(pendingIssuer._issuer._feeDecimals).to.equal(issuer_1_decimals.toString());
        expect(pendingIssuer._issuer._paymentPlan).to.equal(issuer_1_paymentplans.toString());

        await publicpoolProxy.methods.validateIssuer(issuerId).send({from: PublicOwners[0], gas: Gas}, function(error, result){});
        response = await publicpoolProxy.methods.validateIssuer(issuerId).send({from: PublicOwners[1], gas: Gas}, function(error, result){});
        let NFTMarketAddress = response.events._IssuerValidation.returnValues.NFTMarket;
        pendingIssuers = await publicpoolProxy.methods.retrievePendingIssuers().call();
        expect(pendingIssuers.length).to.equal(0);

        let Issuers = await publicpoolProxy.methods.retrieveIssuers().call();
        expect(Issuers.length).to.equal(1);
        let IssuersAddress = await publicpoolProxy.methods.retrieveNFTMarketForIssuer(issuerId).call();
        expect(IssuersAddress).to.equal(NFTMarketAddress);

        try{
            await publicpoolProxy.methods.requestIssuer(obj.returnIssuerObject(issuer_2, issuer_1_name, "whatever", 10, 0, 0)).send({from: user_1, gas: Gas}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(IssuerIDTaken);
            AggregatedAmount = new BigNumber(await treasuryProxy.methods.retrieveAggregatedAmount().call());
            TreasuryBalance = new BigNumber(await mockdai.methods.balanceOf(treasuryProxy._address).call());
            PiggyBankBalance = new BigNumber(await mockdai.methods.balanceOf(piggybankAddress).call());
            expect(TreasuryBalance.toString()).to.equal((2 * NewIssuerFee).toString());
            expect(PiggyBankBalance.toString()).to.equal((2 * AdminNewIssuerFee).toString());
            expect(AggregatedAmount.toString()).to.equal((2 * NewIssuerFee).toString());
        }
    });

    // ****** TESTING Voting On Issuers ***************************************************************** //
    it("Voting Issuer WRONG",async function(){
        await mockdai.methods.approve(paymentsProxyAddress, NewIssuerAmount).send({from: user_1, gas: Gas}, function(error, result){});
        let response = await publicpoolProxy.methods.requestIssuer(obj.returnIssuerObject(issuer_1, issuer_1_name, issuer_1_symbol, issuer_1_fee, issuer_1_decimals, issuer_1_paymentplans)).send({from: user_1, gas: Gas}, function(error, result){});;
        let issuerId = new BigNumber(response.events._NewIssuerRequest.returnValues.id);
        try{
            await publicpoolProxy.methods.rejectIssuer(issuerId).send({from: user_1, gas: Gas}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(NotAnOwner);
        }
        try{
            await publicpoolProxy.methods.validateIssuer(issuerId).send({from: user_1, gas: Gas}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(NotAnOwner);
        }
        try{
            await publicpoolProxy.methods.rejectIssuer(issuerId.plus(1)).send({from: PublicOwners[0], gas: Gas}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(NotPending);
        }
        try{
            await publicpoolProxy.methods.validateIssuer(issuerId.plus(1)).send({from: PublicOwners[0], gas: Gas}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(NotPending);
        }
        try{
            await publicpoolProxy.methods.rejectIssuer(issuerId).send({from: PublicOwners[0], gas: Gas}, function(error, result){});
            await publicpoolProxy.methods.rejectIssuer(issuerId).send({from: PublicOwners[0], gas: Gas}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(OwnerAlreadyvoted);
        }
        try{
            await publicpoolProxy.methods.validateIssuer(issuerId).send({from: PublicOwners[1], gas: Gas}, function(error, result){});
            await publicpoolProxy.methods.validateIssuer(issuerId).send({from: PublicOwners[1], gas: Gas}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(OwnerAlreadyvoted);
        }
       
    });

    // ****** TESTING Credit ***************************************************************** //
    it("Withdraw Credit WRONG",async function(){
        try{
            await publicpoolProxy.methods.withdraw(1).send({from: accounts[0], gas: Gas}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(TooMuch);
        }

    });

    it("Withdraw Credit CORRECT",async function(){
        let amount = 10;
        let initialBalance = new BigNumber(await mockdai.methods.balanceOf(accounts[0]).call());

        await mockdai.methods.approve(paymentsProxyAddress, amount).send({from: user_1, gas: Gas}, function(error, result){});
        await mockdai.methods.transfer(accounts[1], amount).send({from: user_1, gas: Gas}, function(error, result){});
        await mockdai.methods.approve(paymentsProxyAddress, amount).send({from: accounts[1], gas: Gas}, function(error, result){});

        await publicpoolProxy.methods.sendCredit(accounts[0], amount).send({from: user_1, gas: Gas}, function(error, result){});
        await publicpoolProxy.methods.sendCredit(accounts[0], amount).send({from: accounts[1], gas: Gas}, function(error, result){});
        let credit = await publicpoolProxy.methods.retrieveCredit(accounts[0]).call();
        expect(initialBalance.toString()).to.equal("0");
        expect(parseInt(credit)).to.equal(2 * amount);

        let withdraw_1 = amount - 1;
        await publicpoolProxy.methods.withdraw(withdraw_1).send({from: accounts[0], gas: Gas}, function(error, result){});
        credit = await publicpoolProxy.methods.retrieveCredit(accounts[0]).call();
        let Balance_1 = new BigNumber(await mockdai.methods.balanceOf(accounts[0]).call());
        expect(Balance_1.toString()).to.equal(withdraw_1.toString());
        expect(parseInt(credit)).to.equal((2 * amount) - withdraw_1);

        await publicpoolProxy.methods.withdrawAll().send({from: accounts[0], gas: Gas}, function(error, result){});
        credit = await publicpoolProxy.methods.retrieveCredit(accounts[0]).call();
        let Balance_2 = new BigNumber(await mockdai.methods.balanceOf(accounts[0]).call());
        expect(Balance_2.toString()).to.equal((2 * amount).toString());
        expect(parseInt(credit)).to.equal(0);
    });

});