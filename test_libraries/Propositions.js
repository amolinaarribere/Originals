const constants = require("./constants.js");
const aux = require("./auxiliaries.js");

const TotalTokenSupply = constants.TotalTokenSupply;
const Gas = constants.Gas;

// test constants
const Unauthorized = new RegExp("EC8-");
const CannotProposeChanges = new RegExp("EC22-");
const WrongConfig = new RegExp("EC21-");
const NoPropositionActivated = new RegExp("EC25-");
const PropositionAlreadyInProgress = new RegExp("EC24-");
const CanNotVote = new RegExp("EC23-");

const PrivatePoolFactory = artifacts.require("PrivatePoolFactory");
const PrivatePoolFactoryAbi = PrivatePoolFactory.abi;
const emptyBytes = "0x";
const address_0 = "0x0000000000000000000000000000000000000000";
const zeroBytes = "0x0000000000000000000000000000000000000000000000000000000000000000"


async function SplitTokenSupply(CT, tokenOwner, chairPerson){
    await CT.methods.transfer(tokenOwner[0], (TotalTokenSupply / 5)).send({from: chairPerson, gas: Gas}, function(error, result){});
    await CT.methods.transfer(tokenOwner[1], (TotalTokenSupply / 5)).send({from: chairPerson, gas: Gas}, function(error, result){});
    await CT.methods.transfer(tokenOwner[2], (TotalTokenSupply / 5)).send({from: chairPerson, gas: Gas}, function(error, result){});
    await CT.methods.transfer(tokenOwner[3], (TotalTokenSupply / 5)).send({from: chairPerson, gas: Gas}, function(error, result){});
    await CT.methods.transfer(tokenOwner[4], (TotalTokenSupply / 5)).send({from: chairPerson, gas: Gas}, function(error, result){});
}

async function checkProposition(contractAddress, Values, user_1){
    var propositionResult = await contractAddress.methods.retrieveProposition().call({from: user_1});
    for(let i=0; i < propositionResult.length; i++){
        expect(Values[i]).to.equal(propositionResult[i]);
    }
}

async function returnContractManagerSettings(contractAddress, user_1){
    let TransparentProxies = await contractAddress.methods.retrieveTransparentProxies().call({from: user_1});
    let TransparentImpl = await contractAddress.methods.retrieveTransparentProxiesImpl().call({from: user_1});
    let BeaconsImpl = await contractAddress.methods.retrieveBeaconsImpl().call({from: user_1});

    let i = 0;
    let j = 0;
    let _certManagerAddress = TransparentImpl[i++];
    let _publicCertPoolAddress = TransparentImpl[i++];
    let _treasuryAddress = TransparentImpl[i++];
    let _certisAddress = TransparentImpl[i++];
    let pos = i;
    let _privatePoolFactoryAddress = TransparentImpl[i++];
    let _privatePool = BeaconsImpl[j++];
    let _providerFactoryAddress = TransparentImpl[i++];
    let _provider = BeaconsImpl[j++];
    let _priceConverter = TransparentImpl[i++];
    let _propositionSettings = TransparentImpl[i++];
    let _ensSettings = TransparentImpl[i++];


    let _privatePoolFactoryProxyAddress = TransparentProxies[pos];
    privatePoolFactoryProxy = new web3.eth.Contract(PrivatePoolFactoryAbi, _privatePoolFactoryProxyAddress);

    let _PrivatePoolFactoryConfiguration = await privatePoolFactoryProxy.methods.retrieveConfig().call({from: user_1}, function(error, result){});

    return [zeroBytes,
        zeroBytes,
        _certManagerAddress,
        _publicCertPoolAddress, 
        _treasuryAddress,
        _certisAddress,
        _privatePoolFactoryAddress,
        _providerFactoryAddress,
        _priceConverter,
        _propositionSettings,
        _ensSettings,
        _privatePool,
        _provider,
        emptyBytes,
        emptyBytes, 
        emptyBytes, 
        emptyBytes, 
        emptyBytes, 
        emptyBytes, 
        emptyBytes, 
        emptyBytes, 
        emptyBytes, 
        _PrivatePoolFactoryConfiguration[1],
        _PrivatePoolFactoryConfiguration[2]]
}

// checks

async function checkPriceConverter(contractAddress, addressBytes, user_1){
    let _registryAddress =  await contractAddress.methods.retrieveSettings().call({from: user_1}, function(error, result){});
    expect(aux.Bytes32ToAddress(addressBytes[0])).to.equal(_registryAddress);
}

