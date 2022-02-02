const BigNumber = require('bignumber.js');

const constants = require("../test_libraries/constants.js");
const init = require("../test_libraries/InitializeContracts.js");
const multisigcontract = require("../test_libraries/MultiSigContract.js");

const PublicPool = artifacts.require("PublicPool");
const PublicPoolAbi = PublicPool.abi;


const Gas = constants.Gas;



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
    const address_0 = "0x0000000000000000000000000000000000000000";
    const MustBeOwner = new RegExp("EC9-");

    const CannotTransferToAddress0 = new RegExp("We cannot transfer to address 0");
    const CannotTransferMoreThan = new RegExp("We cannot transfer more than the current balance");
    const TransferInProgress = new RegExp("Transfer in progress");



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

});