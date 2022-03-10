const constants = require("./constants.js");
const aux = require("./auxiliaries.js");

const TotalTokenSupply = constants.TotalTokenSupply;
const Gas = constants.Gas;

// test constants
const Unauthorized = new RegExp("EC8-");
const CannotProposeChanges = new RegExp("EC22-");
const WrongConfig = new RegExp("EC21-");
const TokenAddressesWrong = new RegExp("For each address and index must be provided");
const NoPropositionActivated = new RegExp("EC25-");
const PropositionAlreadyInProgress = new RegExp("EC24-");
const CanNotVote = new RegExp("EC23-");

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
    let TransparentImpl = await contractAddress.methods.retrieveTransparentProxiesImpl().call({from: user_1});
    let BeaconsImpl = await contractAddress.methods.retrieveBeaconsImpl().call({from: user_1});

    let i = 0;
    let j = 0;
    let _managerAddress = TransparentImpl[i++];
    let _publicPoolAddress = TransparentImpl[i++];
    let _treasuryAddress = TransparentImpl[i++];
    let _originalsAddress = TransparentImpl[i++];
    let _propositionSettings = TransparentImpl[i++];
    let _adminPiggyBank = TransparentImpl[i++];
    let _payments = TransparentImpl[i++];
    let _marketscredits = TransparentImpl[i++];


    let _nftMarket = BeaconsImpl[j++];

    return [zeroBytes,
        zeroBytes,
        _managerAddress,
        _publicPoolAddress, 
        _treasuryAddress,
        _originalsAddress,
        _propositionSettings,
        _adminPiggyBank,
        _payments,
        _marketscredits,
        _nftMarket,
        emptyBytes,
        emptyBytes, 
        emptyBytes, 
        emptyBytes, 
        emptyBytes, 
        emptyBytes,
        emptyBytes,
        emptyBytes]
}

// checks

async function checkPropositionSettings(contractAddress, propBytes, user_1){
    let _propSettings =  await contractAddress.methods.retrieveSettings().call({from: user_1}, function(error, result){});
    expect(propBytes.length).to.equal(Object.keys(_propSettings).length);
    for(let i=0; i < _propSettings.length; i++){
        expect(aux.Bytes32ToInt(propBytes[i])).to.equal(parseInt(_propSettings[i]));
    }
}

