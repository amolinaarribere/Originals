const BigNumber = require('bignumber.js');

const constants = require("../test_libraries/constants.js");
const init = require("../test_libraries/InitializeContracts.js");
const obj = require("../test_libraries/objects.js");

const PublicPool = artifacts.require("PublicPool");
const PublicPoolAbi = PublicPool.abi;
const Treasury = artifacts.require("Treasury");
const TreasuryAbi = Treasury.abi;
const Payments = artifacts.require("Payments");
const PaymentsAbi = Payments.abi;
const MarketsCredits = artifacts.require("MarketsCredits");
const MarketsCreditsAbi = MarketsCredits.abi;
const MockDai = artifacts.require("MockDai");
const MockDaiAbi = MockDai.abi;
const NFTMarket = artifacts.require("NFTMarket");
const NFTMarketAbi = NFTMarket.abi;

const Gas = constants.Gas;
const NewIssuerFee1 = constants.NewIssuerFee1;
const AdminNewIssuerFee1 = constants.AdminNewIssuerFee1;
const NewIssuerFee2 = constants.NewIssuerFee2;
const AdminNewIssuerFee2 = constants.AdminNewIssuerFee2;




// TEST -------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------

contract("Testing Markets Credits",function(accounts){
    var manager;
    var publicpoolProxy;
    var treasuryProxy;
    var marketsCreditsProxy;
    var paymentsProxy;
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
    const issuer_1_paymentplans = 1;
    const issuer_2 = accounts[6];

    var NewIssuerAmount1 = NewIssuerFee1.plus(AdminNewIssuerFee1);
    var NewIssuerAmount2 = NewIssuerFee2.plus(AdminNewIssuerFee2);


    const NotEnoughCredit = new RegExp("EC20-");
    const MarketNotOK = new RegExp("The Market Id and Address do not correspond");
    const WrongPaymentTokenId = new RegExp("this token Id does not have a corresponding Token address");
    const WrongTotalAmount = new RegExp("the total amount is not equal to the calculated one");
    const WrongArrays = new RegExp("Provided arrays do not have the same length");
    const OfferInProgress = new RegExp("Unassigned credit for this token is not empty");
    const InvalidPaymentToken = new RegExp("This payment token is not valid");

    beforeEach(async function(){
        let contracts = await init.InitializeContracts(chairPerson, PublicOwners, minOwners, user_1);
        manager = contracts[0];
        publicpoolProxy = new web3.eth.Contract(PublicPoolAbi, contracts[1][0]);
        treasuryProxy = new web3.eth.Contract(TreasuryAbi, contracts[1][1]);
        paymentsProxy = new web3.eth.Contract(PaymentsAbi, contracts[1][5]);
        marketsCreditsProxy = new web3.eth.Contract(MarketsCreditsAbi, contracts[1][6]);
        piggybankAddress = contracts[1][4];
        paymentsProxyAddress = contracts[1][5];
        mockdai1 = new web3.eth.Contract(MockDaiAbi, contracts[2][9]);
        mockdai2 = new web3.eth.Contract(MockDaiAbi, contracts[2][10]);
    });

    // ****** TESTING Adding Owners ***************************************************************** //


    // ****** TESTING Spending Credit ***************************************************************** //
    it("Spend, Assign, Send and Reuse Credit WRONG",async function(){
        let mockdai = mockdai1;
        let NewIssuerAmount = NewIssuerAmount1;
        let Market;

        for(let i=0; i < 2; i++){
            if(i == 1){
                mockdai = mockdai2;
                NewIssuerAmount = NewIssuerAmount2;
            }
            tokenID = 0;

            await mockdai.methods.approve(paymentsProxyAddress, NewIssuerAmount + 1000).send({from: user_1, gas: Gas}, function(error, result){});
            let response = await publicpoolProxy.methods.requestIssuer(obj.returnIssuerObject(issuer_1, issuer_1_name + i.toString(), issuer_1_symbol  + i.toString(), issuer_1_fee, issuer_1_decimals, issuer_1_paymentplans), false, i).send({from: user_1, gas: Gas}, function(error, result){});;
            let issuerId = new BigNumber(response.events._NewIssuerRequest.returnValues.id);
            try{
                await marketsCreditsProxy.methods.spendCredit(issuerId, user_1, 0, user_1, i).send({from: user_1, gas: Gas}, function(error, result){});
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
                await marketsCreditsProxy.methods.reuseCredit(issuerId, 0, user_1, 0, i).send({from: user_1, gas: Gas}, function(error, result){});
                expect.fail();
            }
            // assert
            catch(error){
                expect(error.message).to.match(MarketNotOK);
            }
            try{
                await marketsCreditsProxy.methods.sendCredit(accounts[0], 10, (i + 100)).send({from: user_1, gas: Gas}, function(error, result){});
                expect.fail();
            }
            // assert
            catch(error){
                expect(error.message).to.match(WrongPaymentTokenId);
            }
            try{
                await marketsCreditsProxy.methods.assignCredit(issuerId, 0, [user_1], [1], [1]).send({from: user_1, gas: Gas}, function(error, result){});
                expect.fail();
            }
            // assert
            catch(error){
                expect(error.message).to.match(WrongTotalAmount);
            }
            try{
                await marketsCreditsProxy.methods.assignCredit(issuerId, 0, [user_1], [1, 1], [1]).send({from: user_1, gas: Gas}, function(error, result){});
                expect.fail();
            }
            // assert
            catch(error){
                expect(error.message).to.match(WrongArrays);
            }
            try{
                await marketsCreditsProxy.methods.assignCredit(issuerId, 0, [user_1], [1], [1, 2]).send({from: user_1, gas: Gas}, function(error, result){});
                expect.fail();
            }
            // assert
            catch(error){
                expect(error.message).to.match(WrongArrays);
            }
            try{
                await publicpoolProxy.methods.validateIssuer(issuerId).send({from: PublicOwners[1], gas: Gas}, function(error, result){});
                await publicpoolProxy.methods.validateIssuer(issuerId).send({from: PublicOwners[2], gas: Gas}, function(error, result){});
                let marketAddress = await publicpoolProxy.methods.retrieveNFTMarketForIssuer(issuerId).call();
                Market = new web3.eth.Contract(NFTMarketAbi, marketAddress);
                await Market.methods.mintToken(tokenID, user_1, obj.returnArrayTokenPriceObject([0, 1], [1, 1], [true, true]), false, i).send({from: issuer_1, gas: Gas}, function(error, result){});
                await marketsCreditsProxy.methods.reuseCredit(issuerId, tokenID, user_1, 1, (i + 100)).send({from: user_1, gas: Gas}, function(error, result){});
                expect.fail();
            }
            // assert
            catch(error){
                expect(error.message).to.match(InvalidPaymentToken);
            }
            try{
                await Market.methods.submitOffer(obj.returnSubmitOfferObject(tokenID, user_1, 1, false, i)).send({from: user_1, gas: Gas}, function(error, result){});
                await marketsCreditsProxy.methods.reuseCredit(issuerId, tokenID, user_1, 1, i).send({from: user_1, gas: Gas}, function(error, result){});
                expect.fail();
            }
            // assert
            catch(error){
                expect(error.message).to.match(OfferInProgress);
            }
            try{
                await marketsCreditsProxy.methods.spendCredit(issuerId, user_1, 0, user_1, (i + 100)).send({from: user_1, gas: Gas}, function(error, result){});
                expect.fail();
            }
            // assert
            catch(error){
                expect(error.message).to.match(InvalidPaymentToken);
            }

        }
        
    });

    // ****** TESTING Credit ***************************************************************** //
    it("Withdraw Credit WRONG",async function(){
        let mockdai = mockdai1;
        let NewIssuerAmount = NewIssuerAmount1;

        for(let i=0; i < 2; i++){

            if(i == 1){
                mockdai = mockdai2;
                NewIssuerAmount = NewIssuerAmount2;
            }

            await mockdai.methods.approve(paymentsProxyAddress, NewIssuerAmount).send({from: user_1, gas: Gas}, function(error, result){});
            let response = await publicpoolProxy.methods.requestIssuer(obj.returnIssuerObject(issuer_1, issuer_1_name + i.toString(), issuer_1_symbol + i.toString(), issuer_1_fee, issuer_1_decimals, issuer_1_paymentplans), false, i).send({from: user_1, gas: Gas}, function(error, result){});;
            let issuerId = new BigNumber(response.events._NewIssuerRequest.returnValues.id);

            try{
                await marketsCreditsProxy.methods.withdraw(1, i).send({from: accounts[0], gas: Gas}, function(error, result){});
                expect.fail();
            }
            // assert
            catch(error){
                expect(error.message).to.match(NotEnoughCredit);
            }
            try{
                await marketsCreditsProxy.methods.withdraw(1, i + 100).send({from: accounts[0], gas: Gas}, function(error, result){});
                expect.fail();
            }
            // assert
            catch(error){
                expect(error.message).to.match(InvalidPaymentToken);
            }
            try{
                await marketsCreditsProxy.methods.withdrawAll(i + 100).send({from: accounts[0], gas: Gas}, function(error, result){});
                expect.fail();
            }
            // assert
            catch(error){
                expect(error.message).to.match(InvalidPaymentToken);
            }
            try{
                await marketsCreditsProxy.methods.withdrawAllFor(issuerId, user_1, i, "0x").send({from: user_1, gas: Gas}, function(error, result){});
                expect.fail();
            }
            // assert
            catch(error){
                expect(error.message).to.match(MarketNotOK);
            }
            try{
                await marketsCreditsProxy.methods.withdrawAllFor(issuerId, user_1, i + 100, "0x").send({from: user_1, gas: Gas}, function(error, result){});
                expect.fail();
            }
            // assert
            catch(error){
                expect(error.message).to.match(InvalidPaymentToken);
            }
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