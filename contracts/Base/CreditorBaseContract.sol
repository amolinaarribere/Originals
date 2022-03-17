// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.7;

/*
  Manager Contract is a Base contract that simply adds a manager contract as a reference for multiple operations
 */

import "../Interfaces/ICreditor.sol";
import "./ManagedBaseContract.sol";

abstract contract CreditorBaseContract is ICreditor, ManagedBaseContract{

    // DATA /////////////////////////////////////////

    // MODIFIERS /////////////////////////////////////////
    modifier isFromCertifiedContract(address addr){
        require(
            addr == _managerContract.retrieveTransparentProxies()[uint256(Library.TransparentProxies.Payments)] || 
            addr == _managerContract.retrieveTransparentProxies()[uint256(Library.TransparentProxies.MarketsCredits)]
        , "It is not from one of the certified contracts");
        _;
    }
    
    // CONSTRUCTOR /////////////////////////////////////////
    function CreditorBaseContract_init(address managerContractAddress) internal initializer {
        super.ManagedBaseContract_init(managerContractAddress);
    }

    // FUNCTIONALITY /////////////////////////////////////////
    function CreditReceived(address sender, uint256 amount, uint256 paymentTokenID, bytes memory data) external override
        isFromCertifiedContract(msg.sender)
    {
        onCreditReceived(sender, amount, paymentTokenID, data);
    }

    function onCreditReceived(address sender, uint256 amount, uint256 paymentTokenID, bytes memory data) internal virtual;

}