// Chai library for testing
// ERROR tests = First we test the error message then we test the action was not carried out

const OriginalsToken = artifacts.require("OriginalsToken");
const OriginalsTokenAbi = OriginalsToken.abi;
const PropositionSettings = artifacts.require("PropositionSettings");
const PropositionSettingsAbi = PropositionSettings.abi;

const constants = require("../test_libraries/constants.js");
const init = require("../test_libraries/InitializeContracts.js");
const proposition = require("../test_libraries/Propositions.js");
const aux = require("../test_libraries/auxiliaries.js");


const PropositionLifeTime = constants.PropositionLifeTime;
const PropositionThreshold = constants.PropositionThreshold;
const minToPropose = constants.minToPropose;


// TEST -------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------

contract("Testing Proposition Settings",function(accounts){
    var manager;
    var originalsTokenProxy;
    var propositionSettingsProxy;

    // used addresses
    const chairPerson = accounts[0];
    const PublicOwners = [accounts[1], accounts[2], accounts[3]];
    const minOwners = 2;
    const user_1 = accounts[4];
    const tokenOwner = [accounts[5], accounts[6], accounts[7], accounts[8], accounts[9]];
    var PropositionValues = [aux.IntToBytes32(PropositionLifeTime - 1), 
        aux.IntToBytes32(PropositionThreshold - 2), 
        aux.IntToBytes32(minToPropose - 1)];

    beforeEach(async function(){
        let contracts = await init.InitializeContracts(chairPerson, PublicOwners, minOwners, user_1);
        manager = contracts[0];
        originalsTokenProxy = new web3.eth.Contract(OriginalsTokenAbi, contracts[1][2]);
        propositionSettingsProxy = new web3.eth.Contract(PropositionSettingsAbi, contracts[1][3]);
    });


    // ****** Testing Settings Configuration ***************************************************************** //
    it("Retrieve Proposals Details",async function(){
        await proposition.Check_Proposition_Details(propositionSettingsProxy, originalsTokenProxy, chairPerson, tokenOwner, user_1, PropositionValues);
    });

    it("Vote/Propose/Cancel Settings WRONG",async function(){
        await proposition.Config_Proposition_Wrong(propositionSettingsProxy, originalsTokenProxy, tokenOwner, user_1, chairPerson, PropositionValues);
    });

    it("Vote/Propose/Cancel Settings CORRECT",async function(){
        await proposition.Config_Proposition_Correct(propositionSettingsProxy, originalsTokenProxy, tokenOwner, user_1, chairPerson, PropositionValues);
    });

    it("Votes Reassignment Settings",async function(){
        await proposition.Check_Votes_Reassignment(propositionSettingsProxy, originalsTokenProxy, chairPerson, tokenOwner, user_1, PropositionValues);
    });

});