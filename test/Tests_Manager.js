// Chai library for testing
// ERROR tests = First we test the error message then we test the action was not carried out

const CertificatesPoolManager = artifacts.require("CertificatesPoolManager");
const CertificatesPoolManagerAbi = CertificatesPoolManager.abi;
const Treasury = artifacts.require("Treasury");
const TreasuryAbi = Treasury.abi;
const PublicCertificatesPool = artifacts.require("PublicCertificatesPool");
const PublicCertificatesPoolAbi = PublicCertificatesPool.abi;
const CertisToken = artifacts.require("CertisToken");
const CertisTokenAbi = CertisToken.abi;
const PrivatePoolFactory = artifacts.require("PrivatePoolFactory");
const PrivatePoolFactoryAbi = PrivatePoolFactory.abi;
const ProviderFactory = artifacts.require("ProviderFactory");
const ProviderFactoryAbi = ProviderFactory.abi;
const PriceConverter = artifacts.require("PriceConverter");
const PriceConverterAbi = PriceConverter.abi;
const PropositionSettings = artifacts.require("PropositionSettings");
const PropositionSettingsAbi = PropositionSettings.abi;
const ENS = artifacts.require("ENS");
const ENSAbi = ENS.abi;

const init = require("../test_libraries/InitializeContracts.js");
const constants = require("../test_libraries/constants.js");
const proposition = require("../test_libraries/Propositions.js");
const aux = require("../test_libraries/auxiliaries.js");


const PrivatePoolContractName = constants.PrivatePoolContractName;
const PrivatePoolContractVersion = constants.PrivatePoolContractVersion;

const Gas = constants.Gas;

// TEST -------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------