async function checkPropositionSettings(contractAddress, propBytes, user_1){
    let _propSettings =  await contractAddress.methods.retrieveSettings().call({from: user_1}, function(error, result){});
    for(let i=0; i < 3; i++){
        expect(aux.Bytes32ToInt(propBytes[i])).to.equal(parseInt(_propSettings[i]));
    }
}

async function checkENS(contractAddress, ENSBytes, user_1){
    let _ENS =  await contractAddress.methods.retrieveSettings().call({from: user_1}, function(error, result){});

    if(address_0 != aux.Bytes32ToAddress(ENSBytes[0])) expect(aux.Bytes32ToAddress(ENSBytes[0])).to.equal(_ENS[0]);
    else expect(aux.Bytes32ToAddress(ENSBytes[0])).to.not.equal(_ENS[0]);

    if(address_0 != aux.Bytes32ToAddress(ENSBytes[1])) expect(aux.Bytes32ToAddress(ENSBytes[1])).to.equal(_ENS[1]);
    else expect(aux.Bytes32ToAddress(ENSBytes[1])).to.not.equal(_ENS[1]);

    if(emptyBytes != ENSBytes[2]) expect(ENSBytes[2]).to.equal(_ENS[2]);
    else expect(ENSBytes[2]).to.not.equal(_ENS[2]);

    if(emptyBytes != ENSBytes[3]) expect(ENSBytes[3]).to.equal(_ENS[3]);
    else expect(ENSBytes[3]).to.not.equal(_ENS[3]);

    if(emptyBytes != ENSBytes[4]) expect(aux.BytesToString(ENSBytes[4])).to.equal(_ENS[4]);
    else expect(aux.BytesToString(ENSBytes[4])).to.not.equal(_ENS[4]);

    if(emptyBytes != ENSBytes[5]) expect(aux.BytesToString(ENSBytes[5])).to.equal(_ENS[5]);
    else expect(aux.BytesToString(ENSBytes[5])).to.not.equal(_ENS[5]);

}

async function checkPrice(contractAddress, PricesBytes, user_1){
    let _Prices =  await contractAddress.methods.retrieveSettings().call({from: user_1}, function(error, result){});
    for(let i=0; i < 5; i++){
        expect(aux.Bytes32ToInt(PricesBytes[i])).to.equal(parseInt(_Prices[i]));
    }

}

async function checkContracts(contractAddress, ContractsBytes, user_1){
    let _Contracts = await returnContractManagerSettings(contractAddress, user_1);
    let i = 2;
    expect(aux.Bytes32ToAddress(ContractsBytes[i])).to.equal(_Contracts[i++]);
    expect(aux.Bytes32ToAddress(ContractsBytes[i])).to.equal(_Contracts[i++]);
    expect(aux.Bytes32ToAddress(ContractsBytes[i])).to.equal(_Contracts[i++]);
    expect(aux.Bytes32ToAddress(ContractsBytes[i])).to.equal(_Contracts[i++]);
    expect(aux.Bytes32ToAddress(ContractsBytes[i])).to.equal(_Contracts[i++]);
    expect(aux.Bytes32ToAddress(ContractsBytes[i])).to.equal(_Contracts[i++]);
    expect(aux.Bytes32ToAddress(ContractsBytes[i])).to.equal(_Contracts[i++]);
    expect(aux.Bytes32ToAddress(ContractsBytes[i])).to.equal(_Contracts[i++]);
    expect(aux.Bytes32ToAddress(ContractsBytes[i])).to.equal(_Contracts[i++]);
    expect(aux.Bytes32ToAddress(ContractsBytes[i])).to.equal(_Contracts[i++]);
    expect(aux.Bytes32ToAddress(ContractsBytes[i])).to.equal(_Contracts[i++]);
    i++;
    i++;
    i++;
    i++;
    i++;
    i++;
    i++;
    i++;
    i++;
    expect(aux.BytesToString(ContractsBytes[i])).to.equal(_Contracts[i++]);
    expect(aux.BytesToString(ContractsBytes[i])).to.equal(_Contracts[i++]);
}

// tests

