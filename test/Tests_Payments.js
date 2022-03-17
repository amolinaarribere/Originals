// Chai library for testing
// ERROR tests = First we test the error message then we test the action was not carried out

const OriginalsToken = artifacts.require("OriginalsToken");
const OriginalsTokenAbi = OriginalsToken.abi;
const Payments = artifacts.require("Payments");
const PaymentsAbi = Payments.abi;

const constants = require("../test_libraries/constants.js");
const init = require("../test_libraries/InitializeContracts.js");
const proposition = require("../test_libraries/Propositions.js");
const aux = require("../test_libraries/auxiliaries.js");

const Gas = constants.Gas;

// TEST -------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------

contract("Testing Payments",function(accounts){
    var manager;
    var originalsTokenProxy;
    var paymentsProxy;

    // used addresses
    const chairPerson = accounts[0];
    const PublicOwners = [accounts[1], accounts[2], accounts[3]];
    const minOwners = 2;
    const user_1 = accounts[4];
    const tokenOwner = [accounts[5], accounts[6], accounts[7], accounts[8], accounts[9]];
    const address_1 = "0x0000000000000000000000000000000000000001";
    const address_2 = "0x0000000000000000000000000000000000000002";
    const zeroBytes = "0x0000000000000000000000000000000000000000000000000000000000000000"
    var PropositionValues = [aux.IntToBytes32(0), 
        aux.AddressToBytes32(address_1), 
        aux.IntToBytes32(1),
        aux.AddressToBytes32(address_2)];

    const NotCertifiedContract = new RegExp("It is not from one of the certified contracts");
    const WrongPaymentID = new RegExp("this token Id does not have a corresponding Token address");

    beforeEach(async function(){
        let contracts = await init.InitializeContracts(chairPerson, PublicOwners, minOwners, user_1);
        manager = contracts[0];
        originalsTokenProxy = new web3.eth.Contract(OriginalsTokenAbi, contracts[1][2]);
        paymentsProxy = new web3.eth.Contract(PaymentsAbi, contracts[1][5]);
    });


    // ****** Testing Payments Configuration ***************************************************************** //
    it("Retrieve Payments Details",async function(){
        await proposition.Check_Proposition_Details(paymentsProxy, originalsTokenProxy, chairPerson, tokenOwner, user_1, PropositionValues);
    });

    it("Vote/Propose/Cancel Payments WRONG",async function(){
        await proposition.Config_Payments_Wrong(paymentsProxy, originalsTokenProxy, tokenOwner, user_1, chairPerson, PropositionValues);
    });

    it("Vote/Propose/Cancel Payments CORRECT",async function(){
        await proposition.Config_Payments_Correct(paymentsProxy, originalsTokenProxy, tokenOwner, user_1, chairPerson, PropositionValues);
    });

    it("Votes Reassignment Payments",async function(){
        await proposition.Check_Votes_Reassignment(paymentsProxy, originalsTokenProxy, chairPerson, tokenOwner, user_1, PropositionValues);
    });

     // ****** TESTING Withdraws ***************************************************************** //

     it("TransferFrom WRONG",async function(){
        // act
        try{
            await paymentsProxy.methods.TransferFrom(address_1, address_1, 1, 0, zeroBytes, 0).send({from: user_1,  gas: Gas}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(NotCertifiedContract);
        }
        try{
            await paymentsProxy.methods.TransferFrom(address_1, address_1, 1, 0, zeroBytes, 3).send({from: user_1,  gas: Gas}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(WrongPaymentID);
        }
    });

});