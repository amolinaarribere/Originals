// Chai library for testing
// ERROR tests = First we test the error message then we test the action was not carried out

const CertisToken = artifacts.require("CertisToken");
const CertisTokenAbi = CertisToken.abi;
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
    var certPoolManager;
    var certisTokenProxy;
    var propositionSettingsProxy;

    // used addresses
    const chairPerson = accounts[0];
    const PublicOwners = [accounts[1], accounts[2], accounts[3]];
    const minOwners = 2;
    const user_1 = accounts[4];
    const tokenOwner = [accounts[5], accounts[6], accounts[7], accounts[8], accounts[9]];
    var PropositionValues = [aux.IntToBytes32(PropositionLifeTime), 
        aux.IntToBytes32(PropositionThreshold), 
        aux.IntToBytes32(minToPropose)];

    beforeEach(async function(){
        let contracts = await init.InitializeContracts(chairPerson, PublicOwners, minOwners, user_1);
        certPoolManager = contracts[0];
        certisTokenProxy = new web3.eth.Contract(CertisTokenAbi, contracts[1][2]);
        propositionSettingsProxy = new web3.eth.Contract(PropositionSettingsAbi, contracts[1][6]);
    });


    // ****** Testing Settings Configuration ***************************************************************** //
    it("Retrieve Proposals Details",async function(){
        await proposition.Check_Proposition_Details(propositionSettingsProxy, certisTokenProxy, chairPerson, tokenOwner, user_1, PropositionValues);
    });

    it("Vote/Propose/Cancel Settings WRONG",async function(){
        await proposition.Config_Proposition_Wrong(propositionSettingsProxy, certisTokenProxy, tokenOwner, user_1, chairPerson, PropositionValues);
    });

    it("Vote/Propose/Cancel Settings CORRECT",async function(){
        await proposition.Config_Proposition_Correct(propositionSettingsProxy, certisTokenProxy, tokenOwner, user_1, chairPerson, PropositionValues);
    });

    it("Votes Reassignment Settings",async function(){
        await proposition.Check_Votes_Reassignment(propositionSettingsProxy, certisTokenProxy, chairPerson, tokenOwner, user_1, PropositionValues);
    });

});