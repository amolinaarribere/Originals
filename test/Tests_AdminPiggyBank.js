const AdminPiggyBank = artifacts.require("AdminPiggyBank");
const AdminPiggyBankAbi = AdminPiggyBank.abi;

const init = require("../test_libraries/InitializeContracts.js");


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

    beforeEach(async function(){
        let contracts = await init.InitializeContracts(chairPerson, PublicOwners, minOwners, user_1);
        manager = contracts[0];
        adminPiggyBankProxy = new web3.eth.Contract(AdminPiggyBankAbi, contracts[1][4]);
    });


    // ****** Testing Settings Configuration ***************************************************************** //
    it("Admin Piggy Bank Test",async function(){
    });

});