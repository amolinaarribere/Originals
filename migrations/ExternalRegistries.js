const MainnetDAIAddress = ""
const KovanDAIAddress = "0x4f96fe3b7a6cf9725f59d353f723c1bdb64ca6aa"
const GoerliUSDTAddress = "0x07865c6e87b9f70255377e024ace6630c1eaa37f"


async function GetDAIAddress(network, deployer, MockDAI, rate, MockDecimals){

    var DAIAddress = MainnetDAIAddress;

    if("kovan" == network){
        DAIAddress = KovanDAIAddress;
    }
    else if("mainnet" != network)
    {
        await deployer.deploy(MockDAI, rate, MockDecimals);
        let MockDAIInstance = await MockDAI.deployed();
        console.log("MockDAI deployed : " + MockDAIInstance.address);
        DAIAddress = MockDAIInstance.address
    }

    return DAIAddress;
  
}


exports.GetDAIAddress = GetDAIAddress;