// Chai library for testing
// ERROR tests = First we test the error message then we test the action was not carried out

const BigNumber = require('bignumber.js');

const CertificatesPoolManager = artifacts.require("CertificatesPoolManager");
const PrivateCertificates = artifacts.require("PrivateCertificatesPool");
var PrivateCertificatesAbi = PrivateCertificates.abi;
const PublicCertificates = artifacts.require("PublicCertificatesPool");
var PublicCertificatesAbi = PublicCertificates.abi;
const Library = artifacts.require("./Libraries/Library");
const constants = require("../test_libraries/constants.js");

const FactorUSDtoETH = Math.pow(10, 18 + constants.decimals - 2) / constants.rate;
const PublicPriceWei = constants.PublicPriceUSD * FactorUSDtoETH;
const CertificatePriceWei = constants.CertificatePriceUSD * FactorUSDtoETH;
const Gas = constants.Gas;
const PublicPoolContractName = constants.PublicPoolContractName;
const PublicPoolContractVersion = constants.PublicPoolContractVersion;
const PrivatePoolContractName = constants.PrivatePoolContractName;
const PrivatePoolContractVersion = constants.PrivatePoolContractVersion;
const minOwners = 2;
// providers info
const provider_1_Info = "Provider 1 Info";
const provider_2_Info = "Provider 2 Info";
// owner info
const extra_owner_Info = "Extra Owner";
// certificates
const hash_1 = "0x3fd54831f488a22b28398de0c567a3b064b937f54f81739ae9bd545967f3abab";
const hash_2 = "0x3fd54832f488a22b28398de0c567a3b064b937f54f81739ae9bd545967f3abab";
// test constants
const NotAnOwner = new RegExp("EC9-");
const OwnerAlreadyvoted = new RegExp("EC5-");
const MustBeActivated = new RegExp("EC7-");
const MinNumberRequired = new RegExp("EC19-");
const NotAProvider = new RegExp("EC12-");
const CertificateAlreadyExists = new RegExp("EC15-");
const CertificateDoesNotExists = new RegExp("EC16-");
const NotToYourself = new RegExp("EC17-");
const NotAllowedToRemoveCertificate = new RegExp("EC14-");
const WrongSender = new RegExp("EC8-");
const NotSentYet = new RegExp("EC28-");
const NotEnoughFunds = new RegExp("EC2-");
const AlreadySent = new RegExp("EC27-");
const AtLeastOne = new RegExp("EC19-");
const MinOwnerNotInProgress = new RegExp("EC31-");
const MinOwnerAlreadyInProgress = new RegExp("EC30-");
const SignatureExpired = new RegExp("EC33-");
const NonceUsed = new RegExp("EC34-");
const WrongSignature = new RegExp("EC32-");

const Domain = "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)";
const DomainHeader = web3.utils.soliditySha3({type: "string", value: Domain});

const address_0 = "0x0000000000000000000000000000000000000000";

function AddressToBytes32(address){
    return ("0x000000000000000000000000" + address.substring(2, address.length)).toLowerCase();
}

async function AddingOwners(CertPool, Owners, extra_owner, validateOrreject){
    await CertPool.methods.addOwner(extra_owner, extra_owner_Info).send({from: Owners[0], gas: Gas}, function(error, result){});
    if(validateOrreject) await CertPool.methods.validateOwner(extra_owner).send({from: Owners[1], gas: Gas}, function(error, result){});
    else await CertPool.methods.rejectOwner(extra_owner).send({from: Owners[1], gas: Gas}, function(error, result){});
}

async function AddingOrValidatingProviders(CertPool, Owners, provider_1, provider_2, isPrivate){
    if(isPrivate) await AddingProviders(CertPool, Owners, provider_1, provider_2, true);
    else await ValidatingProviders(CertPool, Owners, provider_1, provider_2);
}

async function AddingProviders(CertPool, Owners, provider_1, provider_2, validateOrreject){
    await CertPool.methods.addProvider(provider_1, provider_1_Info).send({from: Owners[0], gas: Gas}, function(error, result){});
    await CertPool.methods.addProvider(provider_2, provider_2_Info).send({from: Owners[1], gas: Gas}, function(error, result){});
    if(validateOrreject){
        await CertPool.methods.validateProvider(provider_1).send({from: Owners[1], gas: Gas}, function(error, result){});
        await CertPool.methods.validateProvider(provider_2).send({from: Owners[2], gas: Gas}, function(error, result){});
    }
    else{
        await CertPool.methods.rejectProvider(provider_1).send({from: Owners[1], gas: Gas}, function(error, result){});
        await CertPool.methods.rejectProvider(provider_1).send({from: Owners[2], gas: Gas}, function(error, result){});
        await CertPool.methods.rejectProvider(provider_2).send({from: Owners[2], gas: Gas}, function(error, result){});
        await CertPool.methods.rejectProvider(provider_2).send({from: Owners[0], gas: Gas}, function(error, result){});
    }
    
}

async function ValidatingProviders(CertPool, Owners, provider_1, provider_2){
    await CertPool.methods.validateProvider(provider_1).send({from: Owners[0], gas: Gas}, function(error, result){});
    await CertPool.methods.validateProvider(provider_1).send({from: Owners[1], gas: Gas}, function(error, result){});
    await CertPool.methods.validateProvider(provider_2).send({from: Owners[1], gas: Gas}, function(error, result){});
    await CertPool.methods.validateProvider(provider_2).send({from: Owners[2], gas: Gas}, function(error, result){});
}

