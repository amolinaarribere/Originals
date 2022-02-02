const BigNumber = require('bignumber.js');

const constants = require("../test_libraries/constants.js");
const init = require("../test_libraries/InitializeContracts.js");
const multisigcontract = require("../test_libraries/MultiSigContract.js");

const PublicPool = artifacts.require("PublicPool");
const PublicPoolAbi = PublicPool.abi;


const Gas = constants.Gas;
const NewIssuerFee = constants.NewIssuerFee;
const AdminNewIssuerFee = constants.AdminNewIssuerFee;




// TEST -------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------

contract("Testing Public Pool",function(accounts){
    var manager;
    var publicpoolProxy;

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
    const NotEnoughFees = new RegExp("New Issuer Fees not enough");
    const TooMuch = new RegExp("EC20-");
    const IssuerIDTaken = new RegExp("This Issuer Name has already been taken");



    beforeEach(async function(){
        let contracts = await init.InitializeContracts(chairPerson, PublicOwners, minOwners, user_1);
        manager = contracts[0];
        publicpoolProxy = new web3.eth.Contract(PublicPoolAbi, contracts[1][0]);
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
            await publicpoolProxy.methods.requestIssuer(issuer_1, issuer_1_name, issuer_1_symbol, 1001, 1, 0).send({from: user_1, gas: Gas, value: NewIssuerAmount}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(FeesNOK);
        }
        // act
        try{
            await publicpoolProxy.methods.requestIssuer(address_0, issuer_1_name, issuer_1_symbol, 10, 0, 0).send({from: user_1, gas: Gas, value: NewIssuerAmount}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(AddressNOK);
        }
        // act
        try{
            let amount = NewIssuerAmount.minus(1)
            await publicpoolProxy.methods.requestIssuer(issuer_1, issuer_1_name, issuer_1_symbol, 10, 0, 0).send({from: user_1, gas: Gas, value: amount}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(NotEnoughFees);
        }
        // act
        try{
            await publicpoolProxy.methods.requestIssuer(issuer_1, issuer_1_name, issuer_1_symbol, 10, 0, 0).send({from: user_1, gas: Gas, value: NewIssuerAmount}, function(error, result){});
            await publicpoolProxy.methods.requestIssuer(issuer_2, issuer_1_name, "", 10, 0, 0).send({from: user_1, gas: Gas, value: NewIssuerAmount}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(IssuerIDTaken);
        }
    });

    it("Add Issuer CORRECT",async function(){
        let response = await publicpoolProxy.methods.requestIssuer(issuer_1, issuer_1_name, issuer_1_symbol, issuer_1_fee, issuer_1_decimals, issuer_1_paymentplans).send({from: user_1, gas: Gas, value: NewIssuerAmount}, function(error, result){});
        let issuerId = new BigNumber(response.events._NewIssuerRequest.returnValues.id);

        let pendingIssuers = await publicpoolProxy.methods.retrievePendingIssuers().call();
        let pendingIssuer = await publicpoolProxy.methods.retrievePendingIssuer(issuerId).call();
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

        response = await publicpoolProxy.methods.requestIssuer(issuer_1, issuer_1_name, issuer_1_symbol, issuer_1_fee, issuer_1_decimals, issuer_1_paymentplans).send({from: user_1, gas: Gas, value: NewIssuerAmount}, function(error, result){});
        issuerId = new BigNumber(response.events._NewIssuerRequest.returnValues.id);

        pendingIssuers = await publicpoolProxy.methods.retrievePendingIssuers().call();
        pendingIssuer = await publicpoolProxy.methods.retrievePendingIssuer(issuerId).call();
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
            await publicpoolProxy.methods.requestIssuer(issuer_2, issuer_1_name, "", 10, 0, 0).send({from: user_1, gas: Gas, value: NewIssuerAmount}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(IssuerIDTaken);
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
        await publicpoolProxy.methods.sendCredit(accounts[0]).send({from: accounts[0], gas: Gas, value: amount}, function(error, result){});
        await publicpoolProxy.methods.sendCredit(accounts[0]).send({from: accounts[1], gas: Gas, value: amount}, function(error, result){});
        let credit = await publicpoolProxy.methods.retrieveCredit(accounts[0]).call();
        expect(parseInt(credit)).to.equal(2 * amount);

        let withdraw_1 = amount - 1;
        await publicpoolProxy.methods.withdraw(withdraw_1).send({from: accounts[0], gas: Gas}, function(error, result){});
        credit = await publicpoolProxy.methods.retrieveCredit(accounts[0]).call();
        expect(parseInt(credit)).to.equal((2 * amount) - withdraw_1);
        await publicpoolProxy.methods.withdrawAll().send({from: accounts[0], gas: Gas}, function(error, result){});
        credit = await publicpoolProxy.methods.retrieveCredit(accounts[0]).call();
        expect(parseInt(credit)).to.equal(0);
    });

});