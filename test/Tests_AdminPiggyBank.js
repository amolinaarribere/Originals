const BigNumber = require('bignumber.js');

const constants = require("../test_libraries/constants.js");
const init = require("../test_libraries/InitializeContracts.js");
const multisigcontract = require("../test_libraries/MultiSigContract.js");

const AdminPiggyBank = artifacts.require("AdminPiggyBank");
const AdminPiggyBankAbi = AdminPiggyBank.abi;


const Gas = constants.Gas;



// TEST -------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------

contract("Testing Admin Piggy Bank",function(accounts){
    var manager;
    var adminPiggyBankProxy;

    // used addresses
    const chairPerson = accounts[0];
    const PublicOwners = [accounts[1], accounts[2], accounts[3]];
    const minOwners = 2;
    const user_1 = accounts[4];
    const extra_owner = accounts[5];
    const address_0 = "0x0000000000000000000000000000000000000000";
    const MustBeOwner = new RegExp("EC9-");

    const CannotTransferToAddress0 = new RegExp("We cannot transfer to address 0");
    const CannotTransferMoreThan = new RegExp("We cannot transfer more than the current balance");
    const TransferInProgress = new RegExp("Transfer in progress");



    beforeEach(async function(){
        let contracts = await init.InitializeContracts(chairPerson, PublicOwners, minOwners, user_1);
        manager = contracts[0];
        adminPiggyBankProxy = new web3.eth.Contract(AdminPiggyBankAbi, contracts[1][4]);
    });

    // ****** TESTING Adding Owners ***************************************************************** //

    it("Add Owner WRONG",async function(){
        await multisigcontract.AddOwnerWrong(adminPiggyBankProxy, PublicOwners, extra_owner, user_1);
    });

    it("Add Owner CORRECT 1",async function(){
        await multisigcontract.AddOwnerCorrect(adminPiggyBankProxy, PublicOwners, extra_owner, user_1);
    });

    it("Add Owner CORRECT 2",async function(){
        await multisigcontract.AddOwnerCorrect2(adminPiggyBankProxy, PublicOwners, extra_owner, user_1);
    });

    // ****** TESTING Removing Owner ***************************************************************** //

    it("Removing Owner WRONG",async function(){
        await multisigcontract.RemoveOwnerWrong(adminPiggyBankProxy, PublicOwners, extra_owner, user_1);
    });

    it("Removing Owner CORRECT 1",async function(){
        await multisigcontract.RemoveOwnerCorrect(adminPiggyBankProxy, PublicOwners, user_1);
    });

    it("Removing Owner CORRECT 2",async function(){
        await multisigcontract.RemoveOwnerCorrect2(adminPiggyBankProxy, PublicOwners, user_1);
    });

     // ****** TESTING Updating Min Owners ***************************************************************** //

     it("Update Min Owner WRONG",async function(){
        await multisigcontract.UpdateMinOwnersWrong(adminPiggyBankProxy, PublicOwners, user_1);
    });

    it("Update Min Owner CORRECT 1",async function(){
        await multisigcontract.UpdateMinOwnersCorrect(adminPiggyBankProxy, PublicOwners, user_1);
    });

    it("Update Min Owner CORRECT 2",async function(){
        await multisigcontract.UpdateMinOwnersCorrect2(adminPiggyBankProxy, PublicOwners, user_1);
    });

    // ****** Testing Settings Configuration ***************************************************************** //
    it("Admin Piggy Bank Transfer Wrong",async function(){
        let amount = new BigNumber("1000000000000000000");
        await web3.eth.sendTransaction({from:user_1 , to:adminPiggyBankProxy._address, value:amount});
        try{
            await adminPiggyBankProxy.methods.transfer(address_0, amount).send({from: PublicOwners[0], gas: Gas}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(CannotTransferToAddress0);
        }
        try{
            await adminPiggyBankProxy.methods.transfer(chairPerson, amount.multipliedBy(2)).send({from: PublicOwners[0], gas: Gas}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(CannotTransferMoreThan);
        }
        try{
            await adminPiggyBankProxy.methods.transfer(chairPerson, amount).send({from: user_1, gas: Gas}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(MustBeOwner);
        }
        try{
            await adminPiggyBankProxy.methods.transfer(chairPerson, 1).send({from: PublicOwners[0], gas: Gas}, function(error, result){});
            await adminPiggyBankProxy.methods.transfer(chairPerson, 1).send({from: PublicOwners[0], gas: Gas}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(TransferInProgress);
        }
       
    });

});