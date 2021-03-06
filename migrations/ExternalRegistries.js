const MainnetDAIAddress = ""
const KovanDAIAddress = "0x4f96fe3b7a6cf9725f59d353f723c1bdb64ca6aa"

async function GetTokenContractAddress(network, deployer, MockDai, name, symbol, supply, initialOwner){

    var TokenContractAddress = MainnetDAIAddress;

    if("kovan" == network){
        TokenContractAddress = KovanDAIAddress;
    }
    else if("mainnet" != network)
    {
        await deployer.deploy(MockDai, name, symbol, supply, initialOwner);
        let MockDAIInstance = await MockDai.deployed();
        TokenContractAddress = MockDAIInstance.address;
        console.log("MockDAI deployed : " + TokenContractAddress);
    }

    return TokenContractAddress;
  
}


exports.GetTokenContractAddress = GetTokenContractAddress;