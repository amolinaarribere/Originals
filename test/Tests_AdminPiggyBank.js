const BigNumber = require('bignumber.js');

const constants = require("../test_libraries/constants.js");
const init = require("../test_libraries/InitializeContracts.js");
const multisigcontract = require("../test_libraries/MultiSigContract.js");

const AdminPiggyBank = artifacts.require("AdminPiggyBank");
const AdminPiggyBankAbi = AdminPiggyBank.abi;

const MockDai = artifacts.require("MockDai");
const MockDaiAbi = MockDai.abi;



const Gas = constants.Gas;



// TEST -------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------

contract("Testing Admin Piggy Bank",function(accounts){
    var manager;
    var adminPiggyBankProxy;
    var mockdai;

    // used addresses
    const chairPerson = accounts[0];
    const PublicOwners = [accounts[1], accounts[2], accounts[3]];
    const minOwners = 2;
    const user_1 = accounts[4];
    const extra_owner = accounts[5];
    const address_0 = "0x0000000000000000000000000000000000000000";
    const MustBeOwner = new RegExp("EC9-");
    const HasAlreadyVoted = new RegExp("EC5-");


    const CannotTransferToAddress0 = new RegExp("We cannot transfer to address 0");
    const CannotTransferMoreThan = new RegExp("We cannot transfer more than the current balance");
    const TransferInProgress = new RegExp("Transfer in progress");



    beforeEach(async function(){
        let contracts = await init.InitializeContracts(chairPerson, PublicOwners, minOwners, user_1);
        manager = contracts[0];
        adminPiggyBankProxy = new web3.eth.Contract(AdminPiggyBankAbi, contracts[1][4]);
        mockdai = new web3.eth.Contract(MockDaiAbi, contracts[2][8]);
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
        let amount = new BigNumber("10000");
        await mockdai.methods.transfer(adminPiggyBankProxy._address, amount).send({from: user_1, gas: Gas}, function(error, result){});
        try{
            await adminPiggyBankProxy.methods.transfer(address_0, amount, 0).send({from: PublicOwners[0], gas: Gas}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(CannotTransferToAddress0);
        }
        try{
            await adminPiggyBankProxy.methods.transfer(chairPerson, amount.multipliedBy(2), 0).send({from: PublicOwners[0], gas: Gas}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(CannotTransferMoreThan);
        }
        try{
            await adminPiggyBankProxy.methods.transfer(chairPerson, amount, 0).send({from: user_1, gas: Gas}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(MustBeOwner);
        }
        try{
            await adminPiggyBankProxy.methods.transfer(chairPerson, 1, 0).send({from: PublicOwners[0], gas: Gas}, function(error, result){});
            await adminPiggyBankProxy.methods.transfer(chairPerson, 1, 0).send({from: PublicOwners[0], gas: Gas}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(TransferInProgress);
        }
        try{
            await adminPiggyBankProxy.methods.approve().send({from: user_1, gas: Gas}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(MustBeOwner);
        }
        try{
            await adminPiggyBankProxy.methods.reject().send({from: user_1, gas: Gas}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(MustBeOwner);
        }
        try{
            await adminPiggyBankProxy.methods.approve().send({from: PublicOwners[0], gas: Gas}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(HasAlreadyVoted);
        }
        try{
            await adminPiggyBankProxy.methods.reject().send({from: PublicOwners[0], gas: Gas}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(HasAlreadyVoted);
        }
       
    });

    it("Admin Piggy Bank Transfer Correct",async function(){
        let amount = new BigNumber("10000");
        let transferAmount = amount.dividedBy(2);

        let initialBalance = new BigNumber(await mockdai.methods.balanceOf(chairPerson).call());
        await mockdai.methods.transfer(adminPiggyBankProxy._address, amount).send({from: user_1, gas: Gas}, function(error, result){});
        await adminPiggyBankProxy.methods.transfer(chairPerson, transferAmount, 0).send({from: PublicOwners[0], gas: Gas}, function(error, result){});
        await adminPiggyBankProxy.methods.reject().send({from: PublicOwners[1], gas: Gas}, function(error, result){});
        await adminPiggyBankProxy.methods.reject().send({from: PublicOwners[2], gas: Gas}, function(error, result){});
        let finalBalance = new BigNumber(await mockdai.methods.balanceOf(chairPerson).call());
        expect(initialBalance.toString()).to.equal("0");
        expect(finalBalance.toString()).to.equal("0");

        await adminPiggyBankProxy.methods.transfer(chairPerson, transferAmount, 0).send({from: PublicOwners[0], gas: Gas}, function(error, result){});
        await adminPiggyBankProxy.methods.approve().send({from: PublicOwners[1], gas: Gas}, function(error, result){});
        finalBalance = new BigNumber(await mockdai.methods.balanceOf(chairPerson).call());
        expect(finalBalance.toString()).to.equal(transferAmount.toString());
    });

});