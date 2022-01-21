// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.7;

/**
 Certis Token is an ERC20 Token that grants its holder the right to:
   - Vote on all the systems propositions (changing system configuraiton etc...)
   - Receive Dividends for all the payments forwarded to the Treasury contract

Before every token transfer we contact the token gouvernance Base contracts so that the can update the tokens used for voting if needed

 */

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../Libraries/AddressLibrary.sol";
import "../Interfaces/ITokenEventSubscriber.sol";
import "../Base/ManagedBaseContract.sol";

 contract OriginalsToken is  Initializable, ManagedBaseContract, ERC20Upgradeable {
    using AddressLibrary for *;

    // DATA /////////////////////////////////////////
    // decimals
    uint8 private _decimals;

    // CONSTRUCTOR /////////////////////////////////////////
    function OriginalsToken_init(string memory name, string memory symbol, uint256 MaxSupply, address managerContractAddress, uint8 decimalsValue, address initialOwner) public initializer {
        super.ManagedBaseContract_init(managerContractAddress);
        super.__ERC20_init(name, symbol);
    
        _decimals = decimalsValue;
        _mint(initialOwner, MaxSupply);
    }

    // FUNCTIONALITY /////////////////////////////////////////
    function decimals() public view override returns (uint8) 
    {
        return _decimals;
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount) internal override 
    {
        if(_managerContract.isInitialized()){
            address[] memory Proxies = _managerContract.retrieveTransparentProxies();
            
            ITokenEventSubscriber(Proxies[uint256(Library.TransparentProxies.Treasury)]).onTokenBalanceChanged(from, to, amount); // Treasury
            ITokenEventSubscriber(Proxies[uint256(Library.TransparentProxies.PropSettings)]).onTokenBalanceChanged(from, to, amount); // Proposition Settings
            ITokenEventSubscriber(address(_managerContract)).onTokenBalanceChanged(from, to, amount); // Certificate Pool Manager
        }
    }

 }