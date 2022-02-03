const BigNumber = require('bignumber.js');

const constants = require("../test_libraries/constants.js");
const init = require("../test_libraries/InitializeContracts.js");

const NFTMarket = artifacts.require("NFTMarket");
const NFTMarketAbi = NFTMarket.abi;

const Gas = constants.Gas;
const NewIssuerFee = constants.NewIssuerFee;
const AdminNewIssuerFee = constants.AdminNewIssuerFee;
const MintingFee = constants.MintingFee;
const AdminMintingFee = constants.AdminMintingFee;
const TransferFeeAmount = constants.TransferFeeAmount;
const TransferFeeDecimals = constants.TransferFeeDecimals;
const AdminTransferFeeAmount = constants.AdminTransferFeeAmount;
const AdminTransferFeeDecimals = constants.AdminTransferFeeDecimals;



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
    // issuer 1
    const issuer_1 = accounts[6];
    const issuer_1_name = "issuer 1";
    const issuer_1_symbol = "I1";
    const issuer_1_fee = 10;
    const issuer_1_decimals = 0;
    const issuer_1_paymentplans = 0;
    // issuer 2
    const issuer_2 = accounts[7];
    const issuer_2_name = "issuer 2";
    const issuer_2_symbol = "I2";
    const issuer_2_fee = 835;
    const issuer_2_decimals = 2;
    const issuer_2_paymentplans = 1;

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

    function GenerateMarkets(){
        let response_1 = await publicpoolProxy.methods.requestIssuer(issuer_1, issuer_1_name, issuer_1_symbol, issuer_1_fee, issuer_1_decimals, issuer_1_paymentplans).send({from: user_1, gas: Gas, value: NewIssuerAmount}, function(error, result){});
        let response_2 = await publicpoolProxy.methods.requestIssuer(issuer_2, issuer_2_name, issuer_2_symbol, issuer_2_fee, issuer_2_decimals, issuer_2_paymentplans).send({from: user_1, gas: Gas, value: NewIssuerAmount}, function(error, result){});
        let issuerId_1 = new BigNumber(response_1.events._NewIssuerRequest.returnValues.id);
        let issuerId_2 = new BigNumber(response_2.events._NewIssuerRequest.returnValues.id);

        await publicpoolProxy.methods.validateIssuer(issuerId).send({from: PublicOwners[0], gas: Gas}, function(error, result){});

    }


    // ****** TESTING New Issuers ***************************************************************** //

    it("Change Configuration WRONG",async function(){
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

  

});

   