contract("Testing Certificate Pool Manager",function(accounts){
    var certContractProxy;

    var certisTokenProxy;
    var publicPoolProxy;
    var treasuryProxy;
    var priceConverterProxy;
    var propositionSettingsProxy;
    var ensProxy;
    var privatePoolFactoryProxy;

    var certisToken;
    var publicPool;
    var treasury;
    var priceConverter;
    var propositionSettings;
    var ens;
    var privatePoolFactory;
    var privatePool;
    var providerFactory;
    var provider;
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
    const address_9 = "0x0000000000000000000000000000000000000009";
    const address_10 = "0x000000000000000000000000000000000000000a";
    const address_11 = "0x000000000000000000000000000000000000000b";
    const emptyBytes = "0x";
    const emptyString = "0x";
    const zeroBytes = "0x0000000000000000000000000000000000000000000000000000000000000000"


    beforeEach(async function(){
        let contracts = await init.InitializeContracts(chairPerson, PublicOwners, minOwners, user_1);
        certContractProxy = new web3.eth.Contract(CertificatesPoolManagerAbi, contracts[0]);
        publicPoolProxy = new web3.eth.Contract(PublicCertificatesPoolAbi, contracts[1][0]);
        treasuryProxy = new web3.eth.Contract(TreasuryAbi, contracts[1][1]);
        certisTokenProxy = new web3.eth.Contract(CertisTokenAbi, contracts[1][2]);
        privatePoolFactoryProxy = new web3.eth.Contract(PrivatePoolFactoryAbi, contracts[1][3]);
        providerFactoryProxy = new web3.eth.Contract(ProviderFactoryAbi, contracts[1][4]);
        priceConverterProxy = new web3.eth.Contract(PriceConverterAbi, contracts[1][5]);
        propositionSettingsProxy = new web3.eth.Contract(PropositionSettingsAbi, contracts[1][6]);
        ensProxy = new web3.eth.Contract(ENSAbi, contracts[1][7]);
        publicPool = contracts[2][0];
        treasury = contracts[2][1];
        certisToken = contracts[2][2];
        privatePoolFactory = contracts[2][3];
        privatePool = contracts[2][4];
        providerFactory = contracts[2][5];
        provider = contracts[2][6];
        priceConverter = contracts[2][7];
        propositionSettings = contracts[2][9];
        ens = contracts[2][10];
        certContract = contracts[4];
    });

    async function checkProxyAddresses( _cma, _ppa, _ta, _ca, _ppfa, _pfa, _pco, _ps, _ens){
        let TransparentProxies = await certContractProxy.methods.retrieveTransparentProxies().call({from: user_1});

        let i = 0;
        let _CertManagerAddressProxy = TransparentProxies[i++];
        let _publicCertPoolAddressProxy = TransparentProxies[i++];
        let _treasuryAddressProxy = TransparentProxies[i++];
        let _certisAddressProxy = TransparentProxies[i++];
        let _privatePoolFactoryAddressProxy = TransparentProxies[i++];
        let _providerFactoryAddressProxy = TransparentProxies[i++];
        let _priceConverterAddressProxy = TransparentProxies[i++];
        let _propositionSettingsAddressProxy = TransparentProxies[i++];
        let _ensAddressProxy = TransparentProxies[i++];
        
        expect(_cma).to.equal(_CertManagerAddressProxy);
        expect(_ppa).to.equal(_publicCertPoolAddressProxy);
        expect(_ta).to.equal(_treasuryAddressProxy);
        expect(_ca).to.equal(_certisAddressProxy);
        expect(_ppfa).to.equal(_privatePoolFactoryAddressProxy);
        expect(_pfa).to.equal(_providerFactoryAddressProxy);
        expect(_pco).to.equal(_priceConverterAddressProxy);
        expect(_ps).to.equal(_propositionSettingsAddressProxy);
        expect(_ens).to.equal(_ensAddressProxy);
    }

    async function checkImplAddresses( _cma, _ppa, _ta, _ca, _ppfa, _prpa, _pfa, _pra, _pco, _ps, _ens, _ppcn, _ppcv){
        let TransparentImpl = await certContractProxy.methods.retrieveTransparentProxiesImpl().call({from: user_1});
        let BeaconsImpl = await certContractProxy.methods.retrieveBeaconsImpl().call({from: user_1});
    
        let i = 0;
        let j = 0;
        let _CertManagerAddress = TransparentImpl[i++];
        let _publicCertPoolAddress = TransparentImpl[i++];
        let _treasuryAddress = TransparentImpl[i++];
        let _certisAddress = TransparentImpl[i++];
        let _privatePoolFactoryAddress = TransparentImpl[i++];
        let _privatePool = BeaconsImpl[j++];
        let _providerFactoryAddress = TransparentImpl[i++];
        let _provider = BeaconsImpl[j++];
        let _priceConverter = TransparentImpl[i++];
        let _propositionSettings = TransparentImpl[i++];
        let _ensSettings = TransparentImpl[i++];

        let _PrivatePoolFactoryConfiguration = await privatePoolFactoryProxy.methods.retrieveConfig().call({from: user_1}, function(error, result){});
        
        expect(_cma).to.equal(_CertManagerAddress);
        expect(_ppa).to.equal(_publicCertPoolAddress);
        expect(_ta).to.equal(_treasuryAddress);
        expect(_ca).to.equal(_certisAddress);
        expect(_ppfa).to.equal(_privatePoolFactoryAddress);
        expect(_prpa).to.equal(_privatePool);
        expect(_pfa).to.equal(_providerFactoryAddress);
        expect(_pra).to.equal(_provider);
        expect(_pco).to.equal(_priceConverter);
        expect(_ps).to.equal(_propositionSettings);
        expect(_ens).to.equal(_ensSettings);
        expect(_ppcn).to.equal(_PrivatePoolFactoryConfiguration[1]);
        expect(_ppcv).to.equal(_PrivatePoolFactoryConfiguration[2]);
    }

    // ****** TESTING Retrieves ***************************************************************** //

    it("Retrieve Configuration",async function(){
        // assert
        await checkProxyAddresses(certContractProxy._address, publicPoolProxy._address, treasuryProxy._address, certisTokenProxy._address, privatePoolFactoryProxy._address, providerFactoryProxy._address, priceConverterProxy._address, propositionSettingsProxy._address, ensProxy._address);
        await checkImplAddresses(certContract, publicPool, treasury, certisToken, privatePoolFactory, privatePool, providerFactory, provider, priceConverter, propositionSettings, ens, PrivatePoolContractName, PrivatePoolContractVersion);
    });

    it("Retrieve Proposals Details",async function(){
        // act
        var PropositionValues = [zeroBytes, zeroBytes, address_1, address_2, address_3, address_4, address_5, address_6, address_7, address_8, address_9, address_10, address_11,
            emptyBytes, emptyBytes, emptyBytes, emptyBytes, emptyBytes, emptyBytes, emptyBytes, emptyBytes, emptyBytes, emptyString, emptyString];

        await proposition.Check_Proposition_Details(certContractProxy, certisTokenProxy, chairPerson, tokenOwner, user_1, PropositionValues);
    });

    // ****** Testing Contracts Configuration ***************************************************************** //
    it("Vote/Propose/Cancel Contracts Config WRONG",async function(){
        var NewValues = [zeroBytes, zeroBytes, address_1, address_2, address_3, address_4, address_5, address_6, address_7, address_8, address_9, address_10,
            emptyBytes, emptyBytes, emptyBytes, emptyBytes, emptyBytes, emptyBytes, emptyBytes, emptyBytes, emptyString, emptyString];

        await proposition.Config_ContractsManager_Wrong(certContractProxy, certisTokenProxy, tokenOwner, user_1, chairPerson, NewValues);
    });

    it("Vote/Propose/Cancel Contracts Config CORRECT",async function(){
        let contracts = await init.deployImplementations(chairPerson);
        let i = 0;
        var NewpublicPool = contracts[i++];
        var Newtreasury = contracts[i++];
        var NewcertisToken = contracts[i++];
        var NewprivatePoolFactory = contracts[i++]; 
        var NewprivatePool = contracts[i++]; 
        var NewproviderFactory = contracts[i++]; 
        var Newprovider = contracts[i++];
        var NewpriceConverter = contracts[i++];
        i++;
        var NewpropositionSettings = contracts[i++];
        var Newens = contracts[i++];
        i++;
        i++;
        i++;
        var NewCertificateManager = contracts[i++];
        var NewPrivatePoolContractName = "New Private Pool Contract Name";
        var NewPrivatePoolContractVersion = "1.34";

        var NewValues = [zeroBytes,
            zeroBytes,
            aux.AddressToBytes32(NewCertificateManager), 
            aux.AddressToBytes32(NewpublicPool), 
            aux.AddressToBytes32(Newtreasury),
            aux.AddressToBytes32(NewcertisToken), 
            aux.AddressToBytes32(NewprivatePoolFactory), 
            aux.AddressToBytes32(NewproviderFactory), 
            aux.AddressToBytes32(NewpriceConverter), 
            aux.AddressToBytes32(NewpropositionSettings), 
            aux.AddressToBytes32(Newens),
            aux.AddressToBytes32(NewprivatePool),
            aux.AddressToBytes32(Newprovider),
            emptyBytes, emptyBytes, emptyBytes, emptyBytes, emptyBytes, emptyBytes, emptyBytes, emptyBytes, emptyBytes, 
            aux.StringToBytes(NewPrivatePoolContractName),
            aux.StringToBytes(NewPrivatePoolContractVersion)];
        
        await proposition.Config_ContractsManager_Correct(certContractProxy, certisTokenProxy, tokenOwner, user_1, chairPerson, NewValues);
    });

    it("Vote/Propose/Cancel Contracts Configuration CORRECT Empty",async function(){
        // act
        var address0 = aux.AddressToBytes32(address_0);
        var PropositionValues = [zeroBytes, zeroBytes, address0, address0, address0, address0, address0, address0, address0, address0, address0, address0, address0,
            emptyBytes, emptyBytes, emptyBytes, emptyBytes, emptyBytes, emptyBytes, emptyBytes, emptyBytes, emptyBytes, emptyString, emptyString];


        await proposition.SplitTokenSupply(certisTokenProxy, tokenOwner, chairPerson);

        // Update contracts validated (address(0)) nothing done
        await certContractProxy.methods.sendProposition(PropositionValues).send({from: chairPerson, gas: Gas});
        await checkImplAddresses(certContract, publicPool, treasury, certisToken, privatePoolFactory, privatePool, providerFactory, provider, priceConverter, propositionSettings, ens, PrivatePoolContractName, PrivatePoolContractVersion);
        await certContractProxy.methods.voteProposition(true).send({from: tokenOwner[0], gas: Gas});
        await checkImplAddresses(certContract, publicPool, treasury, certisToken, privatePoolFactory, privatePool, providerFactory, provider, priceConverter, propositionSettings, ens, PrivatePoolContractName, PrivatePoolContractVersion);
        await certContractProxy.methods.voteProposition(true).send({from: tokenOwner[1], gas: Gas});
        await checkImplAddresses(certContract, publicPool, treasury, certisToken, privatePoolFactory, privatePool, providerFactory, provider, priceConverter, propositionSettings, ens, PrivatePoolContractName, PrivatePoolContractVersion);
        await certContractProxy.methods.voteProposition(true).send({from: tokenOwner[2], gas: Gas});
        await checkImplAddresses(certContract, publicPool, treasury, certisToken, privatePoolFactory, privatePool, providerFactory, provider, priceConverter, propositionSettings, ens, PrivatePoolContractName, PrivatePoolContractVersion);

    });

    it("Votes Reassignment Contracts",async function(){
        var PropositionValues = [zeroBytes, zeroBytes, address_1, address_2, address_3, address_4, address_5, address_6, address_7, address_8, address_9, address_10, address_11,
            emptyBytes, emptyBytes, emptyBytes, emptyBytes, emptyBytes, emptyBytes, emptyBytes, emptyBytes, emptyBytes, emptyString, emptyString];

        await proposition.Check_Votes_Reassignment(certContractProxy, certisTokenProxy, chairPerson, tokenOwner, user_1, PropositionValues);
    });

});
