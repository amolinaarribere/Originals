// Chai library for testing
// ERROR tests = First we test the error message then we test the action was not carried out

const Manager = artifacts.require("Manager");
const ManagerAbi = Manager.abi;
const Treasury = artifacts.require("Treasury");
const TreasuryAbi = Treasury.abi;
const PublicPool = artifacts.require("PublicPool");
const PublicPoolAbi = PublicPool.abi;
const OriginalsToken = artifacts.require("OriginalsToken");
const OriginalsTokenAbi = OriginalsToken.abi;
const PropositionSettings = artifacts.require("PropositionSettings");
const PropositionSettingsAbi = PropositionSettings.abi;
const AdminPiggyBank = artifacts.require("AdminPiggyBank");
const AdminPiggyBankAbi = AdminPiggyBank.abi;
const NFTMarket = artifacts.require("NFTMarket");
const NFTMarketAbi = NFTMarket.abi;
const Payments = artifacts.require("Payments");
const PaymentsAbi = Payments.abi;

const init = require("../test_libraries/InitializeContracts.js");
const constants = require("../test_libraries/constants.js");
const proposition = require("../test_libraries/Propositions.js");
const aux = require("../test_libraries/auxiliaries.js");

const Gas = constants.Gas;

// TEST -------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------

contract("Testing Manager",function(accounts){
    var managerProxy;
    var originalsTokenProxy;
    var publicPoolProxy;
    var treasuryProxy;
    var propositionSettingsProxy;
    var adminPiggyBankProxy;
    var paymentsProxy;


    var manager;
    var originalsToken;
    var publicPool;
    var treasury;
    var propositionSettings;
    var adminPiggyBank;
    var payments;
    var marketNFT;

    // used addresses
    const chairPerson = accounts[0];
    const PublicOwners = [accounts[1], accounts[2], accounts[3]];
    const minOwners = 2;
    const user_1 = accounts[4];
    const tokenOwner = [accounts[5], accounts[6], accounts[7], accounts[8], accounts[9]];
    const address_0 = "0x0000000000000000000000000000000000000000";
    const address_1 = "0x0000000000000000000000000000000000000001";
    const address_2 = "0x0000000000000000000000000000000000000002";
    const address_3 = "0x0000000000000000000000000000000000000003";
    const address_4 = "0x0000000000000000000000000000000000000004";
    const address_5 = "0x0000000000000000000000000000000000000005";
    const address_6 = "0x0000000000000000000000000000000000000006";
    const address_7 = "0x0000000000000000000000000000000000000007";
    const address_8 = "0x0000000000000000000000000000000000000008";
    const emptyBytes = "0x";
    const emptyString = "0x";
    const zeroBytes = "0x0000000000000000000000000000000000000000000000000000000000000000";
    const PropositionValues = [zeroBytes, zeroBytes, address_1, address_2, address_3, address_4, address_5, address_6, address_7, address_8,
        emptyBytes, emptyBytes, emptyBytes, emptyBytes, emptyBytes, emptyBytes, emptyBytes];


    beforeEach(async function(){
        let contracts = await init.InitializeContracts(chairPerson, PublicOwners, minOwners, user_1);
        managerProxy = new web3.eth.Contract(ManagerAbi, contracts[0]);
        publicPoolProxy = new web3.eth.Contract(PublicPoolAbi, contracts[1][0]);
        treasuryProxy = new web3.eth.Contract(TreasuryAbi, contracts[1][1]);
        originalsTokenProxy = new web3.eth.Contract(OriginalsTokenAbi, contracts[1][2]);
        propositionSettingsProxy = new web3.eth.Contract(PropositionSettingsAbi, contracts[1][3]);
        adminPiggyBankProxy = new web3.eth.Contract(AdminPiggyBankAbi, contracts[1][4]);
        paymentsProxy = new web3.eth.Contract(PaymentsAbi, contracts[1][5]);

        publicPool = contracts[2][0];
        treasury = contracts[2][1];
        originalsToken = contracts[2][2];
        propositionSettings = contracts[2][3];
        adminPiggyBank = contracts[2][4];
        marketNFT = contracts[2][5];
        payments = contracts[2][6];
        manager = contracts[4];
    });

    async function checkProxyAddresses( _ma, _ppa, _ta, _oa, _ps, _apb, _pp){
        let TransparentProxies = await managerProxy.methods.retrieveTransparentProxies().call({from: user_1});

        let i = 0;
        let _ManagerAddressProxy = TransparentProxies[i++];
        let _publicPoolAddressProxy = TransparentProxies[i++];
        let _treasuryAddressProxy = TransparentProxies[i++];
        let _originalsAddressProxy = TransparentProxies[i++];
        let _propositionSettingsAddressProxy = TransparentProxies[i++];
        let _adminpiggyBankAddressProxy = TransparentProxies[i++];
        let _paymentsAddressProxy = TransparentProxies[i++];
        
        expect(_ma).to.equal(_ManagerAddressProxy);
        expect(_ppa).to.equal(_publicPoolAddressProxy);
        expect(_ta).to.equal(_treasuryAddressProxy);
        expect(_oa).to.equal(_originalsAddressProxy);
        expect(_ps).to.equal(_propositionSettingsAddressProxy);
        expect(_apb).to.equal(_adminpiggyBankAddressProxy);
        expect(_pp).to.equal(_paymentsAddressProxy);
    }

    async function checkImplAddresses( _ma, _ppa, _ta, _oa, _ps, _apb, _nft, _py){
        let TransparentImpl = await managerProxy.methods.retrieveTransparentProxiesImpl().call({from: user_1});
        let BeaconsImpl = await managerProxy.methods.retrieveBeaconsImpl().call({from: user_1});
    
        let i = 0;
        let j = 0;
        let _managerAddress = TransparentImpl[i++];
        let _publicPoolAddress = TransparentImpl[i++];
        let _treasuryAddress = TransparentImpl[i++];
        let _originalsAddress = TransparentImpl[i++];
        let _propositionSettingsAddress = TransparentImpl[i++];
        let _adminPiggyBankAddress = TransparentImpl[i++];
        let _paymentsAddress = TransparentImpl[i++];

        let _nftAddress = BeaconsImpl[j++];

        
        expect(_ma).to.equal(_managerAddress);
        expect(_ppa).to.equal(_publicPoolAddress);
        expect(_ta).to.equal(_treasuryAddress);
        expect(_oa).to.equal(_originalsAddress);
        expect(_ps).to.equal(_propositionSettingsAddress);
        expect(_apb).to.equal(_adminPiggyBankAddress);
        expect(_nft).to.equal(_nftAddress);
        expect(_py).to.equal(_paymentsAddress);
    }

    // ****** TESTING Retrieves ***************************************************************** //

    it("Retrieve Configuration",async function(){
        // assert
        await checkProxyAddresses(managerProxy._address, publicPoolProxy._address, treasuryProxy._address, originalsTokenProxy._address, propositionSettingsProxy._address, adminPiggyBankProxy._address, paymentsProxy._address);
        await checkImplAddresses(manager, publicPool, treasury, originalsToken, propositionSettings, adminPiggyBank, marketNFT, payments);
    });

    it("Retrieve Proposals Details",async function(){
        await proposition.Check_Proposition_Details(managerProxy, originalsTokenProxy, chairPerson, tokenOwner, user_1, PropositionValues);
    });

    // ****** Testing Contracts Configuration ***************************************************************** //
    it("Vote/Propose/Cancel Contracts Config WRONG",async function(){
        await proposition.Config_ContractsManager_Wrong(managerProxy, originalsTokenProxy, tokenOwner, user_1, chairPerson, PropositionValues);
    });

    it("Vote/Propose/Cancel Contracts Config CORRECT",async function(){
        let contracts = await init.deployImplementations(chairPerson);
        let i = 0;
        var NewpublicPool = contracts[i++];
        var Newtreasury = contracts[i++];
        var NeworiginalsToken = contracts[i++];
        var NewpropositionSettings = contracts[i++];
        var Newadminpiggybank = contracts[i++];
        var Newmarketnft = contracts[i++];
        var Newpayments = contracts[i++];
        i++;
        var NewManager = contracts[i++];

        var NewValues = [zeroBytes,
            zeroBytes,
            aux.AddressToBytes32(NewManager), 
            aux.AddressToBytes32(NewpublicPool), 
            aux.AddressToBytes32(Newtreasury),
            aux.AddressToBytes32(NeworiginalsToken), 
            aux.AddressToBytes32(NewpropositionSettings), 
            aux.AddressToBytes32(Newadminpiggybank),
            aux.AddressToBytes32(Newpayments),
            aux.AddressToBytes32(Newmarketnft),
            emptyBytes, emptyBytes, emptyBytes, emptyBytes, emptyBytes, emptyBytes, emptyBytes];
        
        await proposition.Config_ContractsManager_Correct(managerProxy, originalsTokenProxy, tokenOwner, user_1, chairPerson, NewValues);
    });

    it("Vote/Propose/Cancel Contracts Configuration CORRECT Empty",async function(){
        // act
        var address0 = aux.AddressToBytes32(address_0);
        var PropositionValues_2 = [zeroBytes, zeroBytes, address0, address0, address0, address0, address0, address0, address0, address0,
            emptyBytes, emptyBytes, emptyBytes, emptyBytes, emptyBytes, emptyBytes, emptyBytes];

        await proposition.SplitTokenSupply(originalsTokenProxy, tokenOwner, chairPerson);

        // Update contracts validated (address(0)) nothing done
        await managerProxy.methods.sendProposition(PropositionValues_2).send({from: chairPerson, gas: Gas});
        await checkImplAddresses(manager, publicPool, treasury, originalsToken, propositionSettings, adminPiggyBank, marketNFT, payments);
        await managerProxy.methods.voteProposition(true).send({from: tokenOwner[0], gas: Gas});
        await checkImplAddresses(manager, publicPool, treasury, originalsToken, propositionSettings, adminPiggyBank, marketNFT, payments);
        await managerProxy.methods.voteProposition(true).send({from: tokenOwner[1], gas: Gas});
        await checkImplAddresses(manager, publicPool, treasury, originalsToken, propositionSettings, adminPiggyBank, marketNFT, payments);
        await managerProxy.methods.voteProposition(true).send({from: tokenOwner[2], gas: Gas});
        await checkImplAddresses(manager, publicPool, treasury, originalsToken, propositionSettings, adminPiggyBank, marketNFT, payments);

    });

    it("Votes Reassignment Contracts",async function(){
        await proposition.Check_Votes_Reassignment(managerProxy, originalsTokenProxy, chairPerson, tokenOwner, user_1, PropositionValues);
    });

});
