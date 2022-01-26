const constants = require("../test_libraries/constants.js");

const Gas = constants.Gas;

const IDWrong = new RegExp("EC1-");
const AtLeastOne = new RegExp("EC19-");
const MinNumberRequired = new RegExp("EC19-");
const NotEnoughFunds = new RegExp("EC2-");
const NodeAlreadyExists = new RegExp("EC37-");
const emptyLabel = "";
const label = "TestLabel";
const PrivatePoolSuffix = constants.initSuffixes[0];
const ProviderSuffix = constants.initSuffixes[1];



async function createElementWrong(FactoryProxy, Owners, minOwners, ElementName, Price, user_1){

    var emptyOwners = [];

    // act
    try{
        await FactoryProxy.methods.create(Owners, minOwners, ElementName, emptyLabel).send({from: user_1, value: Price - 1, gas: Gas}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(NotEnoughFunds);
        var total = await FactoryProxy.methods.retrieveTotal().call({from: user_1}, function(error, result){});
        expect(parseInt(total)).to.equal(0);
    }
    // act
     try{
        await FactoryProxy.methods.create(Owners, Owners.length + 1, ElementName, emptyLabel).send({from: user_1, value: Price, gas: Gas}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(MinNumberRequired);
        var total = await FactoryProxy.methods.retrieveTotal().call({from: user_1}, function(error, result){});
        expect(parseInt(total)).to.equal(0);
    }
    // act
    try{
        await FactoryProxy.methods.create(Owners, 0, ElementName, emptyLabel).send({from: user_1, value: Price, gas: Gas}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(AtLeastOne);
        var total = await FactoryProxy.methods.retrieveTotal().call({from: user_1}, function(error, result){});
        expect(parseInt(total)).to.equal(0);
    }
    // act
    try{
        await FactoryProxy.methods.create(emptyOwners, 0, ElementName, emptyLabel).send({from: user_1, value: Price, gas: Gas}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(AtLeastOne);
        var total = await FactoryProxy.methods.retrieveTotal().call({from: user_1}, function(error, result){});
        expect(parseInt(total)).to.equal(0);
    }
    // act
    try{
        await FactoryProxy.methods.create(Owners, minOwners, ElementName, label).send({from: user_1, value: Price, gas: Gas}, function(error, result){});
        await FactoryProxy.methods.create(Owners, minOwners, ElementName, label).send({from: user_1, value: Price, gas: Gas}, function(error, result){});
        expect.fail();
    }
    // assert
    catch(error){
        expect(error.message).to.match(NodeAlreadyExists);
        var total = await FactoryProxy.methods.retrieveTotal().call({from: user_1}, function(error, result){});
        expect(parseInt(total)).to.equal(1);
    }
}

async function createElementCorrect(FactoryProxy, ENSResolver, ENSReverseRegistry, Owners, minOwners, ElementName, Price, user_1, user_2, user_3, privateOrProvider){
    // Factory creation
    var total = await FactoryProxy.methods.retrieveTotal().call({from: user_1}, function(error, result){});
    expect(parseInt(total)).to.equal(0);
    await FactoryProxy.methods.create(Owners, minOwners, ElementName[0], emptyLabel).send({from: user_1, value: Price, gas: Gas}, function(error, result){});
    await FactoryProxy.methods.create(Owners, minOwners, ElementName[1], label).send({from: user_2, value: Price, gas: Gas}, function(error, result){});
    await FactoryProxy.methods.create(Owners, minOwners, ElementName[2], emptyLabel).send({from: user_3, value: Price, gas: Gas}, function(error, result){});
    total = await FactoryProxy.methods.retrieveTotal().call({from: user_1}, function(error, result){});
    expect(parseInt(total)).to.equal(3);
    let {0:createElementCorrect_1, 1:proxyaddress_1, 2:ElementName_1} = await FactoryProxy.methods.retrieve(0).call({from: user_1}, function(error, result){});
    let {0:createElementCorrect_2, 1:proxyaddress_2, 2:ElementName_2} = await FactoryProxy.methods.retrieve(1).call({from: user_1}, function(error, result){});
    let {0:createElementCorrect_3, 1:proxyaddress_3, 2:ElementName_3} = await FactoryProxy.methods.retrieve(2).call({from: user_1}, function(error, result){});
    expect(createElementCorrect_1).to.equal(user_1);
    expect(createElementCorrect_2).to.equal(user_2);
    expect(createElementCorrect_3).to.equal(user_3);
    expect(ElementName_1).to.equal(ElementName[0]);
    expect(ElementName_2).to.equal(ElementName[1]);
    expect(ElementName_3).to.equal(ElementName[2]);

    // ENS creation
    let Domain = label + ProviderSuffix;
    if(privateOrProvider) Domain = label + PrivatePoolSuffix;
    
    let Node = NameHash(Domain);
    let ResolvedAddress_2 = await ENSResolver.methods.addr(Node).call({from: user_1});

    expect(ResolvedAddress_2).to.equal(proxyaddress_2);

    let proxyaddress_2_Node = await ENSReverseRegistry.methods.node(proxyaddress_2).call({from: user_1});
    let ReversedResolvedName_2 = await ENSResolver.methods.name(proxyaddress_2_Node).call({from: user_1});

    expect(ReversedResolvedName_2).to.equal(Domain);
}

async function retrieveWrong(FactoryProxy, user_1){
    try{
        await FactoryProxy.methods.retrieve(1).call({from: user_1}, function(error, result){});
    }
    catch(error){
        expect(error.message).to.match(IDWrong);
    }
}

function NameHash(name){
    let nameHash = 0;
    let nameSplit = name.trim().split(".");

    for(let i = 0; i < nameSplit.length; i++){
        let index = nameSplit.length - 1 - i;
        if(nameSplit[index].length > 0){
            nameHash = web3.utils.soliditySha3(nameHash, web3.utils.sha3(nameSplit[index]));
        }
    }

    return nameHash;
}



exports.createElementWrong=createElementWrong;
exports.createElementCorrect=createElementCorrect;
exports.retrieveWrong=retrieveWrong;