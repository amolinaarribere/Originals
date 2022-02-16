const MainnetDAIAddress = ""
const KovanDAIAddress = "0x4f96fe3b7a6cf9725f59d353f723c1bdb64ca6aa"
let TransparentUpgradeableProxy = artifacts.require("@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol")

async function GetTokenContractAddress(network, deployer, MockDai, name, symbol, supply, initialOwner, web3, proxyOwner){

    var TokenContractAddress = MainnetDAIAddress;

    if("kovan" == network){
        TokenContractAddress = KovanDAIAddress;
    }
    else if("mainnet" != network)
    {
        await deployer.deploy(MockDai);
        let MockDAIInstance = await MockDai.deployed();
        console.log("MockDAI logic deployed : " + MockDAIInstance.address);

        let TokenInitializerMethod = {
            "inputs": [
              {
                "internalType": "string",
                "name": "name",
                "type": "string"
              },
              {
                "internalType": "string",
                "name": "symbol",
                "type": "string"
              },
              {
                "internalType": "uint256",
                "name": "MaxSupply",
                "type": "uint256"
              },
              {
                "internalType": "address",
                "name": "initialOwner",
                "type": "address"
              }
            ],
            "name": "MockDai_init",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        };
        
        let TokenProxyInitializerParameters = [name, symbol, supply, initialOwner];
        let TokenProxyData = web3.eth.abi.encodeFunctionCall(TokenInitializerMethod, TokenProxyInitializerParameters);
        
        await deployer.deploy(TransparentUpgradeableProxy, MockDAIInstance.address, proxyOwner, TokenProxyData);
        let TransparentUpgradeableProxyIns = await TransparentUpgradeableProxy.deployed();
        TokenContractAddress = TransparentUpgradeableProxyIns.address;
        console.log("MockDAI Proxy deployed : " + TokenContractAddress);
    }

    return TokenContractAddress;
  
}


exports.GetTokenContractAddress = GetTokenContractAddress;