async function AddingCertificate(CertPool, provider_1, provider_2, holder_1, holder_2, isPrivate){
    var value_To_Pay = 0;
    if(!isPrivate) value_To_Pay = CertificatePriceWei;
    await CertPool.methods.addCertificate(hash_1, holder_1).send({from: provider_1, gas: Gas, value:value_To_Pay}, function(error, result){});
    await CertPool.methods.addCertificate(hash_1, holder_2).send({from: provider_1, gas: Gas, value:value_To_Pay}, function(error, result){});
    await CertPool.methods.addCertificate(hash_2, holder_1).send({from: provider_2, gas: Gas, value:value_To_Pay}, function(error, result){});
    await CertPool.methods.addCertificate(hash_2, holder_2).send({from: provider_2, gas: Gas, value:value_To_Pay}, function(error, result){});
}

function GetDomainHash(DomainHeader, ContractName, ContractVersion, chainId, ContractAddress){
    return web3.utils.soliditySha3({type: "bytes32", value: DomainHeader},
        {type: "bytes32", value: ContractName},
        {type: "bytes32", value: ContractVersion},
        {type: "uint256", value: chainId},
        {type: "address", value: ContractAddress});
}

function GetFunctionHash(addCertificateOnBehalfOfHeader, provider, hash, holder, nonce, deadline){
    return  web3.utils.soliditySha3({type: "bytes32", value: addCertificateOnBehalfOfHeader},
    {type: "address", value: provider},
    {type: "bytes32", value: hash},
    {type: "address", value: holder},
    {type: "uint256", value: nonce},
    {type: "uint256", value: deadline});
}

async function GetSignature(dataToSign, from){
    let signature = await web3.eth.sign(dataToSign, signer);
    /*let params = [from, dataToSign];
    let method = "eth_signTypedData_v3"

    let signature = await web3.eth.currentProvider.send({method,params,from}, 
        (err, result) => {
          if (err) console.log("error " + err)
          else if (result.error) console.log("result error " + JSON.stringify(result.error))
          else return result.result
        });
    console.log(signature)*/
    //signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");
    return signature
}

async function SignMessage(CertPool, provider, hash, holder, nonce, ContractName, ContractVersion, deadline){
    // general
    const chainId = await web3.eth.getChainId();
    let ContractAddress = CertPool._address;
    // domain hash
    //const addCertificateOnBehalfOfType = "addCertificateOnBehalfOf(address provider,bytes32 certificateHash,address holder,uint256 nonce,uint256 deadline)"
    //let addCertificateOnBehalfOfHeader = web3.utils.soliditySha3({type: "string", value: addCertificateOnBehalfOfType});
    let domainHash = GetDomainHash(DomainHeader, ContractName, ContractVersion, chainId, ContractAddress);
    // function hash
    let functionHash = GetFunctionHash(addCertificateOnBehalfOfHeader, provider, hash, holder, nonce, deadline);
    //let dataToSign = web3.utils.soliditySha3({type: "bytes32", value: domainHash}, {type: "bytes32", value: functionHash});

    /*let dataToSign = '{"domain":{"name":"'
    + ContractName
    +'","version":"'
    + ContractVersion
    +'","chainId":'
    + chainId 
    + ',"verifyingContract":"'
    + ContractAddress
    + '"},"message":{"provider":"'
    + provider
    +'","certificateHash":"'
    + hash
    +'","holder":"'
    + holder
    +'","nonce":'
    + nonce
    +',"deadline":'
    + deadline
    +'},"primaryType":"addCertificateOnBehalfOf","types":{"EIP712Domain":[{"name":"name","type":"string"},{"name":"version","type":"string"},{"name":"chainId","type":"uint256"},{"name":"verifyingContract","type":"address"}],"addCertificateOnBehalfOf":[{"name":"provider","type":"address"},{"name":"certificateHash","type":"bytes32"},{"name":"holder","type":"address"},{"name":"nonce","type":"uint256"},{"name":"deadline","type":"uint256"}]}}'*/

    return await GetSignature(dataToSign, provider);
}

async function AddingCertificateOnBehalfOf(CertPool, provider_1, provider_2, holder_1, holder_2, isPrivate, user_1){
    let value_To_Pay = 0;
    let deadline = Math.ceil(Date.now() / 1000) + 120;
    let nonce = 0;

    //let ContractName =  web3.utils.keccak256(web3.utils.stringToHex(PrivatePoolContractName));
    //let ContractVersion = web3.utils.keccak256(web3.utils.stringToHex(PrivatePoolContractVersion));
    let ContractName =  PrivatePoolContractName;
    let ContractVersion = PrivatePoolContractVersion;

    if(!isPrivate) {
        value_To_Pay = CertificatePriceWei;
        //ContractName = web3.utils.keccak256(web3.utils.stringToHex(PublicPoolContractName));
        //ContractVersion = web3.utils.keccak256(web3.utils.stringToHex(PublicPoolContractVersion));
        ContractName =  PublicPoolContractName;
        ContractVersion = PublicPoolContractVersion;
    }

    // signature
    let signature_1 = await SignMessage(CertPool, provider_1, hash_1, holder_1, nonce, ContractName, ContractVersion, deadline);
    //let signature_2 = await SignMessage(CertPool, provider_1, hash_1, holder_2, nonce + 1, ContractName, ContractVersion, deadline);
    //let signature_3 = await SignMessage(CertPool, provider_2, hash_2, holder_1, nonce, ContractName, ContractVersion, deadline);
    //let signature_4 = await SignMessage(CertPool, provider_2, hash_2, holder_2, nonce + 1, ContractName, ContractVersion, deadline);

    await CertPool.methods.addCertificateOnBehalfOf(provider_1, hash_1, holder_1, nonce, deadline, signature_1).send({from: user_1, gas: Gas, value:value_To_Pay}, function(error, result){});
    //await CertPool.methods.addCertificateOnBehalfOf(provider_1, hash_1, holder_1, nonce, deadline, signature_1).send({from: user_1, gas: Gas, value:value_To_Pay}, function(error, result){});
    //await CertPool.methods.addCertificateOnBehalfOf(provider_1, hash_1, holder_2, nonce + 1, deadline, signature_2).send({from: user_1, gas: Gas, value:value_To_Pay}, function(error, result){});
    //await CertPool.methods.addCertificateOnBehalfOf(provider_2, hash_2, holder_1, nonce, deadline, signature_3).send({from: user_1, gas: Gas, value:value_To_Pay}, function(error, result){});
    //await CertPool.methods.addCertificateOnBehalfOf(provider_2, hash_2, holder_2, nonce + 1, deadline, signature_4).send({from: user_1, gas: Gas, value:value_To_Pay}, function(error, result){});
}

