const BigNumber = require('bignumber.js');

const constants = require("../test_libraries/constants.js");
const init = require("../test_libraries/InitializeContracts.js");
const obj = require("../test_libraries/objects.js");

const PublicPool = artifacts.require("PublicPool");
const PublicPoolAbi = PublicPool.abi;
const Treasury = artifacts.require("Treasury");
const TreasuryAbi = Treasury.abi;
const MarketsCredits = artifacts.require("MarketsCredits");
const MarketsCreditsAbi = MarketsCredits.abi;
const MockDai = artifacts.require("MockDai");
const MockDaiAbi = MockDai.abi;

const Gas = constants.Gas;
const NewIssuerFee = constants.NewIssuerFee;
const AdminNewIssuerFee = constants.AdminNewIssuerFee;




// TEST -------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------

contract("Testing Markets Credits",function(accounts){
    var manager;
    var publicpoolProxy;
    var treasuryProxy;
    var marketsCreditsProxy;
    var mockdai1;
    var mockdai2;
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

    const NotEnoughCredit = new RegExp("EC20-");
    const MarketNotOK = new RegExp("The Market Id and Address do not correspond");



    beforeEach(async function(){
        let contracts = await init.InitializeContracts(chairPerson, PublicOwners, minOwners, user_1);
        manager = contracts[0];
        publicpoolProxy = new web3.eth.Contract(PublicPoolAbi, contracts[1][0]);
        treasuryProxy = new web3.eth.Contract(TreasuryAbi, contracts[1][1]);
        marketsCreditsProxy = new web3.eth.Contract(MarketsCreditsAbi, contracts[1][6]);
        piggybankAddress = contracts[1][4];
        paymentsProxyAddress = contracts[1][5];
        mockdai1 = new web3.eth.Contract(MockDaiAbi, contracts[2][9]);
        mockdai2 = new web3.eth.Contract(MockDaiAbi, contracts[2][10]);
    });

    // ****** TESTING Adding Owners ***************************************************************** //


    // ****** TESTING Spending Credit ***************************************************************** //
    it("Spend, Add, WithdrawForAll and Reuse Credit WRONG",async function(){
        await mockdai1.methods.approve(paymentsProxyAddress, NewIssuerAmount).send({from: user_1, gas: Gas}, function(error, result){});
        let response = await publicpoolProxy.methods.requestIssuer(obj.returnIssuerObject(issuer_1, issuer_1_name, issuer_1_symbol, issuer_1_fee, issuer_1_decimals, issuer_1_paymentplans), false, 0).send({from: user_1, gas: Gas}, function(error, result){});;
        let issuerId = new BigNumber(response.events._NewIssuerRequest.returnValues.id);
        try{
            await marketsCreditsProxy.methods.spendCredit(issuerId, user_1, 0, user_1, 0).send({from: user_1, gas: Gas}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(MarketNotOK);
        }
        try{
            await marketsCreditsProxy.methods.assignCredit(issuerId, 0, [], [], []).send({from: user_1, gas: Gas}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(MarketNotOK);
        }
        try{
            await marketsCreditsProxy.methods.withdrawAllFor(issuerId, user_1, 0, "0x").send({from: user_1, gas: Gas}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(MarketNotOK);
        }
        try{
            await marketsCreditsProxy.methods.reuseCredit(issuerId, 0, user_1, 0, 0).send({from: user_1, gas: Gas}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(MarketNotOK);
        }
    });

    // ****** TESTING Credit ***************************************************************** //
    it("Withdraw Credit WRONG",async function(){
        try{
            await marketsCreditsProxy.methods.withdraw(1, 0).send({from: accounts[0], gas: Gas}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(NotEnoughCredit);
        }
        try{
            await marketsCreditsProxy.methods.withdraw(1, 1).send({from: accounts[0], gas: Gas}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(NotEnoughCredit);
        }

    });

    it("Withdraw Credit CORRECT",async function(){
        let amount = 10;
        let initialBalance = new BigNumber(await mockdai1.methods.balanceOf(accounts[0]).call());
        let mockdai = mockdai1;

        for(let i=0; i < 2; i++){
            if(i == 1) mockdai = mockdai2;

            await mockdai.methods.approve(paymentsProxyAddress, amount).send({from: user_1, gas: Gas}, function(error, result){});
            await mockdai.methods.transfer(accounts[1], amount).send({from: user_1, gas: Gas}, function(error, result){});
            await mockdai.methods.approve(paymentsProxyAddress, amount).send({from: accounts[1], gas: Gas}, function(error, result){});

            await marketsCreditsProxy.methods.sendCredit(accounts[0], amount, i).send({from: user_1, gas: Gas}, function(error, result){});
            await marketsCreditsProxy.methods.sendCredit(accounts[0], amount, i).send({from: accounts[1], gas: Gas}, function(error, result){});
            let credit = await marketsCreditsProxy.methods.retrieveCredit(accounts[0], i).call();
            expect(initialBalance.toString()).to.equal("0");
            expect(parseInt(credit)).to.equal(2 * amount);

            let withdraw_1 = amount - 1;
            await marketsCreditsProxy.methods.withdraw(withdraw_1, i).send({from: accounts[0], gas: Gas}, function(error, result){});
            credit = await marketsCreditsProxy.methods.retrieveCredit(accounts[0], i).call();
            let Balance_1 = new BigNumber(await mockdai.methods.balanceOf(accounts[0]).call());
            expect(Balance_1.toString()).to.equal(withdraw_1.toString());
            expect(parseInt(credit)).to.equal((2 * amount) - withdraw_1);

            await marketsCreditsProxy.methods.withdrawAll(i).send({from: accounts[0], gas: Gas}, function(error, result){});
            credit = await marketsCreditsProxy.methods.retrieveCredit(accounts[0], i).call();
            let Balance_2 = new BigNumber(await mockdai.methods.balanceOf(accounts[0]).call());
            expect(Balance_2.toString()).to.equal((2 * amount).toString());
            expect(parseInt(credit)).to.equal(0);
        }

        
    });

});