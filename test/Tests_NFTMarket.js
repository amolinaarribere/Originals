const BigNumber = require('bignumber.js');

const constants = require("../test_libraries/constants.js");
const init = require("../test_libraries/InitializeContracts.js");
const obj = require("../test_libraries/objects.js");

const NFTMarket = artifacts.require("NFTMarket");
const NFTMarketAbi = NFTMarket.abi;
const PublicPool = artifacts.require("PublicPool");
const PublicPoolAbi = PublicPool.abi;
const MarketsCredits = artifacts.require("MarketsCredits");
const MarketsCreditsAbi = MarketsCredits.abi;
const MockDai = artifacts.require("MockDai");
const MockDaiAbi = MockDai.abi;

const Gas = constants.Gas;
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
const MockSupply1 = constants.MockSupply1;
const MockSupply2 = constants.MockSupply2;

const mintingFee1 = MintingFee1.plus(AdminMintingFee1)
const mintingFee2 = MintingFee2.plus(AdminMintingFee2)



// TEST -------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------

contract("Testing NFT Markets",function(accounts){
    var manager;
    var publicpoolProxy;
    var mockdai1;
    var Market_1;
    var Market_2;
    var paymentsProxyAddress;
    var marketscreditsProxy;


    const OnlyOwner = RegExp("Only the Owner is allowed to do that");

    // used addresses
    const chairPerson = accounts[0];
    const PublicOwners = [accounts[1], accounts[2], accounts[3]];
    const minOwners = 2;
    const user_1 = accounts[4];
    const user_2 = accounts[5];
    const user_3 = accounts[6];
    // issuer 1
    const issuer_1 = accounts[7];
    const issuer_1_name = "issuer 1";
    const issuer_1_symbol = "I1";
    const issuer_1_fee = 10;
    const issuer_1_decimals = 0;
    const issuer_1_paymentplans = 0;
    // issuer 2
    const issuer_2 = accounts[8];
    const issuer_2_name = "issuer 2";
    const issuer_2_symbol = "I2";
    const issuer_2_fee = 835;
    const issuer_2_decimals = 2;
    const issuer_2_paymentplans = 1;

    var NewIssuerAmount1 = NewIssuerFee1.plus(AdminNewIssuerFee1);


    const address_0 = "0x0000000000000000000000000000000000000000";

    const FeesNOK = new RegExp("fees cannot be larger than 100 percent");
    const NotEnoughCredit = new RegExp("EC20-");
    const OfferNotInProgress = new RegExp("There is no offer in progress");
    const OfferInProgress = new RegExp("There is an offer in progress");
    const NotEnoughFees = new RegExp("Contract does not have enough approved funds");
    const OnlyOwnerOrApproved = new RegExp("Only owner or approved can change token price");
    const OfferPriceNotOK = new RegExp("The offer is below the minimum price");
    const OnlySender = new RegExp("Only the original sender can withdraw the bid");
    const TokenAlreadyMinted = new RegExp("token already minted")

    const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));


    beforeEach(async function(){
        let contracts = await init.InitializeContracts(chairPerson, PublicOwners, minOwners, user_1);
        manager = contracts[0];
        publicpoolProxy = new web3.eth.Contract(PublicPoolAbi, contracts[1][0]);
        marketscreditsProxy = new web3.eth.Contract(MarketsCreditsAbi, contracts[1][6]);
        piggybankAddress = contracts[1][4];
        paymentsProxyAddress = contracts[1][5];
        mockdai1 = new web3.eth.Contract(MockDaiAbi, contracts[2][9]);
        await mockdai1.methods.transfer(issuer_1, MockSupply1.dividedToIntegerBy(10)).send({from: user_1, gas: Gas}, function(error, result){});
        await mockdai1.methods.transfer(issuer_2, MockSupply1.dividedToIntegerBy(10)).send({from: user_1, gas: Gas}, function(error, result){});
        await mockdai1.methods.transfer(user_2, MockSupply1.dividedToIntegerBy(10)).send({from: user_1, gas: Gas}, function(error, result){});
        mockdai2 = new web3.eth.Contract(MockDaiAbi, contracts[2][10]);
        await mockdai2.methods.transfer(issuer_1, MockSupply2.dividedToIntegerBy(10)).send({from: user_1, gas: Gas}, function(error, result){});
        await mockdai2.methods.transfer(issuer_2, MockSupply2.dividedToIntegerBy(10)).send({from: user_1, gas: Gas}, function(error, result){});
        await mockdai2.methods.transfer(user_2, MockSupply2.dividedToIntegerBy(10)).send({from: user_1, gas: Gas}, function(error, result){});
    });

    async function GenerateMarkets(secondMarket){
        await mockdai1.methods.approve(paymentsProxyAddress, NewIssuerAmount1.multipliedBy(2)).send({from: user_1, gas: Gas}, function(error, result){});
        let response_1 = await publicpoolProxy.methods.requestIssuer(obj.returnIssuerObject(issuer_1, issuer_1_name, issuer_1_symbol, issuer_1_fee, issuer_1_decimals, issuer_1_paymentplans), false, 0).send({from: user_1, gas: Gas}, function(error, result){});
        let issuerId_1 = new BigNumber(response_1.events._NewIssuerRequest.returnValues.id);
        await publicpoolProxy.methods.validateIssuer(issuerId_1).send({from: PublicOwners[0], gas: Gas}, function(error, result){});
        await publicpoolProxy.methods.validateIssuer(issuerId_1).send({from: PublicOwners[1], gas: Gas}, function(error, result){});
        let Issuers_1_Address = await publicpoolProxy.methods.retrieveNFTMarketForIssuer(issuerId_1).call();
        Market_1 = new web3.eth.Contract(NFTMarketAbi, Issuers_1_Address);

        if(true == secondMarket){
            let response_2 = await publicpoolProxy.methods.requestIssuer(obj.returnIssuerObject(issuer_2, issuer_2_name, issuer_2_symbol, issuer_2_fee, issuer_2_decimals, issuer_2_paymentplans), false, 0).send({from: user_1, gas: Gas}, function(error, result){});
            let issuerId_2 = new BigNumber(response_2.events._NewIssuerRequest.returnValues.id);
            await publicpoolProxy.methods.validateIssuer(issuerId_2).send({from: PublicOwners[0], gas: Gas}, function(error, result){});
            await publicpoolProxy.methods.validateIssuer(issuerId_2).send({from: PublicOwners[1], gas: Gas}, function(error, result){});
            let Issuers_2_Address = await publicpoolProxy.methods.retrieveNFTMarketForIssuer(issuerId_2).call();
            Market_2 = new web3.eth.Contract(NFTMarketAbi, Issuers_2_Address);
        }
    }


    // ****** TESTING Changing Configs ***************************************************************** //
    it("Change Configuration WRONG",async function(){
        await GenerateMarkets(false);
        try{
            await Market_1.methods.changeOwner(user_1).send({from: user_1, gas: Gas}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(OnlyOwner);
        }
        try{
            await Market_1.methods.changePaymentPlan(issuer_2_paymentplans).send({from: user_1, gas: Gas}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(OnlyOwner);
        }
        try{
            await Market_1.methods.changeOffersLifeTime(1).send({from: user_1, gas: Gas}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(OnlyOwner);
        }
        try{
            await Market_1.methods.changeOwnerTransferFees(issuer_2_fee, issuer_2_decimals).send({from: user_1, gas: Gas}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(OnlyOwner);
        }
        try{
            await Market_1.methods.changeOwnerTransferFees(10001, 2).send({from: issuer_1, gas: Gas}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(FeesNOK);
        }
       
    });

    it("Change Configuration CORRECT",async function(){
        await GenerateMarkets(false);
        let newLifeTime = 1;
        let before = await Market_1.methods.retrieveIssuer().call();
        await Market_1.methods.changePaymentPlan(issuer_2_paymentplans).send({from: issuer_1, gas: Gas}, function(error, result){});
        await Market_1.methods.changeOffersLifeTime(newLifeTime).send({from: issuer_1, gas: Gas}, function(error, result){});
        await Market_1.methods.changeOwner(user_1).send({from: issuer_1, gas: Gas}, function(error, result){});
        await Market_1.methods.changeOwnerTransferFees(issuer_2_fee, issuer_2_decimals).send({from: user_1, gas: Gas}, function(error, result){});
        let after = await Market_1.methods.retrieveIssuer().call();

        expect(before[0]._owner).to.equal(issuer_1.toString());
        expect(after[0]._owner).to.equal(user_1.toString());
        expect(before[0]._paymentPlan).to.equal(issuer_1_paymentplans.toString());
        expect(after[0]._paymentPlan).to.equal(issuer_2_paymentplans.toString());
        expect(before[0]._feeAmount).to.equal(issuer_1_fee.toString());
        expect(after[0]._feeAmount).to.equal(issuer_2_fee.toString());
        expect(before[0]._feeDecimals).to.equal(issuer_1_decimals.toString());
        expect(after[0]._feeDecimals).to.equal(issuer_2_decimals.toString());
        expect(after[1]).to.equal(newLifeTime.toString());
       
    });

     // ****** TESTING Minting ***************************************************************** //
     it("Minting WRONG",async function(){
        await GenerateMarkets(false);
        try{
            await Market_1.methods.mintToken(0, user_1, obj.returnArrayTokenPriceObject([0, 1],[10, 11], [true, true]), false, 0).send({from: user_1, gas: Gas}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(OnlyOwner);
        }
        try{
            await Market_1.methods.mintToken(0, user_1, obj.returnArrayTokenPriceObject([0, 1],[10, 11], [true, true]), true, 0).send({from: issuer_1, gas: Gas}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(NotEnoughCredit);
        }
        try{
            await mockdai1.methods.approve(paymentsProxyAddress, mintingFee1.minus(1)).send({from: issuer_1, gas: Gas}, function(error, result){});
            await Market_1.methods.mintToken(0, user_1, obj.returnArrayTokenPriceObject([0, 1],[10, 11], [true, true]), false, 0).send({from: issuer_1, gas: Gas}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(NotEnoughFees);
        }
        try{
            await mockdai1.methods.approve(paymentsProxyAddress, mintingFee1.multipliedBy(2)).send({from: issuer_1, gas: Gas}, function(error, result){});
            await Market_1.methods.mintToken(0, user_1, obj.returnArrayTokenPriceObject([0, 1],[10, 11], [true, true]), false, 0).send({from: issuer_1, gas: Gas}, function(error, result){});
            await Market_1.methods.mintToken(0, user_1, obj.returnArrayTokenPriceObject([0, 1],[12, 13], [true, true]), false, 0).send({from: issuer_1, gas: Gas}, function(error, result){});
            expect.fail();
            
        }
        // assert
        catch(error){
            expect(error.message).to.match(TokenAlreadyMinted);
        }
    });

    it("Minting CORRECT",async function(){
        await GenerateMarkets(true);
        let tokenPrice1 = 10;
        let tokenPrice2 = 20;
        let mockdai = mockdai1;
        let mintingFee = mintingFee1;

        for(let i=0; i < 2; i++){
            if(i == 1) {
                mockdai = mockdai2;
                mintingFee = mintingFee2;
            }

            await mockdai.methods.approve(paymentsProxyAddress, mintingFee.multipliedBy(3)).send({from: issuer_1, gas: Gas}, function(error, result){});

            let tokenId = i * 10;

            await marketscreditsProxy.methods.sendCredit(issuer_1, mintingFee, i).send({from: issuer_1, gas: Gas}, function(error, result){});
            await Market_1.methods.mintToken(tokenId, user_1, obj.returnArrayTokenPriceObject([0, 1],[tokenPrice1, tokenPrice2], [true, true]), false, i).send({from: issuer_1, gas: Gas}, function(error, result){});
            let token_1_1 = await Market_1.methods.retrieveToken(tokenId).call();
            await Market_1.methods.mintToken(tokenId + 1, user_1, obj.returnArrayTokenPriceObject([0, 1],[tokenPrice1, tokenPrice2], [false, true]), true, i).send({from: issuer_1, gas: Gas}, function(error, result){});
            let token_1_2 = await Market_1.methods.retrieveToken(tokenId + 1).call();
            await Market_2.methods.mintToken(tokenId, user_1, obj.returnArrayTokenPriceObject([0, 1],[tokenPrice1, tokenPrice2], [true, false]), false, i).send({from: issuer_2, gas: Gas}, function(error, result){});
            let token_2 = await Market_2.methods.retrieveToken(tokenId).call();

            expect(token_1_1[0]._paymentPlan).to.equal(issuer_1_paymentplans.toString());
            expect(parseInt(token_1_1[0]._prices[0]._paymentTokenID)).to.equal(0);
            expect(token_1_1[0]._prices[0]._price).to.equal(tokenPrice1.toString());
            expect(token_1_1[0]._prices[0]._enabled).to.be.true;
            expect(parseInt(token_1_1[0]._prices[1]._paymentTokenID)).to.equal(1);
            expect(token_1_1[0]._prices[1]._price).to.equal(tokenPrice2.toString());
            expect(token_1_1[0]._prices[1]._enabled).to.be.true;
            expect(token_1_1[1]).to.equal(user_1.toString());

            expect(token_1_2[0]._paymentPlan).to.equal(issuer_1_paymentplans.toString());
            expect(parseInt(token_1_2[0]._prices[0]._paymentTokenID)).to.equal(0);
            expect(token_1_2[0]._prices[0]._price).to.equal(tokenPrice1.toString());
            expect(token_1_2[0]._prices[0]._enabled).to.be.false;
            expect(parseInt(token_1_2[0]._prices[1]._paymentTokenID)).to.equal(1);
            expect(token_1_2[0]._prices[1]._price).to.equal(tokenPrice2.toString());
            expect(token_1_2[0]._prices[1]._enabled).to.be.true;
            expect(token_1_2[1]).to.equal(user_1.toString());

            expect(token_2[0]._paymentPlan).to.equal(issuer_2_paymentplans.toString());
            expect(parseInt(token_2[0]._prices[0]._paymentTokenID)).to.equal(0);
            expect(token_2[0]._prices[0]._price).to.equal(tokenPrice1.toString());
            expect(token_2[0]._prices[0]._enabled).to.be.true;
            expect(parseInt(token_2[0]._prices[1]._paymentTokenID)).to.equal(1);
            expect(token_2[0]._prices[1]._price).to.equal(tokenPrice2.toString());
            expect(token_2[0]._prices[1]._enabled).to.be.false;
            expect(token_2[1]).to.equal(user_1.toString());
        }
        
    });

    // ****** TESTING Token Price ***************************************************************** //
    it("Set Token Price WRONG",async function(){
        await GenerateMarkets(false);
        let tokenId = 0;
        let tokenPrice = 10;
        await mockdai1.methods.approve(paymentsProxyAddress, mintingFee1).send({from: issuer_1, gas: Gas}, function(error, result){});
        await Market_1.methods.mintToken(tokenId, user_1, obj.returnArrayTokenPriceObject([0, 1],[tokenPrice, tokenPrice], [true, true]), false, 0).send({from: issuer_1, gas: Gas}, function(error, result){});
        try{
            await Market_1.methods.setTokenPrice(tokenId, obj.returnArrayTokenPriceObject([0, 1, 2, 3],[2 * tokenPrice, 2 * tokenPrice, 1, 2], [true, true, false, false])).send({from: issuer_1, gas: Gas}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(OnlyOwnerOrApproved);
        }
      
    });

    it("Set Token Price CORRECT",async function(){
        await GenerateMarkets(false);
        let tokenId = 0;
        let tokenPrice = 10;
        await mockdai1.methods.approve(paymentsProxyAddress, mintingFee1).send({from: issuer_1, gas: Gas}, function(error, result){});
        await Market_1.methods.mintToken(tokenId, user_1, obj.returnArrayTokenPriceObject([0, 1], [tokenPrice, tokenPrice], [true, true]), false, 0).send({from: issuer_1, gas: Gas}, function(error, result){});
        await Market_1.methods.setTokenPrice(tokenId, obj.returnArrayTokenPriceObject([0, 1],[2 * tokenPrice, 3 * tokenPrice], [false, false])).send({from: user_1, gas: Gas}, function(error, result){});
        let token = await Market_1.methods.retrieveToken(tokenId).call();

        expect(parseInt(token[0]._prices[0]._paymentTokenID)).to.equal(0);
        expect(token[0]._prices[0]._price).to.equal((2 * tokenPrice).toString());
        expect(token[0]._prices[0]._enabled).to.be.false;
        expect(parseInt(token[0]._prices[1]._paymentTokenID)).to.equal(1);
        expect(token[0]._prices[1]._price).to.equal((3 * tokenPrice).toString());
        expect(token[0]._prices[1]._enabled).to.be.false;

    });

    // ****** TESTING Submit Offer ***************************************************************** //
    it("Submit Offer WRONG",async function(){
        await GenerateMarkets(false);
        let tokenId = 0;
        let tokenPrice = 10;
        await mockdai1.methods.approve(paymentsProxyAddress, mintingFee1).send({from: issuer_1, gas: Gas}, function(error, result){});
        await Market_1.methods.mintToken(tokenId, user_1, obj.returnArrayTokenPriceObject([0, 1], [tokenPrice, tokenPrice], [true, true]), false, 0).send({from: issuer_1, gas: Gas}, function(error, result){});
        try{
            await Market_1.methods.submitOffer(obj.returnSubmitOfferObject(tokenId, user_2, tokenPrice - 1, false, 0)).send({from: user_2, gas: Gas}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(OfferPriceNotOK);
        }
        try{
            await mockdai1.methods.approve(paymentsProxyAddress, tokenPrice - 1).send({from: user_2, gas: Gas}, function(error, result){});
            await Market_1.methods.submitOffer(obj.returnSubmitOfferObject(tokenId, user_2, tokenPrice, false, 0)).send({from: user_2, gas: Gas}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(NotEnoughFees);
        }
        try{
            await Market_1.methods.submitOffer(obj.returnSubmitOfferObject(tokenId, user_2, tokenPrice, true, 0)).send({from: user_2, gas: Gas}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(NotEnoughCredit);
        }
        try{
            await mockdai1.methods.approve(paymentsProxyAddress, tokenPrice).send({from: user_2, gas: Gas}, function(error, result){});
            await Market_1.methods.submitOffer(obj.returnSubmitOfferObject(tokenId, user_2, tokenPrice, false, 0)).send({from: user_2, gas: Gas}, function(error, result){});
            await Market_1.methods.submitOffer(obj.returnSubmitOfferObject(tokenId, user_1, tokenPrice, false, 0)).send({from: user_1, gas: Gas}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(OfferInProgress);
        }
      
    });

    it("Submit Offer CORRECT",async function(){
        let start = Math.floor(Date.now()/1000);

        await GenerateMarkets(false);
        let tokenId = 0;
        let tokenPrice1 = 10;
        let tokenPrice2 = 10;

        await mockdai1.methods.approve(paymentsProxyAddress, mintingFee1.multipliedBy(4)).send({from: issuer_1, gas: Gas}, function(error, result){});
        await Market_1.methods.mintToken(tokenId, user_1, obj.returnArrayTokenPriceObject([0, 1], [tokenPrice1, tokenPrice2], [true, true]), false, 0).send({from: issuer_1, gas: Gas}, function(error, result){});
        await Market_1.methods.mintToken(tokenId + 1, user_1, obj.returnArrayTokenPriceObject([0, 1], [tokenPrice1, tokenPrice2], [true, true]), false, 0).send({from: issuer_1, gas: Gas}, function(error, result){});
        await Market_1.methods.mintToken(tokenId + 2, user_1, obj.returnArrayTokenPriceObject([0, 1], [tokenPrice1, tokenPrice2], [true, true]), false, 0).send({from: issuer_1, gas: Gas}, function(error, result){});
        await Market_1.methods.mintToken(tokenId + 3, user_1, obj.returnArrayTokenPriceObject([0, 1], [tokenPrice1, tokenPrice2], [true, true]), false, 0).send({from: issuer_1, gas: Gas}, function(error, result){});

        await mockdai1.methods.approve(paymentsProxyAddress, 2 * tokenPrice1).send({from: user_2, gas: Gas}, function(error, result){});
        await mockdai2.methods.approve(paymentsProxyAddress, 2 * tokenPrice2).send({from: user_2, gas: Gas}, function(error, result){});

        await marketscreditsProxy.methods.sendCredit(user_2, tokenPrice1, 0).send({from: user_2, gas: Gas}, function(error, result){});
        await marketscreditsProxy.methods.sendCredit(user_2, tokenPrice2, 1).send({from: user_2, gas: Gas}, function(error, result){});

        await Market_1.methods.submitOffer(obj.returnSubmitOfferObject(tokenId, user_2, tokenPrice1, false, 0)).send({from: user_2, gas: Gas}, function(error, result){});
        await Market_1.methods.submitOffer(obj.returnSubmitOfferObject(tokenId + 1, user_3, tokenPrice1, true, 0)).send({from: user_2, gas: Gas}, function(error, result){});
        await Market_1.methods.submitOffer(obj.returnSubmitOfferObject(tokenId + 2, user_2, tokenPrice2, false, 1)).send({from: user_2, gas: Gas}, function(error, result){});
        await Market_1.methods.submitOffer(obj.returnSubmitOfferObject(tokenId + 3, user_3, tokenPrice2, true, 1)).send({from: user_2, gas: Gas}, function(error, result){});

        await sleep(1000);

        let offer_1 = await Market_1.methods.retrieveOffer(tokenId).call();
        let offer_2 = await Market_1.methods.retrieveOffer(tokenId + 1).call();
        let offer_3 = await Market_1.methods.retrieveOffer(tokenId + 2).call();
        let offer_4 = await Market_1.methods.retrieveOffer(tokenId + 3).call();


        expect(offer_1._offer).to.equal(tokenPrice1.toString());
        expect(parseInt(offer_1._paymentTokenID)).to.equal(0);
        expect(offer_1._sender).to.equal(user_2.toString());
        expect(offer_1._bidder).to.equal(user_2.toString());
        expect(parseInt(offer_1._deadline)).to.be.at.least(parseInt(start + OffersLifeTime));

        expect(offer_2._offer).to.equal(tokenPrice1.toString());
        expect(parseInt(offer_2._paymentTokenID)).to.equal(0);
        expect(offer_2._sender).to.equal(user_2.toString());
        expect(offer_2._bidder).to.equal(user_3.toString());
        expect(parseInt(offer_2._deadline)).to.be.at.least(parseInt(start + OffersLifeTime));

        expect(offer_3._offer).to.equal(tokenPrice2.toString());
        expect(parseInt(offer_3._paymentTokenID)).to.equal(1);
        expect(offer_3._sender).to.equal(user_2.toString());
        expect(offer_3._bidder).to.equal(user_2.toString());
        expect(parseInt(offer_3._deadline)).to.be.at.least(parseInt(start + OffersLifeTime));

        expect(offer_4._offer).to.equal(tokenPrice2.toString());
        expect(parseInt(offer_4._paymentTokenID)).to.equal(1);
        expect(offer_4._sender).to.equal(user_2.toString());
        expect(offer_4._bidder).to.equal(user_3.toString());
        expect(parseInt(offer_4._deadline)).to.be.at.least(parseInt(start + OffersLifeTime));
    });

    // ****** TESTING Withdraw Offer ***************************************************************** //
    it("Withdraw Offer WRONG",async function(){
        await GenerateMarkets(false);
        let tokenId_1 = 0;
        let tokenId_2 = 1;
        let tokenPrice = 10;
        try{
            await mockdai1.methods.approve(paymentsProxyAddress, mintingFee1).send({from: issuer_1, gas: Gas}, function(error, result){});
            await Market_1.methods.mintToken(tokenId_1, user_1, obj.returnArrayTokenPriceObject([0, 1], [tokenPrice, tokenPrice], [true, true]), false, 0).send({from: issuer_1, gas: Gas}, function(error, result){});
            await mockdai1.methods.approve(paymentsProxyAddress, 2 * tokenPrice).send({from: user_2, gas: Gas}, function(error, result){});
            await Market_1.methods.submitOffer(obj.returnSubmitOfferObject(tokenId_1, user_2, tokenPrice, false, 0)).send({from: user_2, gas: Gas}, function(error, result){});
            await Market_1.methods.withdrawOffer(tokenId_1).send({from: user_2, gas: Gas}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(OfferInProgress);
        }
        try{
            let newLifeTime = 1;
            await Market_1.methods.changeOffersLifeTime(newLifeTime).send({from: issuer_1, gas: Gas}, function(error, result){});
            await mockdai1.methods.approve(paymentsProxyAddress, mintingFee1).send({from: issuer_1, gas: Gas}, function(error, result){});
            await Market_1.methods.mintToken(tokenId_2, user_1, obj.returnArrayTokenPriceObject([0, 1], [tokenPrice, tokenPrice], [true, true]), false, 0).send({from: issuer_1, gas: Gas}, function(error, result){});
            await mockdai1.methods.approve(paymentsProxyAddress, 2 * tokenPrice).send({from: user_2, gas: Gas}, function(error, result){});
            await Market_1.methods.submitOffer(obj.returnSubmitOfferObject(tokenId_2, user_2, tokenPrice, false, 0)).send({from: user_2, gas: Gas}, function(error, result){});
            await sleep(1000 * (newLifeTime + 2));
            await Market_1.methods.withdrawOffer(tokenId_2).send({from: user_1, gas: Gas}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(OnlySender);
        }
        
      
    });

    it("Withdraw Offer CORRECT",async function(){
        await GenerateMarkets(false);
        let tokenId = 0;
        let tokenPrice = 10;
        let newLifeTime = 1;

        await Market_1.methods.changeOffersLifeTime(newLifeTime).send({from: issuer_1, gas: Gas}, function(error, result){});
        await mockdai1.methods.approve(paymentsProxyAddress, mintingFee1).send({from: issuer_1, gas: Gas}, function(error, result){});
        await Market_1.methods.mintToken(tokenId, user_1, obj.returnArrayTokenPriceObject([0, 1], [tokenPrice, tokenPrice], [true, true]), false, 0).send({from: issuer_1, gas: Gas}, function(error, result){});
        await mockdai1.methods.approve(paymentsProxyAddress, 2 * tokenPrice).send({from: user_2, gas: Gas}, function(error, result){});
        await Market_1.methods.submitOffer(obj.returnSubmitOfferObject(tokenId, user_2, tokenPrice, false, 0)).send({from: user_2, gas: Gas}, function(error, result){});
        await sleep(1000 * (newLifeTime + 2));
        await Market_1.methods.withdrawOffer(tokenId).send({from: user_2, gas: Gas}, function(error, result){});

        let offer = await Market_1.methods.retrieveOffer(tokenId).call();

        expect(parseInt(offer._offer)).to.equal(0);
        expect(offer._sender).to.equal(address_0);
        expect(offer._bidder).to.equal(address_0);
        expect(parseInt(offer._deadline)).to.equal(0);
        
    });

    // ****** TESTING Reply to Offer ***************************************************************** //
    it("Reply Offer WRONG",async function(){
        await GenerateMarkets(true);
        let tokenId = 0;
        let tokenId_2 = 1;
        let tokenPrice = 10;

        await mockdai1.methods.approve(paymentsProxyAddress, mintingFee1).send({from: issuer_1, gas: Gas}, function(error, result){});
        await Market_1.methods.mintToken(tokenId, user_1, obj.returnArrayTokenPriceObject([0, 1], [tokenPrice, tokenPrice], [true, true]), false, 0).send({from: issuer_1, gas: Gas}, function(error, result){});
        await Market_2.methods.mintToken(tokenId, user_1, obj.returnArrayTokenPriceObject([0, 1], [tokenPrice, tokenPrice], [true, true]), false, 0).send({from: issuer_2, gas: Gas}, function(error, result){});

        try{
            await Market_1.methods.acceptOffer(tokenId).send({from: user_1, gas: Gas}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(OfferNotInProgress);
        }
        try{
            await Market_1.methods.rejectOffer(tokenId).send({from: user_1, gas: Gas}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(OfferNotInProgress);
        }
        try{
            await mockdai1.methods.approve(paymentsProxyAddress, tokenPrice).send({from: user_2, gas: Gas}, function(error, result){});
            await Market_1.methods.submitOffer(obj.returnSubmitOfferObject(tokenId, user_2, tokenPrice, false, 0)).send({from: user_2, gas: Gas}, function(error, result){});
            await Market_1.methods.acceptOffer(tokenId).send({from: issuer_1, gas: Gas}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(OnlyOwnerOrApproved);
        }
        try{
            await Market_1.methods.rejectOffer(tokenId).send({from: issuer_1, gas: Gas}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(OnlyOwnerOrApproved);
        }
        try{
            let Fees = 100 * (10 ** TransferFeeDecimals) - TransferFeeAmount;
            await Market_2.methods.changeOwnerTransferFees(Fees, TransferFeeDecimals).send({from: issuer_2, gas: Gas}, function(error, result){});
            await mockdai1.methods.approve(paymentsProxyAddress, tokenPrice).send({from: user_2, gas: Gas}, function(error, result){});
            await Market_2.methods.submitOffer(obj.returnSubmitOfferObject(tokenId, user_2, tokenPrice, false, 0)).send({from: user_2, gas: Gas}, function(error, result){});
            await Market_2.methods.acceptOffer(tokenId).send({from: user_1, gas: Gas}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(FeesNOK);
        }

        let newLifeTime = 1;

        try{
            await mockdai1.methods.approve(paymentsProxyAddress, mintingFee1).send({from: issuer_1, gas: Gas}, function(error, result){});
            await Market_1.methods.mintToken(tokenId_2, user_1, obj.returnArrayTokenPriceObject([0, 1], [tokenPrice, tokenPrice], [true, true]), false, 0).send({from: issuer_1, gas: Gas}, function(error, result){});
            await Market_1.methods.changeOffersLifeTime(newLifeTime).send({from: issuer_1, gas: Gas}, function(error, result){});
            await mockdai1.methods.approve(paymentsProxyAddress, tokenPrice).send({from: user_2, gas: Gas}, function(error, result){});
            await Market_1.methods.submitOffer(obj.returnSubmitOfferObject(tokenId_2, user_2, tokenPrice, false, 0)).send({from: user_2, gas: Gas}, function(error, result){});
            await sleep(1000 * (newLifeTime + 2));
            await Market_1.methods.acceptOffer(tokenId_2).send({from: user_1, gas: Gas}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(OfferNotInProgress);
        }
        try{
            await mockdai1.methods.approve(paymentsProxyAddress, tokenPrice).send({from: user_2, gas: Gas}, function(error, result){});
            await Market_1.methods.submitOffer(obj.returnSubmitOfferObject(tokenId_2, user_2, tokenPrice, false, 0)).send({from: user_2, gas: Gas}, function(error, result){});
            await sleep(1000 * (newLifeTime + 2));
            await Market_1.methods.rejectOffer(tokenId_2).send({from: user_1, gas: Gas}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(OfferNotInProgress);
        }

    });

    it("Reply Offer CORRECT",async function(){
        await GenerateMarkets(true);
        let tokenId = 0;
        let tokenId_2 = 1;
        let tokenPrice = 10;
        let tokenPrice_2 = 15;

        await mockdai1.methods.approve(paymentsProxyAddress, mintingFee1).send({from: issuer_1, gas: Gas}, function(error, result){});
        await mockdai2.methods.approve(paymentsProxyAddress, mintingFee2).send({from: issuer_1, gas: Gas}, function(error, result){});

        await Market_1.methods.mintToken(tokenId, user_1, obj.returnArrayTokenPriceObject([0, 1], [tokenPrice, tokenPrice_2], [true, true]), false, 0).send({from: issuer_1, gas: Gas}, function(error, result){});
        await Market_1.methods.mintToken(tokenId_2, user_1, obj.returnArrayTokenPriceObject([0, 1], [tokenPrice, tokenPrice_2], [true, true]), false, 1).send({from: issuer_1, gas: Gas}, function(error, result){});

        await mockdai1.methods.approve(paymentsProxyAddress, 2 * tokenPrice).send({from: user_2, gas: Gas}, function(error, result){});
        await mockdai2.methods.approve(paymentsProxyAddress, 2 * tokenPrice_2).send({from: user_2, gas: Gas}, function(error, result){});

        await Market_1.methods.submitOffer(obj.returnSubmitOfferObject(tokenId, user_2, tokenPrice, false, 0)).send({from: user_2, gas: Gas}, function(error, result){});
        await Market_1.methods.submitOffer(obj.returnSubmitOfferObject(tokenId_2, user_2, tokenPrice_2, false, 1)).send({from: user_2, gas: Gas}, function(error, result){});
        await Market_1.methods.rejectOffer(tokenId).send({from: user_1, gas: Gas}, function(error, result){});
        await Market_1.methods.acceptOffer(tokenId_2).send({from: user_1, gas: Gas}, function(error, result){});

        let ownertoken = await Market_1.methods.ownerOf(tokenId).call();
        let ownertoken_2 = await Market_1.methods.ownerOf(tokenId_2).call();
        expect(ownertoken).to.equal(user_1);
        expect(ownertoken_2).to.equal(user_2);

        await marketscreditsProxy.methods.sendCredit(user_2, tokenPrice, 0).send({from: user_2, gas: Gas}, function(error, result){});
        await Market_1.methods.submitOffer(obj.returnSubmitOfferObject(tokenId, user_2, tokenPrice, true, 0)).send({from: user_2, gas: Gas}, function(error, result){});
        await Market_1.methods.acceptOffer(tokenId).send({from: user_1, gas: Gas}, function(error, result){});
        ownertoken = await Market_1.methods.ownerOf(tokenId).call();
        expect(ownertoken).to.equal(user_2);


        await mockdai1.methods.approve(paymentsProxyAddress, mintingFee1.multipliedBy(2)).send({from: issuer_2, gas: Gas}, function(error, result){});
        await Market_2.methods.mintToken(tokenId, user_1, obj.returnArrayTokenPriceObject([0, 1], [tokenPrice, tokenPrice_2], [true, true]), false, 0).send({from: issuer_2, gas: Gas}, function(error, result){});
        await Market_2.methods.mintToken(tokenId_2, user_1, obj.returnArrayTokenPriceObject([0, 1], [tokenPrice, tokenPrice_2], [true, true]), false, 0).send({from: issuer_2, gas: Gas}, function(error, result){});

        await mockdai1.methods.approve(paymentsProxyAddress, 2 * tokenPrice).send({from: user_2, gas: Gas}, function(error, result){});
        await mockdai2.methods.approve(paymentsProxyAddress, 2 * tokenPrice_2).send({from: user_2, gas: Gas}, function(error, result){});

        await Market_2.methods.submitOffer(obj.returnSubmitOfferObject(tokenId, user_2, tokenPrice, false, 0)).send({from: user_2, gas: Gas}, function(error, result){});
        await Market_2.methods.submitOffer(obj.returnSubmitOfferObject(tokenId_2, user_2, tokenPrice_2, false, 1)).send({from: user_2, gas: Gas}, function(error, result){});

        await Market_2.methods.acceptOffer(tokenId).send({from: user_1, gas: Gas}, function(error, result){});
        await Market_2.methods.rejectOffer(tokenId_2).send({from: user_1, gas: Gas}, function(error, result){});
        ownertoken = await Market_2.methods.ownerOf(tokenId).call();
        ownertoken_2 = await Market_2.methods.ownerOf(tokenId_2).call();
        expect(ownertoken).to.equal(user_2);
        expect(ownertoken_2).to.equal(user_1);

        await marketscreditsProxy.methods.sendCredit(user_2, tokenPrice_2, 1).send({from: user_2, gas: Gas}, function(error, result){});
        await Market_2.methods.submitOffer(obj.returnSubmitOfferObject(tokenId_2, user_2, tokenPrice_2, true, 1)).send({from: user_2, gas: Gas}, function(error, result){});
        await Market_2.methods.acceptOffer(tokenId_2).send({from: user_1, gas: Gas}, function(error, result){});
        ownertoken_2 = await Market_2.methods.ownerOf(tokenId_2).call();
        expect(ownertoken_2).to.equal(user_2);
       
    });

});

   