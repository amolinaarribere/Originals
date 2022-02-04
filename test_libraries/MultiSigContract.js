// Chai library for testing
// ERROR tests = First we test the error message then we test the action was not carried out
const constants = require("./constants.js");


const Gas = constants.Gas;
const minOwners = 2;
// test constants
const NotAnOwner = new RegExp("EC9-");
const AlreadyAnOwner = new RegExp("EC9-");
const OwnerPending = new RegExp("EC10-");
const OwnerAlreadyvoted = new RegExp("EC5-");
const MustBeActivated = new RegExp("EC9-");
const MinNumberRequired = new RegExp("EC19-");
const AtLeastOne = new RegExp("EC19-");
const MinOwnerNotInProgress = new RegExp("EC31-");
const MinOwnerAlreadyInProgress = new RegExp("EC30-");


async function AddingOwners(Contract, Owners, extra_owner, validateOrreject){
    await Contract.methods.addOwner(extra_owner).send({from: Owners[0], gas: Gas}, function(error, result){});
    if(validateOrreject) await Contract.methods.validateOwner(extra_owner).send({from: Owners[1], gas: Gas}, function(error, result){});
    else await Contract.methods.rejectOwner(extra_owner).send({from: Owners[1], gas: Gas}, function(error, result){});
}

async function AddOwnerWrong(Contract, Owners, extra_owner, user_1){
    // act
    try{
        await Contract.methods.addOwner(extra_owner).send({from: user_1, gas: Gas}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(NotAnOwner);
    }
    // act
    try{
        await Contract.methods.addOwner(Owners[0]).send({from: Owners[1], gas: Gas}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(AlreadyAnOwner);
    }
    // act
    try{
        await Contract.methods.addOwner(extra_owner).send({from: Owners[0], gas: Gas}, function(error, result){});
        await Contract.methods.validateOwner(extra_owner).send({from: Owners[0], gas: Gas}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(OwnerAlreadyvoted);
    }
    // act
    try{
        await Contract.methods.rejectOwner(extra_owner).send({from: Owners[0], gas: Gas}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(OwnerAlreadyvoted);
    }
    // act
    try{
        await Contract.methods.validateOwner(extra_owner).send({from: user_1, gas: Gas}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(NotAnOwner);
    }
    // act
    try{
        await Contract.methods.rejectOwner(extra_owner).send({from: user_1, gas: Gas}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(NotAnOwner);
    }
}

async function AddOwnerCorrect(Contract, Owners, extra_owner, user_1){
    // act
    await AddingOwners(Contract, Owners, extra_owner, true);
    // assert
    let AllOwners = await Contract.methods.retrieveAllOwners().call({from: user_1}, function(error, result){});
    Total = AllOwners.length;
    let MinOwners = await Contract.methods.retrieveMinOwners().call({from: user_1}, function(error, result){});
    expect(Total).to.equal(4);
    expect(AllOwners[0]).to.equal(Owners[0]);
    expect(AllOwners[1]).to.equal(Owners[1]);
    expect(AllOwners[2]).to.equal(Owners[2]);
    expect(AllOwners[3]).to.equal((extra_owner));
    expect(MinOwners).to.equal(minOwners.toString());
};

async function AddOwnerCorrect2(Contract, Owners, extra_owner, user_1){
    // act
    await AddingOwners(Contract, Owners, extra_owner, false);
    // assert
    let AllOwners = await Contract.methods.retrieveAllOwners().call({from: user_1}, function(error, result){});
    Total = AllOwners.length;
    let MinOwners = await Contract.methods.retrieveMinOwners().call({from: user_1}, function(error, result){});
    expect(Total).to.equal(3);
    expect(AllOwners[0]).to.equal(Owners[0]);
    expect(AllOwners[1]).to.equal(Owners[1]);
    expect(AllOwners[2]).to.equal(Owners[2]);
    expect(MinOwners).to.equal(minOwners.toString());
};

async function RemoveOwnerWrong(Contract, Owners, accountX, user_1){
    //act
    try{
        await Contract.methods.removeOwner(Owners[2]).send({from: user_1, gas: Gas}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(NotAnOwner);
    }
    // act
    try{
        await Contract.methods.removeOwner(accountX).send({from: Owners[0]}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(MustBeActivated);
    }
    // act
    try{
        await Contract.methods.removeOwner(Owners[2]).send({from: Owners[0], gas: Gas}, function(error, result){});
        await Contract.methods.validateOwner(Owners[2]).send({from: Owners[0], gas: Gas}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(OwnerAlreadyvoted);
    }
    // act
    try{
        await Contract.methods.rejectOwner(Owners[2]).send({from: Owners[0], gas: Gas}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(OwnerAlreadyvoted);
    }
    // act
    try{
        await Contract.methods.removeOwner(Owners[1]).send({from: Owners[0], gas: Gas}, function(error, result){});
        await Contract.methods.validateOwner(Owners[1]).send({from: Owners[2], gas: Gas}, function(error, result){});
        await Contract.methods.validateOwner(Owners[2]).send({from: Owners[2], gas: Gas}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(MinNumberRequired);
    }
}

async function RemoveOwnerCorrect(Contract, Owners, user_1){
    // act
    await Contract.methods.removeOwner(Owners[2]).send({from: Owners[0], gas: Gas}, function(error, result){});
    await Contract.methods.validateOwner(Owners[2]).send({from: Owners[1], gas: Gas}, function(error, result){});
    // assert
    let All = await Contract.methods.retrieveAllOwners().call({from: user_1}, function(error, result){});
    let Total = All.length;
    expect(Total).to.equal(2);
};

async function RemoveOwnerCorrect2(Contract, Owners, user_1){
    // act
    await Contract.methods.removeOwner(Owners[2]).send({from: Owners[0], gas: Gas}, function(error, result){});
    await Contract.methods.rejectOwner(Owners[2]).send({from: Owners[1], gas: Gas}, function(error, result){});
    await Contract.methods.rejectOwner(Owners[2]).send({from: Owners[2], gas: Gas}, function(error, result){});
    // assert
    let All = await Contract.methods.retrieveAllOwners().call({from: user_1}, function(error, result){});
    let Total = All.length;
    expect(Total).to.equal(3);
};


async function UpdateMinOwnersWrong(Contract, Owners, user_1){
    // act
    try{
        await Contract.methods.changeMinOwners(1).send({from: user_1, gas: Gas}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(NotAnOwner);
    }
    // act
    try{
        await Contract.methods.changeMinOwners(Owners.length + 1).send({from: Owners[0], gas: Gas}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(MinNumberRequired);
    }
    // act
    try{
        await Contract.methods.changeMinOwners(0).send({from: Owners[0], gas: Gas}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(AtLeastOne);
    }
    // act
    try{
        await Contract.methods.validateMinOwners().send({from: Owners[0], gas: Gas}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(MinOwnerNotInProgress);
    }
    // act
    try{
        await Contract.methods.rejectMinOwners().send({from: Owners[0], gas: Gas}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(MinOwnerNotInProgress);
    }
    // act
    try{
        await Contract.methods.changeMinOwners(1).send({from: Owners[0], gas: Gas}, function(error, result){});
        await Contract.methods.changeMinOwners(2).send({from: Owners[1], gas: Gas}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(MinOwnerAlreadyInProgress);
    }
    // act
    try{
        await Contract.methods.validateMinOwners().send({from: Owners[0], gas: Gas}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(OwnerAlreadyvoted);
    }
    // act
    try{
        await Contract.methods.rejectMinOwners().send({from: Owners[0], gas: Gas}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(OwnerAlreadyvoted);
    }
     // act
     try{
        await Contract.methods.validateMinOwners().send({from: user_1, gas: Gas}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(NotAnOwner);
    }
    // act
    try{
        await Contract.methods.rejectMinOwners().send({from: user_1, gas: Gas}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(NotAnOwner);
    }
}

async function UpdateMinOwnersCorrect(Contract, Owners, user_1){
    // act
    var NewMinOwner = 1;
    var pendingMinOwnerBefore = parseInt(await Contract.methods.retrievePendingMinOwners().call({from: user_1, gas: Gas}, function(error, result){}));
    var MinOwnerBefore = parseInt(await Contract.methods.retrieveMinOwners().call({from: user_1, gas: Gas}, function(error, result){}));

    await Contract.methods.changeMinOwners(NewMinOwner).send({from: Owners[0], gas: Gas}, function(error, result){});
    var pendingMinOwner = parseInt(await Contract.methods.retrievePendingMinOwners().call({from: user_1, gas: Gas}, function(error, result){}));
    var MinOwner = parseInt(await Contract.methods.retrieveMinOwners().call({from: user_1, gas: Gas}, function(error, result){}));

    await Contract.methods.validateMinOwners().send({from: Owners[1], gas: Gas}, function(error, result){});
    var pendingMinOwnerAfter = parseInt(await Contract.methods.retrievePendingMinOwners().call({from: user_1, gas: Gas}, function(error, result){}));
    var MinOwnerAfter = parseInt(await Contract.methods.retrieveMinOwners().call({from: user_1, gas: Gas}, function(error, result){}));
    // assert
    expect(pendingMinOwnerBefore).to.equal(0);
    expect(MinOwnerBefore).to.equal(2);
    expect(pendingMinOwner).to.equal(NewMinOwner);
    expect(MinOwner).to.equal(2);
    expect(pendingMinOwnerAfter).to.equal(0);
    expect(MinOwnerAfter).to.equal(NewMinOwner);
};

async function UpdateMinOwnersCorrect2(Contract, Owners, user_1){
    // act
    var NewMinOwner = 1;
    var pendingMinOwnerBefore = parseInt(await Contract.methods.retrievePendingMinOwners().call({from: user_1, gas: Gas}, function(error, result){}));
    var MinOwnerBefore = parseInt(await Contract.methods.retrieveMinOwners().call({from: user_1, gas: Gas}, function(error, result){}));

    await Contract.methods.changeMinOwners(NewMinOwner).send({from: Owners[0], gas: Gas}, function(error, result){});
    var pendingMinOwner = parseInt(await Contract.methods.retrievePendingMinOwners().call({from: user_1, gas: Gas}, function(error, result){}));
    var MinOwner = parseInt(await Contract.methods.retrieveMinOwners().call({from: user_1, gas: Gas}, function(error, result){}));

    await Contract.methods.rejectMinOwners().send({from: Owners[1], gas: Gas}, function(error, result){});
    await Contract.methods.rejectMinOwners().send({from: Owners[2], gas: Gas}, function(error, result){});
    var pendingMinOwnerAfter = parseInt(await Contract.methods.retrievePendingMinOwners().call({from: user_1, gas: Gas}, function(error, result){}));
    var MinOwnerAfter = parseInt(await Contract.methods.retrieveMinOwners().call({from: user_1, gas: Gas}, function(error, result){}));
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
exports.UpdateMinOwnersWrong = UpdateMinOwnersWrong;
exports.UpdateMinOwnersCorrect = UpdateMinOwnersCorrect;
exports.UpdateMinOwnersCorrect2 = UpdateMinOwnersCorrect2;