async function Config_Proposition_Wrong(contractAddress, certisTokenProxy, tokenOwner, user_1, chairPerson, NewValues){
    await Config_CommonProposition_Wrong(contractAddress, certisTokenProxy, tokenOwner, user_1, chairPerson, NewValues);
    let tooMuch = TotalTokenSupply + 1;
    // act
    try{
        await contractAddress.methods.sendProposition([NewValues[0], aux.IntToBytes32(tooMuch), NewValues[2]]).send({from: chairPerson, gas: Gas}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(WrongConfig);
    }
    // act
    try{
        await contractAddress.methods.sendProposition([NewValues[0], NewValues[1], aux.IntToBytes32(tooMuch)]).send({from: chairPerson, gas: Gas}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(WrongConfig);
    }
    
};

async function Config_Proposition_Correct(contractAddress, certisTokenProxy, tokenOwner, user_1, chairPerson, NewValues){
    let _propositionSettings =  await contractAddress.methods.retrieveSettings().call({from: user_1}, function(error, result){});
    let InitValue = [aux.IntToBytes32(_propositionSettings[0]), aux.IntToBytes32(_propositionSettings[1]), aux.IntToBytes32(_propositionSettings[2])];
    await Config_CommonProposition_Correct(contractAddress, certisTokenProxy, tokenOwner, user_1, chairPerson, NewValues, InitValue, checkPropositionSettings, true);
   
};

async function Config_PriceConverter_Wrong(contractAddress, certisTokenProxy, tokenOwner, user_1, chairPerson, NewValues){
    await Config_CommonProposition_Wrong(contractAddress, certisTokenProxy, tokenOwner, user_1, chairPerson, NewValues);
    // act
    try{
        await contractAddress.methods.sendProposition([aux.AddressToBytes32(address_0)]).send({from: chairPerson, gas: Gas}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(WrongConfig);
    }
};

async function Config_PriceConverter_Correct(contractAddress, certisTokenProxy, tokenOwner, user_1, chairPerson, NewValues){
    let _registryAddress =  await contractAddress.methods.retrieveSettings().call({from: user_1}, function(error, result){});
    let InitValue = [aux.AddressToBytes32(_registryAddress)];
    await Config_CommonProposition_Correct(contractAddress, certisTokenProxy, tokenOwner, user_1, chairPerson, NewValues, InitValue, checkPriceConverter, true);
};

async function Config_ENS_Wrong(contractAddress, certisTokenProxy, tokenOwner, user_1, chairPerson, NewValues){
    await Config_CommonProposition_Wrong(contractAddress, certisTokenProxy, tokenOwner, user_1, chairPerson, NewValues);
    // act
    try{
        await contractAddress.methods.sendProposition([aux.AddressToBytes32(address_0), aux.AddressToBytes32(address_0), emptyBytes, emptyBytes, emptyBytes, emptyBytes]).send({from: chairPerson, gas: Gas}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(WrongConfig);
    }
};

async function Config_ENS_Correct(contractAddress, certisTokenProxy, tokenOwner, user_1, chairPerson, NewValues){
    let _ENSSettings =  await contractAddress.methods.retrieveSettings().call({from: user_1}, function(error, result){});
    let InitValue = [aux.AddressToBytes32(_ENSSettings[0]), aux.AddressToBytes32(_ENSSettings[1]), _ENSSettings[2], _ENSSettings[3], aux.StringToBytes(_ENSSettings[4]),  aux.StringToBytes(_ENSSettings[5])];
    for(let i=0; i < NewValues.length; i++){
        await Config_CommonProposition_Correct(contractAddress, certisTokenProxy, tokenOwner, user_1, chairPerson, NewValues[i], InitValue, checkENS, ((0==i)?true:false));
    }
};

async function Config_Treasury_Wrong(contractAddress, certisTokenProxy, tokenOwner, user_1, chairPerson, NewValues){
    await Config_CommonProposition_Wrong(contractAddress, certisTokenProxy, tokenOwner, user_1, chairPerson, NewValues);
    // act
    try{
        await contractAddress.methods.sendProposition([NewValues[0], NewValues[1], NewValues[2], NewValues[3], aux.IntToBytes32(aux.Bytes32ToInt(NewValues[0]) + 1)]).send({from: chairPerson, gas: Gas}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(WrongConfig);
    }
    
};

async function Config_Treasury_Correct(contractAddress, certisTokenProxy, tokenOwner, user_1, chairPerson, NewValues ){
    let _price =  await contractAddress.methods.retrieveSettings().call({from: user_1}, function(error, result){});
    let InitValue = [aux.IntToBytes32(_price[0]), aux.IntToBytes32(_price[1]), aux.IntToBytes32(_price[2]), aux.IntToBytes32(_price[3]), aux.IntToBytes32(_price[4])];
    await Config_CommonProposition_Correct(contractAddress, certisTokenProxy, tokenOwner, user_1, chairPerson, NewValues, InitValue, checkPrice, true);
   
};

async function Config_ContractsManager_Wrong(contractAddress, certisTokenProxy, tokenOwner, user_1, chairPerson, NewValues){
    await Config_CommonProposition_Wrong(contractAddress, certisTokenProxy, tokenOwner, user_1, chairPerson, NewValues);
};

async function Config_ContractsManager_Correct(contractAddress, certisTokenProxy, tokenOwner, user_1, chairPerson, NewValues){
    let result = await returnContractManagerSettings(contractAddress, user_1);
    let i=0;
    let InitValue = [result[i++],
        result[i++],
        aux.AddressToBytes32(result[i++]),
        aux.AddressToBytes32(result[i++]),
        aux.AddressToBytes32(result[i++]),
        aux.AddressToBytes32(result[i++]),
        aux.AddressToBytes32(result[i++]),
        aux.AddressToBytes32(result[i++]),
        aux.AddressToBytes32(result[i++]),
        aux.AddressToBytes32(result[i++]),
        aux.AddressToBytes32(result[i++]),
        aux.AddressToBytes32(result[i++]),
        aux.AddressToBytes32(result[i++]),
        result[i++],
        result[i++],
        result[i++],
        result[i++],
        result[i++],
        result[i++],
        result[i++],
        result[i++],
        result[i++],
        aux.StringToBytes(result[i++]),
        aux.StringToBytes(result[i++]),
    ];
    await Config_CommonProposition_Correct(contractAddress, certisTokenProxy, tokenOwner, user_1, chairPerson, NewValues, InitValue, checkContracts, true);
   
};

/////////////////////

function EmptyPropositions(Array){
    var EmptyProposition = []
    for(let i=0; i < Array.length; i++){
        EmptyProposition.push(emptyBytes);
    }
    return EmptyProposition;
}

async function Config_CommonProposition_Wrong(contractAddress, certisTokenProxy, tokenOwner, user_1, chairPerson, NewValues){
    // act
    await SplitTokenSupply(certisTokenProxy, tokenOwner, chairPerson);
    try{
        await contractAddress.methods.sendProposition(NewValues).send({from: user_1, gas: Gas}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(CannotProposeChanges);
    }
    // act
    try{
        await contractAddress.methods.voteProposition(false).send({from: tokenOwner[0], gas: Gas}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(NoPropositionActivated);
    }
    // act
    try{
        await contractAddress.methods.cancelProposition().send({from: chairPerson, gas: Gas}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(NoPropositionActivated);
    }
    // act
    try{
        await contractAddress.methods.sendProposition(NewValues).send({from: chairPerson, gas: Gas}, function(error, result){});
        await contractAddress.methods.voteProposition(false).send({from: chairPerson, gas: Gas}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(CanNotVote);
    }
    // act
    try{
        await contractAddress.methods.cancelProposition().send({from: tokenOwner[0], gas: Gas}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(Unauthorized);
    }
    // act
    try{
        await contractAddress.methods.sendProposition(NewValues).send({from: chairPerson, gas: Gas}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(PropositionAlreadyInProgress);
    }
    // act
    try{
        await contractAddress.methods.voteProposition(false).send({from: tokenOwner[0], gas: Gas}, function(error, result){});
        await contractAddress.methods.voteProposition(false).send({from: tokenOwner[0], gas: Gas}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(CanNotVote);
    }
    // act
    try{
        await contractAddress.methods.voteProposition(false).send({from: tokenOwner[1], gas: Gas}, function(error, result){});
        await contractAddress.methods.voteProposition(false).send({from: tokenOwner[2], gas: Gas}, function(error, result){});
        await contractAddress.methods.voteProposition(false).send({from: tokenOwner[3], gas: Gas}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(NoPropositionActivated);
    }
    
};

async function Config_CommonProposition_Correct(contractAddress, certisTokenProxy, tokenOwner, user_1, chairPerson, NewValues, InitValue, checkFunction, fullTest){
    var EmptyProposition = EmptyPropositions(NewValues);

    if(fullTest){
        // act
        await SplitTokenSupply(certisTokenProxy, tokenOwner, chairPerson);
    
        // Rejected 
        await contractAddress.methods.sendProposition(NewValues).send({from: chairPerson, gas: Gas}, function(error, result){});
        await checkFunction(contractAddress, InitValue, user_1);
        await contractAddress.methods.voteProposition(false).send({from: tokenOwner[0], gas: Gas}, function(error, result){});
        await checkFunction(contractAddress, InitValue, user_1);
        await contractAddress.methods.voteProposition(false).send({from: tokenOwner[1], gas: Gas}, function(error, result){});
        await checkFunction(contractAddress, InitValue, user_1);
        await contractAddress.methods.voteProposition(false).send({from: tokenOwner[2], gas: Gas}, function(error, result){});
        await checkFunction(contractAddress, InitValue, user_1);
        await checkProposition(contractAddress, EmptyProposition, user_1);
    
        // Cancelled
        await contractAddress.methods.sendProposition(NewValues).send({from: chairPerson, gas: Gas}, function(error, result){});
        await checkFunction(contractAddress, InitValue, user_1);
        await contractAddress.methods.voteProposition(true).send({from: tokenOwner[0], gas: Gas}, function(error, result){});
        await checkFunction(contractAddress, InitValue, user_1);
        await contractAddress.methods.voteProposition(true).send({from: tokenOwner[1], gas: Gas}, function(error, result){});
        await checkFunction(contractAddress, InitValue, user_1);
        await contractAddress.methods.cancelProposition().send({from: chairPerson, gas: Gas}, function(error, result){});
        await checkFunction(contractAddress, InitValue, user_1);
        await checkProposition(contractAddress, EmptyProposition, user_1);
    }
    
    // Validated
    await contractAddress.methods.sendProposition(NewValues).send({from: chairPerson, gas: Gas}, function(error, result){});
    await checkFunction(contractAddress, InitValue, user_1);
    await contractAddress.methods.voteProposition(true).send({from: tokenOwner[0], gas: Gas}, function(error, result){});
    await checkFunction(contractAddress, InitValue, user_1);
    await contractAddress.methods.voteProposition(true).send({from: tokenOwner[1], gas: Gas}, function(error, result){});
    await checkFunction(contractAddress, InitValue, user_1);
    await contractAddress.methods.voteProposition(true).send({from: tokenOwner[2], gas: Gas}, function(error, result){});
    await checkFunction(contractAddress, NewValues, user_1);
    await checkProposition(contractAddress, EmptyProposition, user_1);

    // Validated again
    await contractAddress.methods.sendProposition(InitValue).send({from: chairPerson, gas: Gas}, function(error, result){});
    await checkFunction(contractAddress, NewValues, user_1);
    await contractAddress.methods.voteProposition(false).send({from: tokenOwner[0], gas: Gas}, function(error, result){});
    await checkFunction(contractAddress, NewValues, user_1);
    await contractAddress.methods.voteProposition(true).send({from: tokenOwner[1], gas: Gas}, function(error, result){});
    await checkFunction(contractAddress, NewValues, user_1);
    await contractAddress.methods.voteProposition(false).send({from: tokenOwner[2], gas: Gas}, function(error, result){});
    await checkFunction(contractAddress, NewValues, user_1);
    await contractAddress.methods.voteProposition(true).send({from: tokenOwner[3], gas: Gas}, function(error, result){});
    await checkFunction(contractAddress, NewValues, user_1);
    await contractAddress.methods.voteProposition(true).send({from: tokenOwner[4], gas: Gas}, function(error, result){});
    await checkFunction(contractAddress, InitValue, user_1);
    await checkProposition(contractAddress, EmptyProposition, user_1);
  
 };

async function Check_Proposition_Details(contractAddress, certisTokenProxy, chairPerson, tokenOwner, user_1, PropositionValues){
    // act
    await SplitTokenSupply(certisTokenProxy, tokenOwner, chairPerson);
    await contractAddress.methods.sendProposition(PropositionValues).send({from: chairPerson, gas: Gas});
    // assert
    await checkProposition(contractAddress, PropositionValues, user_1);
}

async function Check_Votes_Reassignment(contractAddress, certisTokenProxy, chairPerson, tokenOwner, user_1, PropositionValues){
    // act
    await SplitTokenSupply(certisTokenProxy, tokenOwner, chairPerson);
    await contractAddress.methods.sendProposition(PropositionValues).send({from: chairPerson, gas: Gas});
    let propID = await contractAddress.methods.retrieveNextPropId().call({from: user_1, gas: Gas}, function(error, result){});
    await contractAddress.methods.voteProposition(false).send({from: tokenOwner[0], gas: Gas}, function(error, result){});

    // assert
    let Votes00 = await contractAddress.methods.retrieveVotesForVoter(propID - 1, tokenOwner[0]).call({from: user_1, gas: Gas}, function(error, result){});
    let Votes10 = await contractAddress.methods.retrieveVotesForVoter(propID - 1, tokenOwner[1]).call({from: user_1, gas: Gas}, function(error, result){});
    let Votes20 = await contractAddress.methods.retrieveVotesForVoter(propID - 1, tokenOwner[2]).call({from: user_1, gas: Gas}, function(error, result){});
    expect(parseInt(Votes00)).to.equal(TotalTokenSupply / 5);
    expect(parseInt(Votes10)).to.equal(0);
    expect(parseInt(Votes20)).to.equal(0);

    await certisTokenProxy.methods.transfer(tokenOwner[2], (TotalTokenSupply / 10)).send({from: tokenOwner[0], gas: Gas}, function(error, result){});
    await certisTokenProxy.methods.transfer(tokenOwner[2], (TotalTokenSupply / 10)).send({from: tokenOwner[1], gas: Gas}, function(error, result){});

    let Votes01 = await contractAddress.methods.retrieveVotesForVoter(propID - 1, tokenOwner[0]).call({from: user_1, gas: Gas}, function(error, result){});
    let Votes11 = await contractAddress.methods.retrieveVotesForVoter(propID - 1, tokenOwner[1]).call({from: user_1, gas: Gas}, function(error, result){});
    let Votes21 = await contractAddress.methods.retrieveVotesForVoter(propID - 1, tokenOwner[2]).call({from: user_1, gas: Gas}, function(error, result){});
    expect(parseInt(Votes01)).to.equal(TotalTokenSupply / 10);
    expect(parseInt(Votes11)).to.equal(0);
    expect(parseInt(Votes21)).to.equal(TotalTokenSupply / 10);

    await certisTokenProxy.methods.transfer(tokenOwner[2], (TotalTokenSupply / 10)).send({from: tokenOwner[0], gas: Gas}, function(error, result){});
    await certisTokenProxy.methods.transfer(tokenOwner[2], (TotalTokenSupply / 10)).send({from: tokenOwner[1], gas: Gas}, function(error, result){});

    let Votes02 = await contractAddress.methods.retrieveVotesForVoter(propID - 1, tokenOwner[0]).call({from: user_1, gas: Gas}, function(error, result){});
    let Votes12 = await contractAddress.methods.retrieveVotesForVoter(propID - 1, tokenOwner[1]).call({from: user_1, gas: Gas}, function(error, result){});
    let Votes22 = await contractAddress.methods.retrieveVotesForVoter(propID - 1, tokenOwner[2]).call({from: user_1, gas: Gas}, function(error, result){});
    expect(parseInt(Votes02)).to.equal(0);
    expect(parseInt(Votes12)).to.equal(0);
    expect(parseInt(Votes22)).to.equal(TotalTokenSupply / 5);

}

exports.Config_Proposition_Wrong = Config_Proposition_Wrong;
exports.Config_Proposition_Correct = Config_Proposition_Correct;
exports.Config_PriceConverter_Wrong = Config_PriceConverter_Wrong;
exports.Config_PriceConverter_Correct = Config_PriceConverter_Correct;
exports.Config_ENS_Wrong = Config_ENS_Wrong;
exports.Config_ENS_Correct = Config_ENS_Correct;
exports.Config_Treasury_Wrong = Config_Treasury_Wrong;
exports.Config_Treasury_Correct = Config_Treasury_Correct;
exports.Config_ContractsManager_Wrong = Config_ContractsManager_Wrong;
exports.Config_ContractsManager_Correct = Config_ContractsManager_Correct;
exports.SplitTokenSupply = SplitTokenSupply;
exports.Check_Proposition_Details = Check_Proposition_Details;
exports.Check_Votes_Reassignment = Check_Votes_Reassignment;