async function AddOwnerWrong(CertPool, Owners, extra_owner, user_1){
    // act
    try{
        await CertPool.methods.addOwner(extra_owner, extra_owner_Info).send({from: user_1, gas: Gas}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(NotAnOwner);
    }
    // act
    try{
        await CertPool.methods.addOwner(extra_owner, extra_owner_Info).send({from: Owners[0], gas: Gas}, function(error, result){});
        await CertPool.methods.validateOwner(extra_owner).send({from: Owners[0], gas: Gas}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(OwnerAlreadyvoted);
    }
    // act
    try{
        await CertPool.methods.rejectOwner(extra_owner).send({from: Owners[0], gas: Gas}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(OwnerAlreadyvoted);
    }
    // act
    try{
        await CertPool.methods.validateOwner(extra_owner).send({from: user_1, gas: Gas}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(NotAnOwner);
    }
    // act
    try{
        await CertPool.methods.rejectOwner(extra_owner).send({from: user_1, gas: Gas}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(NotAnOwner);
    }
}

async function AddOwnerCorrect(CertPool, Owners, extra_owner, user_1){
    // act
    await AddingOwners(CertPool, Owners, extra_owner, true);
    // assert
    let {0:Owner_Extra,1:isOwner} = await CertPool.methods.retrieveOwner(extra_owner).call({from: user_1}, function(error, result){});
    let AllOwners = await CertPool.methods.retrieveAllOwners().call({from: user_1}, function(error, result){});
    Total = AllOwners.length;
    let MinOwners = await CertPool.methods.retrieveMinOwners().call({from: user_1}, function(error, result){});
    expect(Owner_Extra).to.equal(extra_owner_Info);
    expect(isOwner).to.be.true;
    expect(Total).to.equal(4);
    expect(AllOwners[0]).to.equal(AddressToBytes32(Owners[0]));
    expect(AllOwners[1]).to.equal(AddressToBytes32(Owners[1]));
    expect(AllOwners[2]).to.equal(AddressToBytes32(Owners[2]));
    expect(AllOwners[3]).to.equal(AddressToBytes32(extra_owner));
    expect(MinOwners).to.equal(minOwners.toString());
};

async function AddOwnerCorrect2(CertPool, Owners, extra_owner, user_1){
    // act
    await AddingOwners(CertPool, Owners, extra_owner, false);
    // assert
    let {0:Owner_Extra,1:isOwner} = await CertPool.methods.retrieveOwner(extra_owner).call({from: user_1}, function(error, result){});
    let AllOwners = await CertPool.methods.retrieveAllOwners().call({from: user_1}, function(error, result){});
    Total = AllOwners.length;
    let MinOwners = await CertPool.methods.retrieveMinOwners().call({from: user_1}, function(error, result){});
    expect(Owner_Extra).to.equal(extra_owner_Info);
    expect(isOwner).to.be.false;
    expect(Total).to.equal(3);
    expect(AllOwners[0]).to.equal(AddressToBytes32(Owners[0]));
    expect(AllOwners[1]).to.equal(AddressToBytes32(Owners[1]));
    expect(AllOwners[2]).to.equal(AddressToBytes32(Owners[2]));
    expect(MinOwners).to.equal(minOwners.toString());
};

async function RemoveOwnerWrong(CertPool, Owners, provider_3, user_1){
    //act
    try{
        await CertPool.methods.removeOwner(Owners[2]).send({from: user_1, gas: Gas}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(NotAnOwner);
    }
    // act
    try{
        await CertPool.methods.removeOwner(provider_3).send({from: Owners[0]}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(MustBeActivated);
    }
    // act
    try{
        await CertPool.methods.removeOwner(Owners[2]).send({from: Owners[0], gas: Gas}, function(error, result){});
        await CertPool.methods.validateOwner(Owners[2]).send({from: Owners[0], gas: Gas}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(OwnerAlreadyvoted);
    }
    // act
    try{
        await CertPool.methods.rejectOwner(Owners[2]).send({from: Owners[0], gas: Gas}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(OwnerAlreadyvoted);
    }
    // act
    try{
        await CertPool.methods.removeOwner(Owners[1]).send({from: Owners[0], gas: Gas}, function(error, result){});
        await CertPool.methods.validateOwner(Owners[1]).send({from: Owners[2], gas: Gas}, function(error, result){});
        await CertPool.methods.validateOwner(Owners[2]).send({from: Owners[2], gas: Gas}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(MinNumberRequired);
    }
}

async function RemoveOwnerCorrect(CertPool, Owners, user_1){
    // act
    await CertPool.methods.removeOwner(Owners[2]).send({from: Owners[0], gas: Gas}, function(error, result){});
    await CertPool.methods.validateOwner(Owners[2]).send({from: Owners[1], gas: Gas}, function(error, result){});
    // assert
    let All = await CertPool.methods.retrieveAllOwners().call({from: user_1}, function(error, result){});
    let Total = All.length;
    expect(Total).to.equal(2);
};

async function RemoveOwnerCorrect2(CertPool, Owners, user_1){
    // act
    await CertPool.methods.removeOwner(Owners[2]).send({from: Owners[0], gas: Gas}, function(error, result){});
    await CertPool.methods.rejectOwner(Owners[2]).send({from: Owners[1], gas: Gas}, function(error, result){});
    await CertPool.methods.rejectOwner(Owners[2]).send({from: Owners[2], gas: Gas}, function(error, result){});
    // assert
    let All = await CertPool.methods.retrieveAllOwners().call({from: user_1}, function(error, result){});
    let Total = All.length;
    expect(Total).to.equal(3);
};

async function AddProviderWrong(CertPool, Owners, provider_1, user_1, isPrivate){
    if(isPrivate){
        // act
        try{
            await CertPool.methods.addProvider(provider_1, provider_1_Info).send({from: user_1, gas: Gas}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(NotAnOwner);
        }
        // act
        try{
            await CertPool.methods.addProvider(provider_1, provider_1_Info).send({from: Owners[0], gas: Gas}, function(error, result){});
            await CertPool.methods.validateProvider(provider_1).send({from: Owners[0], gas: Gas}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(OwnerAlreadyvoted);
        }
        // act
        try{
            await CertPool.methods.rejectProvider(provider_1).send({from: Owners[0], gas: Gas}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(OwnerAlreadyvoted);
        }
        // act
        try{
            await CertPool.methods.validateProvider(provider_1).send({from: user_1, gas: Gas}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(NotAnOwner);
        }
        // act
        try{
            await CertPool.methods.rejectProvider(provider_1).send({from: user_1, gas: Gas}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(NotAnOwner);
        }
    }
    else{
        // act
        try{
            await CertPool.methods.addProvider(provider_1, provider_1_Info).send({from: user_1, gas: Gas, value: PublicPriceWei}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(AlreadySent);
        }
        // act
        try{
            await CertPool.methods.addProvider(user_1, provider_1_Info).send({from: user_1, gas: Gas, value: PublicPriceWei - 1}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(NotEnoughFunds);
        }
    }
    
}

async function ValidateProviderWrong(CertPool, Owners, provider_1, provider_3, user_1){
    // act
    try{
        await CertPool.methods.validateProvider(provider_1).send({from: user_1, gas: Gas}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(NotAnOwner);
    }
     // act
     try{
        await CertPool.methods.rejectProvider(provider_1).send({from: user_1, gas: Gas}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(NotAnOwner);
    }
   // act
    try{
        await CertPool.methods.validateProvider(provider_1).send({from: Owners[0], gas: Gas}, function(error, result){});
        await CertPool.methods.validateProvider(provider_1).send({from: Owners[0], gas: Gas}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(OwnerAlreadyvoted);
    }
    // act
    try{
        await CertPool.methods.rejectProvider(provider_1).send({from: Owners[0], gas: Gas}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(OwnerAlreadyvoted);
    }
    // act
    try{
        await CertPool.methods.validateProvider(provider_3).send({from: Owners[0], gas: Gas}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(NotSentYet);
    }
    // act
    try{
        await CertPool.methods.rejectProvider(provider_3).send({from: Owners[0], gas: Gas}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(NotSentYet);
    }
}

async function ValidateProviderCorrect(CertPool, Owners, provider_1, provider_2, user_1){
    // act
    await ValidatingProviders(CertPool, Owners, provider_1, provider_2);
    // assert
    let {0:Provider_1,1:isProvider_1} = await CertPool.methods.retrieveProvider(provider_1).call({from: user_1}, function(error, result){});
    let {0:Provider_2,1:isProvider_2} = await CertPool.methods.retrieveProvider(provider_2).call({from: user_1}, function(error, result){});
    let AllProviders = await CertPool.methods.retrieveAllProviders().call({from: user_1}, function(error, result){});
    let Total = AllProviders.length;
    expect(Provider_1).to.equal(provider_1_Info);
    expect(isProvider_1).to.be.true;
    expect(Provider_2).to.equal(provider_2_Info);
    expect(isProvider_2).to.be.true;
    expect(Total).to.equal(2);
    expect(AllProviders[0]).to.equal(AddressToBytes32(provider_1));
    expect(AllProviders[1]).to.equal(AddressToBytes32(provider_2));
}

async function AddProviderCorrect(CertPool, Owners, provider_1, provider_2, user_1){
    // act
    await AddingProviders(CertPool, Owners, provider_1, provider_2, true);
    // assert
    let {0:Provider_1,1:isProvider_1} = await CertPool.methods.retrieveProvider(provider_1).call({from: user_1}, function(error, result){});
    let {0:Provider_2,1:isProvider_2} = await CertPool.methods.retrieveProvider(provider_2).call({from: user_1}, function(error, result){});
    let AllProviders = await CertPool.methods.retrieveAllProviders().call({from: user_1}, function(error, result){});
    let Total = AllProviders.length;
    expect(Provider_1).to.equal(provider_1_Info);
    expect(isProvider_1).to.be.true;
    expect(Provider_2).to.equal(provider_2_Info);
    expect(isProvider_2).to.be.true;
    expect(Total).to.equal(2);
    expect(AllProviders[0]).to.equal(AddressToBytes32(provider_1));
    expect(AllProviders[1]).to.equal(AddressToBytes32(provider_2));
}

async function AddProviderCorrect2(CertPool, Owners, provider_1, provider_2, user_1){
    // act
    await AddingProviders(CertPool, Owners, provider_1, provider_2, false);
    // assert
    let {0:Provider_1,1:isProvider_1} = await CertPool.methods.retrieveProvider(provider_1).call({from: user_1}, function(error, result){});
    let {0:Provider_2,1:isProvider_2} = await CertPool.methods.retrieveProvider(provider_2).call({from: user_1}, function(error, result){});
    let AllProviders = await CertPool.methods.retrieveAllProviders().call({from: user_1}, function(error, result){});
    let Total = AllProviders.length;
    expect(Provider_1).to.equal("");
    expect(isProvider_1).to.be.false;
    expect(Provider_2).to.equal("");
    expect(isProvider_2).to.be.false;
    expect(Total).to.equal(0);
}

async function RemoveProviderWrong(CertPool, Owners, provider_1, provider_2, provider_3, user_1, isPrivate){
    // act
    await AddingOrValidatingProviders(CertPool, Owners, provider_1, provider_2, isPrivate)

    try{
        await CertPool.methods.removeProvider(provider_1).send({from: user_1, gas: Gas}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(NotAnOwner);
    }
    // act
    try{
        await CertPool.methods.removeProvider(provider_3).send({from: Owners[0], gas: Gas}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(MustBeActivated);
    }
    // act
    try{
        await CertPool.methods.removeProvider(provider_1).send({from: Owners[0], gas: Gas}, function(error, result){});
        await CertPool.methods.validateProvider(provider_1).send({from: Owners[0], gas: Gas}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(OwnerAlreadyvoted);
    }
    // act
    try{
        await CertPool.methods.rejectProvider(provider_1).send({from: Owners[0], gas: Gas}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(OwnerAlreadyvoted);
    }
}

async function RemoveProviderCorrect(CertPool, Owners, provider_1, provider_2, user_1, isPrivate){
    // act
    await AddingOrValidatingProviders(CertPool, Owners, provider_1, provider_2, isPrivate)
    await CertPool.methods.removeProvider(provider_1).send({from: Owners[2], gas: Gas}, function(error, result){});
    await CertPool.methods.validateProvider(provider_1).send({from: Owners[0], gas: Gas}, function(error, result){});
    // assert
    let All = await CertPool.methods.retrieveAllProviders().call({from: user_1}, function(error, result){});
    let Total = All.length;
    expect(Total).to.equal(1);
}

async function RemoveProviderCorrect2(CertPool, Owners, provider_1, provider_2, user_1, isPrivate){
    // act
    await AddingOrValidatingProviders(CertPool, Owners, provider_1, provider_2, isPrivate)
    await CertPool.methods.removeProvider(provider_1).send({from: Owners[2], gas: Gas}, function(error, result){});
    await CertPool.methods.rejectProvider(provider_1).send({from: Owners[0], gas: Gas}, function(error, result){});
    await CertPool.methods.rejectProvider(provider_1).send({from: Owners[1], gas: Gas}, function(error, result){});

    // assert
    let All = await CertPool.methods.retrieveAllProviders().call({from: user_1}, function(error, result){});
    let Total = All.length;
    expect(Total).to.equal(2);
}

async function AddCertificateWrong(CertPool, Owners, provider_1, provider_2, holder_1, user_1, isPrivate){
    // act
    await AddingOrValidatingProviders(CertPool, Owners, provider_1, provider_2, isPrivate)
    var value_To_Pay = 0;
    if(!isPrivate) value_To_Pay = CertificatePriceWei;

    try{
        await CertPool.methods.addCertificate(hash_1, holder_1).send({from: user_1, gas: Gas, value:value_To_Pay}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(NotAProvider);
    }
    // act
    try{
        await CertPool.methods.addCertificate(hash_1, holder_1).send({from: provider_1, gas: Gas, value:value_To_Pay}, function(error, result){});
        await CertPool.methods.addCertificate(hash_1, holder_1).send({from: provider_1, gas: Gas, value:value_To_Pay}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(CertificateAlreadyExists);
    }
    // act
    try{
        await CertPool.methods.addCertificate(hash_1, holder_1).send({from: provider_2, gas: Gas, value:value_To_Pay}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(CertificateAlreadyExists);
    }
    if(!isPrivate){
        // act
        try{
            await CertPool.methods.addCertificate(hash_1, holder_1).send({from: provider_1, gas: Gas, value:value_To_Pay - 1}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(NotEnoughFunds);
        }
    }
    
}

async function AddCertificateCorrect(CertPool, Owners, provider_1, provider_2, holder_1, holder_2, user_1, isPrivate){
    // act
    await AddingOrValidatingProviders(CertPool, Owners, provider_1, provider_2, isPrivate)
    await AddingCertificate(CertPool, provider_1, provider_2, holder_1, holder_2, isPrivate);
    // assert
    await CheckCertificatesAdded(CertPool, provider_1, provider_2, holder_1, holder_2, user_1);
}

async function AddCertificateOnBehalfWrong(CertPool, Owners, provider_1, provider_2, holder_1, holder_2, user_1, isPrivate){
    // act
    await AddingOrValidatingProviders(CertPool, Owners, provider_1, provider_2, isPrivate)
    var value_To_Pay = 0;
    let deadline = Math.ceil(Date.now() / 1000) + 120;
    let ContractName =  web3.utils.keccak256(web3.utils.stringToHex(PrivatePoolContractName));
    let ContractVersion = web3.utils.keccak256(web3.utils.stringToHex(PrivatePoolContractVersion));

    if(!isPrivate) {
        value_To_Pay = CertificatePriceWei;
        ContractName = web3.utils.keccak256(web3.utils.stringToHex(PublicPoolContractName));
        ContractVersion = web3.utils.keccak256(web3.utils.stringToHex(PublicPoolContractVersion));
    }

    let signature = await SignMessage(CertPool, provider_1, hash_1, holder_1, 0, ContractName, ContractVersion, deadline);

    try{
        await CertPool.methods.addCertificateOnBehalfOf(provider_1, hash_1, holder_1, 0, deadline - 2000, signature).send({from: user_1, gas: Gas, value:value_To_Pay}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(SignatureExpired);
    }
    // act
    try{
        await CertPool.methods.addCertificateOnBehalfOf(provider_2, hash_1, holder_1, 0, deadline, signature).send({from: user_1, gas: Gas, value:value_To_Pay}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(WrongSignature);
    }
    // act
    try{
        await CertPool.methods.addCertificateOnBehalfOf(provider_1, hash_2, holder_1, 0, deadline, signature).send({from: user_1, gas: Gas, value:value_To_Pay}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(WrongSignature);
    }
    // act
    try{
        await CertPool.methods.addCertificateOnBehalfOf(provider_1, hash_1, holder_2, 0, deadline, signature).send({from: user_1, gas: Gas, value:value_To_Pay}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(WrongSignature);
    }
    // act
    try{
        await CertPool.methods.addCertificateOnBehalfOf(provider_1, hash_1, holder_1, 1000, deadline, signature).send({from: user_1, gas: Gas, value:value_To_Pay}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(WrongSignature);
    }
    // act
    try{
        await CertPool.methods.addCertificateOnBehalfOf(provider_1, hash_1, holder_1, 0, deadline + 1000, signature).send({from: user_1, gas: Gas, value:value_To_Pay}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(WrongSignature);
    }
    // act
    try{
        await CertPool.methods.addCertificateOnBehalfOf(provider_1, hash_1, holder_1, 0, deadline, signature).send({from: user_1, gas: Gas, value:value_To_Pay}, function(error, result){});
        await CertPool.methods.addCertificateOnBehalfOf(provider_1, hash_1, holder_1, 0, deadline, signature).send({from: user_1, gas: Gas, value:value_To_Pay}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(NonceUsed);
    }
    // act
    if(!isPrivate){
        // act
        try{
            await CertPool.methods.addCertificateOnBehalfOf(provider_1, hash_1, holder_1, 0, deadline, signature).send({from: user_1, gas: Gas, value:value_To_Pay - 1}, function(error, result){});
            expect.fail();
        }
        // assert
        catch(error){
            expect(error.message).to.match(NotEnoughFunds);
        }
    }
}

async function AddCertificateOnBehalfCorrect(CertPool, Owners, provider_1, provider_2, holder_1, holder_2, user_1, isPrivate){
    // act
    await AddingOrValidatingProviders(CertPool, Owners, provider_1, provider_2, isPrivate)
    await AddingCertificateOnBehalfOf(CertPool, provider_1, provider_2, holder_1, holder_2, isPrivate, user_1);
    // assert
    //await CheckCertificatesAdded(CertPool, provider_1, provider_2, holder_1, holder_2, user_1);
}

async function TransferCertificateWrong(CertPool, Owners, provider_1, provider_2, holder_1, holder_2, user_1, isPrivate){
    try{
        await CertPool.methods.transferCertificate(hash_1, holder_1).send({from: user_1, gas: Gas}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(CertificateDoesNotExists);
    }
    try{
        await AddingOrValidatingProviders(CertPool, Owners, provider_1, provider_2, isPrivate);
        await AddingCertificate(CertPool, provider_1, provider_2, holder_1, holder_2, isPrivate);
        await CertPool.methods.transferCertificate(hash_1, holder_1).send({from: holder_1, gas: Gas}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(NotToYourself);
    }
}

async function TransferCertificateCorrect(CertPool, Owners, provider_1, provider_2, holder_1, holder_2, user_1, isPrivate){
    // act
    await AddingOrValidatingProviders(CertPool, Owners, provider_1, provider_2, isPrivate);
    await AddANDTransferCertificate(CertPool, provider_1, provider_2, holder_1, holder_2, user_1, isPrivate);
    await AddANDTransferCertificate(CertPool, provider_2, provider_1, holder_1, holder_2, user_1, isPrivate);
    // assert
    await CheckCertificatesTransfered(CertPool, provider_1, provider_2, holder_1, holder_2, user_1);
}

async function CheckCertificatesAdded(CertPool, provider_1, provider_2, holder_1, holder_2, user_1){
    // assert
    let Provider_1 = await CertPool.methods.retrieveCertificateProvider(hash_1, holder_1).call({from: user_1}, function(error, result){});
    let Provider_1b = await CertPool.methods.retrieveCertificateProvider(hash_1, holder_2).call({from: user_1}, function(error, result){});
    let Provider_2 = await CertPool.methods.retrieveCertificateProvider(hash_2, holder_1).call({from: user_1}, function(error, result){});
    let Provider_2b = await CertPool.methods.retrieveCertificateProvider(hash_2, holder_2).call({from: user_1}, function(error, result){});
    let TotalHolder_1 = await CertPool.methods.retrieveTotalCertificatesByHolder(holder_1).call({from: user_1}, function(error, result){});
    let TotalHolder_2 = await CertPool.methods.retrieveTotalCertificatesByHolder(holder_2).call({from: user_1}, function(error, result){});
    let CertificatesHolder1 = await CertPool.methods.retrieveCertificatesByHolder(holder_1, 0, 2).call({from: user_1}, function(error, result){});
    let CertificatesHolder1b = await CertPool.methods.retrieveCertificatesByHolder(holder_1, 1, 20).call({from: user_1}, function(error, result){});
    let CertificatesHolder2 = await CertPool.methods.retrieveCertificatesByHolder(holder_2, 0, 2).call({from: user_1}, function(error, result){});
    let CertificatesHolder2b = await CertPool.methods.retrieveCertificatesByHolder(holder_2, 0, 1).call({from: user_1}, function(error, result){});
    
    expect(Provider_1).to.equal(provider_1);
    expect(Provider_1b).to.equal(provider_1);
    expect(Provider_2).to.equal(provider_2);
    expect(Provider_2b).to.equal(provider_2);
    expect(TotalHolder_1).to.equal("2");
    expect(TotalHolder_2).to.equal("2");
    expect(CertificatesHolder1[0]).to.equal(hash_1);
    expect(CertificatesHolder1[1]).to.equal(hash_2);
    expect(CertificatesHolder2[0]).to.equal(hash_1);
    expect(CertificatesHolder2[1]).to.equal(hash_2);
    expect(CertificatesHolder1b[0]).to.equal(hash_2);
    expect(CertificatesHolder2b[0]).to.equal(hash_1);
}

async function AddANDTransferCertificate(CertPool, provider_1, provider_2, holder_1, holder_2, user_1, isPrivate){
    await AddingCertificate(CertPool, provider_1, provider_2, holder_1, holder_2, isPrivate);
    await CertPool.methods.transferCertificate(hash_1, user_1).send({from: holder_1, gas: Gas}, function(error, result){});
    await CertPool.methods.transferCertificate(hash_2, user_1).send({from: holder_2, gas: Gas}, function(error, result){});
    await CertPool.methods.transferCertificate(hash_2, user_1).send({from: holder_1, gas: Gas}, function(error, result){});
    await CertPool.methods.transferCertificate(hash_1, user_1).send({from: holder_2, gas: Gas}, function(error, result){});
}

async function CheckCertificatesTransfered(CertPool, provider_1, provider_2, holder_1, holder_2, user_1){
    // assert
    let Provider_1 = await CertPool.methods.retrieveCertificateProvider(hash_1, holder_1).call({from: user_1}, function(error, result){});
    let Provider_1b = await CertPool.methods.retrieveCertificateProvider(hash_1, holder_2).call({from: user_1}, function(error, result){});
    let Provider_1c = await CertPool.methods.retrieveCertificateProvider(hash_1, user_1).call({from: user_1}, function(error, result){});

    let Provider_2 = await CertPool.methods.retrieveCertificateProvider(hash_2, holder_1).call({from: user_1}, function(error, result){});
    let Provider_2b = await CertPool.methods.retrieveCertificateProvider(hash_2, holder_2).call({from: user_1}, function(error, result){});
    let Provider_2c = await CertPool.methods.retrieveCertificateProvider(hash_2, user_1).call({from: user_1}, function(error, result){});

    let TotalHolder_1 = await CertPool.methods.retrieveTotalCertificatesByHolder(holder_1).call({from: user_1}, function(error, result){});
    let TotalHolder_2 = await CertPool.methods.retrieveTotalCertificatesByHolder(holder_2).call({from: user_1}, function(error, result){});
    let TotalHolder_3 = await CertPool.methods.retrieveTotalCertificatesByHolder(user_1).call({from: user_1}, function(error, result){});

    
    expect(Provider_1).to.equal(provider_2);
    expect(Provider_1b).to.equal(provider_2);
    expect(Provider_1c).to.equal(provider_1);

    expect(Provider_2).to.equal(provider_1);
    expect(Provider_2b).to.equal(provider_1);
    expect(Provider_2c).to.equal(provider_2);

    expect(TotalHolder_1).to.equal("2");
    expect(TotalHolder_2).to.equal("2");
    expect(TotalHolder_3).to.equal("2");

}

async function RemoveCertificateWrong(CertPool, Owners, provider_1, provider_2, holder_1, holder_2, user_1, isPrivate){
    // act
    await AddingOrValidatingProviders(CertPool, Owners, provider_1, provider_2, isPrivate)
    await AddingCertificate(CertPool, provider_1, provider_2, holder_1, holder_2, isPrivate);

    try{
        await CertPool.methods.removeCertificate(hash_1, holder_1).send({from: user_1}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(NotAProvider);
    }
    // act
    try{
        await CertPool.methods.removeCertificate(hash_1, holder_1).send({from: provider_2}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(NotAllowedToRemoveCertificate);
    }
    
}

async function RemoveCertificateCorrect(CertPool, Owners, provider_1, provider_2, holder_1, holder_2, user_1, isPrivate){
    // act
    await AddingOrValidatingProviders(CertPool, Owners, provider_1, provider_2, isPrivate)
    await AddingCertificate(CertPool, provider_1, provider_2, holder_1, holder_2, isPrivate);
    await CertPool.methods.removeCertificate(hash_1, holder_1).send({from: provider_1, gas: Gas}, function(error, result){});
    // assert
    let Total = await CertPool.methods.retrieveTotalCertificatesByHolder(holder_1).call({from: user_1}, function(error, result){});
    expect(Total).to.equal("1");
}

async function onItemValidatedWrong(Contract, user_1){
    // act
    try{
        var ids = [1,2,3];
        await Contract.methods.onItemValidated(hash_1, ids, true).send({from: user_1}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(WrongSender);
    }
}

async function onItemRejectedWrong(Contract, user_1){
    // act
    try{
        var ids = [1,2,3];
        await Contract.methods.onItemRejected(hash_1, ids, true).send({from: user_1}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(WrongSender);
    }
}

async function UpdateMinOwnersWrong(CertPool, Owners, user_1){
    // act
    try{
        await CertPool.methods.changeMinOwners(1).send({from: user_1, gas: Gas}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(NotAnOwner);
    }
    // act
    try{
        await CertPool.methods.changeMinOwners(Owners.length + 1).send({from: Owners[0], gas: Gas}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(MinNumberRequired);
    }
    // act
    try{
        await CertPool.methods.changeMinOwners(0).send({from: Owners[0], gas: Gas}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(AtLeastOne);
    }
    // act
    try{
        await CertPool.methods.validateMinOwners().send({from: Owners[0], gas: Gas}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(MinOwnerNotInProgress);
    }
    // act
    try{
        await CertPool.methods.rejectMinOwners().send({from: Owners[0], gas: Gas}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(MinOwnerNotInProgress);
    }
    // act
    try{
        await CertPool.methods.changeMinOwners(1).send({from: Owners[0], gas: Gas}, function(error, result){});
        await CertPool.methods.changeMinOwners(2).send({from: Owners[1], gas: Gas}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(MinOwnerAlreadyInProgress);
    }
    // act
    try{
        await CertPool.methods.validateMinOwners().send({from: Owners[0], gas: Gas}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(OwnerAlreadyvoted);
    }
    // act
    try{
        await CertPool.methods.rejectMinOwners().send({from: Owners[0], gas: Gas}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(OwnerAlreadyvoted);
    }
     // act
     try{
        await CertPool.methods.validateMinOwners().send({from: user_1, gas: Gas}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(NotAnOwner);
    }
    // act
    try{
        await CertPool.methods.rejectMinOwners().send({from: user_1, gas: Gas}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(NotAnOwner);
    }
}

async function UpdateMinOwnersCorrect(CertPool, Owners, user_1){
    // act
    var NewMinOwner = 1;
    var pendingMinOwnerBefore = parseInt(await CertPool.methods.retrievePendingMinOwners().call({from: user_1, gas: Gas}, function(error, result){}));
    var MinOwnerBefore = parseInt(await CertPool.methods.retrieveMinOwners().call({from: user_1, gas: Gas}, function(error, result){}));

    await CertPool.methods.changeMinOwners(NewMinOwner).send({from: Owners[0], gas: Gas}, function(error, result){});
    var pendingMinOwner = parseInt(await CertPool.methods.retrievePendingMinOwners().call({from: user_1, gas: Gas}, function(error, result){}));
    var MinOwner = parseInt(await CertPool.methods.retrieveMinOwners().call({from: user_1, gas: Gas}, function(error, result){}));

    await CertPool.methods.validateMinOwners().send({from: Owners[1], gas: Gas}, function(error, result){});
    var pendingMinOwnerAfter = parseInt(await CertPool.methods.retrievePendingMinOwners().call({from: user_1, gas: Gas}, function(error, result){}));
    var MinOwnerAfter = parseInt(await CertPool.methods.retrieveMinOwners().call({from: user_1, gas: Gas}, function(error, result){}));
    // assert
    expect(pendingMinOwnerBefore).to.equal(0);
    expect(MinOwnerBefore).to.equal(2);
    expect(pendingMinOwner).to.equal(NewMinOwner);
    expect(MinOwner).to.equal(2);
    expect(pendingMinOwnerAfter).to.equal(0);
    expect(MinOwnerAfter).to.equal(NewMinOwner);
};

async function UpdateMinOwnersCorrect2(CertPool, Owners, user_1){
    // act
    var NewMinOwner = 1;
    var pendingMinOwnerBefore = parseInt(await CertPool.methods.retrievePendingMinOwners().call({from: user_1, gas: Gas}, function(error, result){}));
    var MinOwnerBefore = parseInt(await CertPool.methods.retrieveMinOwners().call({from: user_1, gas: Gas}, function(error, result){}));

    await CertPool.methods.changeMinOwners(NewMinOwner).send({from: Owners[0], gas: Gas}, function(error, result){});
    var pendingMinOwner = parseInt(await CertPool.methods.retrievePendingMinOwners().call({from: user_1, gas: Gas}, function(error, result){}));
    var MinOwner = parseInt(await CertPool.methods.retrieveMinOwners().call({from: user_1, gas: Gas}, function(error, result){}));

    await CertPool.methods.rejectMinOwners().send({from: Owners[1], gas: Gas}, function(error, result){});
    await CertPool.methods.rejectMinOwners().send({from: Owners[2], gas: Gas}, function(error, result){});
    var pendingMinOwnerAfter = parseInt(await CertPool.methods.retrievePendingMinOwners().call({from: user_1, gas: Gas}, function(error, result){}));
    var MinOwnerAfter = parseInt(await CertPool.methods.retrieveMinOwners().call({from: user_1, gas: Gas}, function(error, result){}));
    // assert
    expect(pendingMinOwnerBefore).to.equal(0);
    expect(MinOwnerBefore).to.equal(2);
    expect(pendingMinOwner).to.equal(NewMinOwner);
    expect(MinOwner).to.equal(2);
    expect(pendingMinOwnerAfter).to.equal(0);
    expect(MinOwnerAfter).to.equal(2);
};

exports.AddOwnerWrong = AddOwnerWrong;
exports.AddOwnerCorrect = AddOwnerCorrect;
exports.AddOwnerCorrect2 = AddOwnerCorrect2;
exports.RemoveOwnerWrong = RemoveOwnerWrong;
exports.RemoveOwnerCorrect = RemoveOwnerCorrect;
exports.RemoveOwnerCorrect2 = RemoveOwnerCorrect2;
exports.AddProviderWrong = AddProviderWrong;
exports.ValidateProviderWrong = ValidateProviderWrong;
exports.ValidateProviderCorrect = ValidateProviderCorrect;
exports.AddProviderCorrect = AddProviderCorrect;
exports.AddProviderCorrect2 = AddProviderCorrect2;
exports.RemoveProviderWrong = RemoveProviderWrong;
exports.RemoveProviderCorrect = RemoveProviderCorrect;
exports.RemoveProviderCorrect2 = RemoveProviderCorrect2;
exports.AddCertificateWrong = AddCertificateWrong;
exports.AddCertificateCorrect = AddCertificateCorrect;
exports.AddCertificateOnBehalfWrong = AddCertificateOnBehalfWrong;
exports.AddCertificateOnBehalfCorrect = AddCertificateOnBehalfCorrect;
exports.TransferCertificateWrong = TransferCertificateWrong;
exports.TransferCertificateCorrect = TransferCertificateCorrect;
exports.RemoveCertificateWrong = RemoveCertificateWrong;
exports.RemoveCertificateCorrect = RemoveCertificateCorrect;
exports.ValidatingProviders = ValidatingProviders;
exports.onItemValidatedWrong = onItemValidatedWrong;
exports.onItemRejectedWrong = onItemRejectedWrong;
exports.UpdateMinOwnersWrong = UpdateMinOwnersWrong;
exports.UpdateMinOwnersCorrect = UpdateMinOwnersCorrect;
exports.UpdateMinOwnersCorrect2 = UpdateMinOwnersCorrect2;
exports.AddressToBytes32 = AddressToBytes32;