async function checkFees(contractAddress, FeeAndSettingsBytes,  user_1){
    let numberOfTokens = aux.Bytes32ToInt(FeeAndSettingsBytes[0]);
    let FeesPerToken = aux.Bytes32ToInt(FeeAndSettingsBytes[1]) + 1;
    let numberOfTransferFees = aux.Bytes32ToInt(FeeAndSettingsBytes[2]);

    let FeesBytes = []
    let TransactionFeesBytes = []
    let SettingsBytes = []

    for(let f=3; f < (numberOfTokens * FeesPerToken) + 3; f++){
        FeesBytes.push(FeeAndSettingsBytes[f]);
    }

    for(let f2=(numberOfTokens * FeesPerToken) + 3; f2 < (numberOfTokens * FeesPerToken) + 3 + numberOfTransferFees; f2++){
        TransactionFeesBytes.push(FeeAndSettingsBytes[f2]);
    }

    for(let f3=(numberOfTokens * FeesPerToken) + 3 + numberOfTransferFees; f3 < FeeAndSettingsBytes.length; f3++){
        SettingsBytes.push(FeeAndSettingsBytes[f3]);
    }

    let response =  await contractAddress.methods.retrieveSettings().call({from: user_1}, function(error, result){});
    let _Fees = []
    for(let f4=0; f4 < response[0].length; f4++){
        _Fees.push(f4);
        for(let f5=0; f5 < response[0][f4].length; f5++){
            _Fees.push(response[0][f4][f5]);
        }
    }
    let _TransactionFees = response[1];
    let _Settings = response[2];

    expect(FeesBytes.length).to.equal(_Fees.length);
    expect(TransactionFeesBytes.length).to.equal(_TransactionFees.length);
    expect(SettingsBytes.length).to.equal(_Settings.length);

    for(let i=0; i < _Fees.length; i++){
        expect(aux.Bytes32ToInt(FeesBytes[i])).to.equal(parseInt(_Fees[i]));
    }
    for(let j=0; j < _TransactionFees.length; j++){
        expect(aux.Bytes32ToInt(TransactionFeesBytes[j])).to.equal(parseInt(_TransactionFees[j]));
    }
    for(let k=0; k < _Settings.length; k++){
        expect(aux.Bytes32ToInt(SettingsBytes[k])).to.equal(parseInt(_Settings[k]));
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
    i++;
    i++;
    i++;
    i++;
    i++;
    i++;
}

async function checkPayments(contractAddress, paymentBytes, user_1){
    let _paymentSettings =  await contractAddress.methods.retrieveSettings().call({from: user_1}, function(error, result){});
    expect(paymentBytes.length).to.equal(2 * _paymentSettings.length);
    for(let i=0; i < _paymentSettings.length; i++){
        expect(aux.Bytes32ToAddress(paymentBytes[(2 * i) + 1])).to.equal(_paymentSettings[i][0]);
        expect(aux.Bytes32ToInt(paymentBytes[(2 * i)])).to.equal(i);
    }
}

// tests

async function Config_Proposition_Wrong(contractAddress, originalsTokenProxy, tokenOwner, user_1, chairPerson, NewValues){
    await Config_CommonProposition_Wrong(contractAddress, originalsTokenProxy, tokenOwner, user_1, chairPerson, NewValues);
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

async function Config_Proposition_Correct(contractAddress, originalsTokenProxy, tokenOwner, user_1, chairPerson, NewValues){
    let _propositionSettings =  await contractAddress.methods.retrieveSettings().call({from: user_1}, function(error, result){});
    let InitValue = [aux.IntToBytes32(_propositionSettings[0]), aux.IntToBytes32(_propositionSettings[1]), aux.IntToBytes32(_propositionSettings[2])];
    await Config_CommonProposition_Correct(contractAddress, originalsTokenProxy, tokenOwner, user_1, chairPerson, NewValues, InitValue, checkPropositionSettings, true, true);
};

async function Config_Treasury_Wrong(contractAddress, originalsTokenProxy, tokenOwner, user_1, chairPerson, NewValues){
    await Config_CommonProposition_Wrong(contractAddress, originalsTokenProxy, tokenOwner, user_1, chairPerson, NewValues);
};

async function Config_Treasury_Correct(contractAddress, originalsTokenProxy, tokenOwner, user_1, chairPerson, NewValues){
    let response =  await contractAddress.methods.retrieveSettings().call({from: user_1}, function(error, result){});
    let FeesBytes = response[0];
    let TransactionFeesBytes = response[1];
    let SettingsBytes = response[2];

    let InitValue = [];
    InitValue.push(aux.IntToBytes32(FeesBytes.length));
    InitValue.push(aux.IntToBytes32(FeesBytes[0].length));
    InitValue.push(aux.IntToBytes32(TransactionFeesBytes.length));

    for(let i=0; i < FeesBytes.length; i++){
        InitValue.push(aux.IntToBytes32(i));
        for(let j=0; j < FeesBytes[i].length; j++){
            InitValue.push(aux.IntToBytes32(FeesBytes[i][j]));
        }
    }
    for(let p=0; p < TransactionFeesBytes.length; p++){
        InitValue.push(aux.IntToBytes32(TransactionFeesBytes[p]));
    }
    for(let k=0; k < SettingsBytes.length; k++){
        InitValue.push(aux.IntToBytes32(SettingsBytes[k]));
    }

    await Config_CommonProposition_Correct(contractAddress, originalsTokenProxy, tokenOwner, user_1, chairPerson, NewValues, InitValue, checkFees, true, true);
};

async function Config_ContractsManager_Wrong(contractAddress, originalsTokenProxy, tokenOwner, user_1, chairPerson, NewValues){
    await Config_CommonProposition_Wrong(contractAddress, originalsTokenProxy, tokenOwner, user_1, chairPerson, NewValues);
};

async function Config_ContractsManager_Correct(contractAddress, originalsTokenProxy, tokenOwner, user_1, chairPerson, NewValues){
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
        result[i++],
        result[i++],
        result[i++],
        result[i++],
        result[i++],
        result[i++],
        result[i++],
        result[i++]
    ];
    await Config_CommonProposition_Correct(contractAddress, originalsTokenProxy, tokenOwner, user_1, chairPerson, NewValues, InitValue, checkContracts, true, true);
   
};

async function Config_Payments_Wrong(contractAddress, originalsTokenProxy, tokenOwner, user_1, chairPerson, NewValues){
    await Config_CommonProposition_Wrong(contractAddress, originalsTokenProxy, tokenOwner, user_1, chairPerson, NewValues);
    // act
    try{
        await contractAddress.methods.sendProposition([zeroBytes]).send({from: chairPerson, gas: Gas}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(TokenAddressesWrong);
    }
};

async function Config_Payments_Correct(contractAddress, originalsTokenProxy, tokenOwner, user_1, chairPerson, NewValues){
    let _paymentsSettings = await contractAddress.methods.retrieveSettings().call({from: user_1}, function(error, result){});
    let InitValue = [];
    for(let i=0; i < _paymentsSettings.length; i++){
        InitValue.push(aux.IntToBytes32(i));
        InitValue.push(aux.AddressToBytes32(_paymentsSettings[i][0]));
    }
    await Config_CommonProposition_Correct(contractAddress, originalsTokenProxy, tokenOwner, user_1, chairPerson, NewValues, InitValue, checkPayments, true, false);
};

/////////////////////

function EmptyPropositions(Array){
    var EmptyProposition = []
    for(let i=0; i < Array.length; i++){
        EmptyProposition.push(emptyBytes);
    }
    return EmptyProposition;
}

async function Config_CommonProposition_Wrong(contractAddress, originalsTokenProxy, tokenOwner, user_1, chairPerson, NewValues){
    // act
    await SplitTokenSupply(originalsTokenProxy, tokenOwner, chairPerson);
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

async function Config_CommonProposition_Correct(contractAddress, originalsTokenProxy, tokenOwner, user_1, chairPerson, NewValues, InitValue, checkFunction, fullTest, validatedAgain){
    var EmptyProposition = EmptyPropositions(NewValues);

    if(fullTest){
        // act
        await SplitTokenSupply(originalsTokenProxy, tokenOwner, chairPerson);
    
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

    if(validatedAgain){
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
    }
    
 };

async function Check_Proposition_Details(contractAddress, originalsTokenProxy, chairPerson, tokenOwner, user_1, PropositionValues){
    // act
    await SplitTokenSupply(originalsTokenProxy, tokenOwner, chairPerson);
    await contractAddress.methods.sendProposition(PropositionValues).send({from: chairPerson, gas: Gas});
    // assert
    await checkProposition(contractAddress, PropositionValues, user_1);
}

async function Check_Votes_Reassignment(contractAddress, originalsTokenProxy, chairPerson, tokenOwner, user_1, PropositionValues){
    // act
    await SplitTokenSupply(originalsTokenProxy, tokenOwner, chairPerson);
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

    await originalsTokenProxy.methods.transfer(tokenOwner[2], (TotalTokenSupply / 10)).send({from: tokenOwner[0], gas: Gas}, function(error, result){});
    await originalsTokenProxy.methods.transfer(tokenOwner[2], (TotalTokenSupply / 10)).send({from: tokenOwner[1], gas: Gas}, function(error, result){});

    let Votes01 = await contractAddress.methods.retrieveVotesForVoter(propID - 1, tokenOwner[0]).call({from: user_1, gas: Gas}, function(error, result){});
    let Votes11 = await contractAddress.methods.retrieveVotesForVoter(propID - 1, tokenOwner[1]).call({from: user_1, gas: Gas}, function(error, result){});
    let Votes21 = await contractAddress.methods.retrieveVotesForVoter(propID - 1, tokenOwner[2]).call({from: user_1, gas: Gas}, function(error, result){});
    expect(parseInt(Votes01)).to.equal(TotalTokenSupply / 10);
    expect(parseInt(Votes11)).to.equal(0);
    expect(parseInt(Votes21)).to.equal(TotalTokenSupply / 10);

    await originalsTokenProxy.methods.transfer(tokenOwner[2], (TotalTokenSupply / 10)).send({from: tokenOwner[0], gas: Gas}, function(error, result){});
    await originalsTokenProxy.methods.transfer(tokenOwner[2], (TotalTokenSupply / 10)).send({from: tokenOwner[1], gas: Gas}, function(error, result){});

    let Votes02 = await contractAddress.methods.retrieveVotesForVoter(propID - 1, tokenOwner[0]).call({from: user_1, gas: Gas}, function(error, result){});
    let Votes12 = await contractAddress.methods.retrieveVotesForVoter(propID - 1, tokenOwner[1]).call({from: user_1, gas: Gas}, function(error, result){});
    let Votes22 = await contractAddress.methods.retrieveVotesForVoter(propID - 1, tokenOwner[2]).call({from: user_1, gas: Gas}, function(error, result){});
    expect(parseInt(Votes02)).to.equal(0);
    expect(parseInt(Votes12)).to.equal(0);
    expect(parseInt(Votes22)).to.equal(TotalTokenSupply / 5);

}

exports.Config_Proposition_Wrong = Config_Proposition_Wrong;
exports.Config_Proposition_Correct = Config_Proposition_Correct;
exports.Config_Treasury_Wrong = Config_Treasury_Wrong;
exports.Config_Treasury_Correct = Config_Treasury_Correct;
exports.Config_ContractsManager_Wrong = Config_ContractsManager_Wrong;
exports.Config_ContractsManager_Correct = Config_ContractsManager_Correct;
exports.Config_Payments_Wrong = Config_Payments_Wrong;
exports.Config_Payments_Correct = Config_Payments_Correct;
exports.SplitTokenSupply = SplitTokenSupply;
exports.Check_Proposition_Details = Check_Proposition_Details;
exports.Check_Votes_Reassignment = Check_Votes_Reassignment;