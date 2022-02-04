const BigNumber = require('bignumber.js');

const constants = require("../test_libraries/constants.js");
const init = require("../test_libraries/InitializeContracts.js");

const NFTMarket = artifacts.require("NFTMarket");
const NFTMarketAbi = NFTMarket.abi;
const PublicPool = artifacts.require("PublicPool");
const PublicPoolAbi = PublicPool.abi;

const Gas = constants.Gas;
const NewIssuerFee = constants.NewIssuerFee;
const AdminNewIssuerFee = constants.AdminNewIssuerFee;
const MintingFee = constants.MintingFee;
const AdminMintingFee = constants.AdminMintingFee;
const TransferFeeAmount = constants.TransferFeeAmount;
const TransferFeeDecimals = constants.TransferFeeDecimals;
const AdminTransferFeeAmount = constants.AdminTransferFeeAmount;
const AdminTransferFeeDecimals = constants.AdminTransferFeeDecimals;
const OffersLifeTime = constants.OffersLifeTime;

const mintingFee = MintingFee.plus(AdminMintingFee)



// TEST -------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------

contract("Testing NFT Markets",function(accounts){
    var manager;
    var publicpoolProxy;
    var Market_1;
    var Market_2;

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

    var NewIssuerAmount = NewIssuerFee.plus(AdminNewIssuerFee);


    const address_0 = "0x0000000000000000000000000000000000000000";

    const FeesNOK = new RegExp("fees cannot be larger than 100 percent");
    const NotEnoughCredit = new RegExp("EC20-");
    const OfferNotInProgress = new RegExp("There is no offer in progress");
    const OfferInProgress = new RegExp("There is an offer in progress");
    const MintingFeesNotEnough = new RegExp("Minting Fees not enough");
    const OnlyOwnerOrApproved = new RegExp("Only owner or approved can change token price");
    const OfferPriceNotOK = new RegExp("The offer is below the minimum price");
    const NotEnoughFunds = new RegExp("Not enough value sent to match the offer");
    const OnlySender = new RegExp("Only the original sender can withdraw the bid");

    const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));


    beforeEach(async function(){
        let contracts = await init.InitializeContracts(chairPerson, PublicOwners, minOwners, user_1);
        manager = contracts[0];
        publicpoolProxy = new web3.eth.Contract(PublicPoolAbi, contracts[1][0]);
    });

    async function GenerateMarkets(secondMarket){
        let response_1 = await publicpoolProxy.methods.requestIssuer(issuer_1, issuer_1_name, issuer_1_symbol, issuer_1_fee, issuer_1_decimals, issuer_1_paymentplans).send({from: user_1, gas: Gas, value: NewIssuerAmount}, function(error, result){});
        let issuerId_1 = new BigNumber(response_1.events._NewIssuerRequest.returnValues.id);
        await publicpoolProxy.methods.validateIssuer(issuerId_1).send({from: PublicOwners[0], gas: Gas}, function(error, result){});
        await publicpoolProxy.methods.validateIssuer(issuerId_1).send({from: PublicOwners[1], gas: Gas}, function(error, result){});
        let Issuers_1_Address = await publicpoolProxy.methods.retrieveNFTMarketForIssuer(issuerId_1).call();
        Market_1 = new web3.eth.Contract(NFTMarketAbi, Issuers_1_Address);

        if(true == secondMarket){
            let response_2 = await publicpoolProxy.methods.requestIssuer(issuer_2, issuer_2_name, issuer_2_symbol, issuer_2_fee, issuer_2_decimals, issuer_2_paymentplans).send({from: user_1, gas: Gas, value: NewIssuerAmount}, function(error, result){});
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
            await Market_1.methods.mintToken(0, user_1, 10).send({from: user_1, gas: Gas, value: mintingFee}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(OnlyOwner);
        }
        try{
            await Market_1.methods.mintToken(0, user_1, 10).send({from: issuer_1, gas: Gas, value: mintingFee.minus(1)}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(MintingFeesNotEnough);
        }
    });

    it("Minting CORRECT",async function(){
        await GenerateMarkets(true);
        let tokenId = 0;
        let tokenPrice = 10;
        await Market_1.methods.mintToken(tokenId, user_1, tokenPrice).send({from: issuer_1, gas: Gas, value: mintingFee}, function(error, result){});
        let token_1 = await Market_1.methods.retrieveToken(tokenId).call();
        await Market_2.methods.mintToken(tokenId, user_1, tokenPrice).send({from: issuer_2, gas: Gas}, function(error, result){});
        let token_2 = await Market_2.methods.retrieveToken(tokenId).call();

        expect(token_1[0]._paymentPlan).to.equal(issuer_1_paymentplans.toString());
        expect(token_1[0]._price).to.equal(tokenPrice.toString());
        expect(token_1[1]).to.equal(user_1.toString());
        expect(token_2[0]._paymentPlan).to.equal(issuer_2_paymentplans.toString());
        expect(token_2[0]._price).to.equal(tokenPrice.toString());
        expect(token_2[1]).to.equal(user_1.toString());
    });

    // ****** TESTING Token Price ***************************************************************** //
    it("Set Token Price WRONG",async function(){
        await GenerateMarkets(false);
        let tokenId = 0;
        let tokenPrice = 10;
        await Market_1.methods.mintToken(tokenId, user_1, tokenPrice).send({from: issuer_1, gas: Gas, value: mintingFee}, function(error, result){});
        try{
            await Market_1.methods.setTokenPrice(tokenId, 2 * tokenPrice).send({from: issuer_1, gas: Gas}, function(error, result){});
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
        await Market_1.methods.mintToken(tokenId, user_1, tokenPrice).send({from: issuer_1, gas: Gas, value: mintingFee}, function(error, result){});
        await Market_1.methods.setTokenPrice(tokenId, 2 * tokenPrice).send({from: user_1, gas: Gas}, function(error, result){});
        let token = await Market_1.methods.retrieveToken(tokenId).call();

        expect(token[0]._price).to.equal((2 * tokenPrice).toString());
    });

    // ****** TESTING Submit Offer ***************************************************************** //
    it("Submit Offer WRONG",async function(){
        await GenerateMarkets(false);
        let tokenId = 0;
        let tokenPrice = 10;
        await Market_1.methods.mintToken(tokenId, user_1, tokenPrice).send({from: issuer_1, gas: Gas, value: mintingFee}, function(error, result){});
        try{
            await Market_1.methods.submitOffer(tokenId, user_2, tokenPrice - 1, false).send({from: user_2, gas: Gas, value : tokenPrice}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(OfferPriceNotOK);
        }
        try{
            await Market_1.methods.submitOffer(tokenId, user_2, tokenPrice, false).send({from: user_2, gas: Gas, value : (tokenPrice - 1)}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(NotEnoughFunds);
        }
        try{
            await Market_1.methods.submitOffer(tokenId, user_2, tokenPrice, true).send({from: user_2, gas: Gas, value : (tokenPrice - 1)}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(NotEnoughCredit);
        }
        try{
            await Market_1.methods.submitOffer(tokenId, user_2, tokenPrice, false).send({from: user_2, gas: Gas, value : tokenPrice}, function(error, result){});
            await Market_1.methods.submitOffer(tokenId, user_1, tokenPrice, false).send({from: user_1, gas: Gas, value : tokenPrice}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(OfferInProgress);
        }
      
    });

    it("Submit Offer CORRECT",async function(){
        await GenerateMarkets(false);
        let tokenId = 0;
        let tokenPrice = 10;
        await Market_1.methods.mintToken(tokenId, user_1, tokenPrice).send({from: issuer_1, gas: Gas, value: mintingFee}, function(error, result){});
        await Market_1.methods.mintToken(tokenId + 1, user_1, tokenPrice).send({from: issuer_1, gas: Gas, value: mintingFee}, function(error, result){});

        let start = Math.floor(Date.now()/1000);

        await Market_1.methods.submitOffer(tokenId, user_2, tokenPrice, false).send({from: user_2, gas: Gas, value : 2 * tokenPrice}, function(error, result){});
        await Market_1.methods.submitOffer(tokenId + 1, user_3, tokenPrice, true).send({from: user_2, gas: Gas}, function(error, result){});

        let offer_1 = await Market_1.methods.retrieveOffer(tokenId).call();
        let offer_2 = await Market_1.methods.retrieveOffer(tokenId + 1).call();

        expect(offer_1._offer).to.equal(tokenPrice.toString());
        expect(offer_1._sender).to.equal(user_2.toString());
        expect(offer_1._bidder).to.equal(user_2.toString());
        expect(parseInt(offer_1._deadline)).to.be.at.least(parseInt(start + OffersLifeTime));

        expect(offer_2._offer).to.equal(tokenPrice.toString());
        expect(offer_2._sender).to.equal(user_2.toString());
        expect(offer_2._bidder).to.equal(user_3.toString());
        expect(parseInt(offer_2._deadline)).to.be.at.least(parseInt(start + OffersLifeTime))
    });

    // ****** TESTING Withdraw Offer ***************************************************************** //
    it("Withdraw Offer WRONG",async function(){
        await GenerateMarkets(false);
        let tokenId_1 = 0;
        let tokenId_2 = 1;
        let tokenPrice = 10;
        try{
            await Market_1.methods.mintToken(tokenId_1, user_1, tokenPrice).send({from: issuer_1, gas: Gas, value: mintingFee}, function(error, result){});
            await Market_1.methods.submitOffer(tokenId_1, user_2, tokenPrice, false).send({from: user_2, gas: Gas, value : 2 * tokenPrice}, function(error, result){});
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
            await Market_1.methods.mintToken(tokenId_2, user_1, tokenPrice).send({from: issuer_1, gas: Gas, value: mintingFee}, function(error, result){});
            await Market_1.methods.submitOffer(tokenId_2, user_2, tokenPrice, false).send({from: user_2, gas: Gas, value : 2 * tokenPrice}, function(error, result){});
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
        await Market_1.methods.mintToken(tokenId, user_1, tokenPrice).send({from: issuer_1, gas: Gas, value: mintingFee}, function(error, result){});
        await Market_1.methods.submitOffer(tokenId, user_2, tokenPrice, false).send({from: user_2, gas: Gas, value : 2 * tokenPrice}, function(error, result){});
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

        await Market_1.methods.mintToken(tokenId, user_1, tokenPrice).send({from: issuer_1, gas: Gas, value: mintingFee}, function(error, result){});
        await Market_2.methods.mintToken(tokenId, user_1, tokenPrice).send({from: issuer_2, gas: Gas}, function(error, result){});

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
            await Market_1.methods.submitOffer(tokenId, user_2, tokenPrice, false).send({from: user_2, gas: Gas, value : tokenPrice}, function(error, result){});
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
            await Market_2.methods.submitOffer(tokenId, user_2, tokenPrice, false).send({from: user_2, gas: Gas, value : tokenPrice}, function(error, result){});
            await Market_2.methods.acceptOffer(tokenId).send({from: user_1, gas: Gas}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(FeesNOK);
        }

        let newLifeTime = 1;

        try{
            await Market_1.methods.mintToken(tokenId_2, user_1, tokenPrice).send({from: issuer_1, gas: Gas, value: mintingFee}, function(error, result){});
            await Market_1.methods.changeOffersLifeTime(newLifeTime).send({from: issuer_1, gas: Gas}, function(error, result){});
            await Market_1.methods.submitOffer(tokenId_2, user_2, tokenPrice, false).send({from: user_2, gas: Gas, value : tokenPrice}, function(error, result){});
            await sleep(1000 * (newLifeTime + 2));
            await Market_1.methods.acceptOffer(tokenId_2).send({from: user_1, gas: Gas}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(OfferNotInProgress);
        }
        try{
            await Market_1.methods.submitOffer(tokenId_2, user_2, tokenPrice, false).send({from: user_2, gas: Gas, value : tokenPrice}, function(error, result){});
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


        await Market_1.methods.mintToken(tokenId, user_1, tokenPrice).send({from: issuer_1, gas: Gas, value: mintingFee}, function(error, result){});
        await Market_1.methods.mintToken(tokenId_2, user_1, tokenPrice_2).send({from: issuer_1, gas: Gas, value: mintingFee}, function(error, result){});
        await Market_1.methods.submitOffer(tokenId, user_2, tokenPrice, false).send({from: user_2, gas: Gas, value : tokenPrice}, function(error, result){});
        await Market_1.methods.submitOffer(tokenId_2, user_2, tokenPrice_2, false).send({from: user_2, gas: Gas, value : tokenPrice_2}, function(error, result){});
        await Market_1.methods.rejectOffer(tokenId).send({from: user_1, gas: Gas}, function(error, result){});
        await Market_1.methods.acceptOffer(tokenId_2).send({from: user_1, gas: Gas}, function(error, result){});
        let ownertoken = await Market_1.methods.ownerOf(tokenId).call();
        let ownertoken_2 = await Market_1.methods.ownerOf(tokenId_2).call();
        expect(ownertoken).to.equal(user_1);
        expect(ownertoken_2).to.equal(user_2);
        await Market_1.methods.submitOffer(tokenId, user_2, tokenPrice, true).send({from: user_2, gas: Gas}, function(error, result){});
        await Market_1.methods.acceptOffer(tokenId).send({from: user_1, gas: Gas}, function(error, result){});
        ownertoken = await Market_1.methods.ownerOf(tokenId).call();
        expect(ownertoken).to.equal(user_2);


        await Market_2.methods.mintToken(tokenId, user_1, tokenPrice).send({from: issuer_2, gas: Gas}, function(error, result){});
        await Market_2.methods.mintToken(tokenId_2, user_1, tokenPrice_2).send({from: issuer_2, gas: Gas}, function(error, result){});
        await Market_2.methods.submitOffer(tokenId, user_2, tokenPrice, false).send({from: user_2, gas: Gas, value : tokenPrice}, function(error, result){});
        await Market_2.methods.submitOffer(tokenId_2, user_2, tokenPrice_2, false).send({from: user_2, gas: Gas, value : tokenPrice_2}, function(error, result){});
        await Market_2.methods.rejectOffer(tokenId).send({from: user_1, gas: Gas}, function(error, result){});
        await Market_2.methods.acceptOffer(tokenId_2).send({from: user_1, gas: Gas}, function(error, result){});
        ownertoken = await Market_2.methods.ownerOf(tokenId).call();
        ownertoken_2 = await Market_2.methods.ownerOf(tokenId_2).call();
        expect(ownertoken).to.equal(user_1);
        expect(ownertoken_2).to.equal(user_2);
        await Market_2.methods.submitOffer(tokenId, user_2, tokenPrice, true).send({from: user_2, gas: Gas}, function(error, result){});
        await Market_2.methods.acceptOffer(tokenId).send({from: user_1, gas: Gas}, function(error, result){});
        ownertoken = await Market_2.methods.ownerOf(tokenId).call();
        expect(ownertoken).to.equal(user_2);
       
    });

});

   