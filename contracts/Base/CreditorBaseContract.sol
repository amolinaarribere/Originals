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
    modifier isFromPaymentContract(address addr){
        Library.ItIsSomeone(addr, _managerContract.retrieveTransparentProxies()[uint256(Library.TransparentProxies.Payments)]);
        _;
    }
    
    // CONSTRUCTOR /////////////////////////////////////////
    function CreditorBaseContract_init(address managerContractAddress) internal initializer {
        super.ManagedBaseContract_init(managerContractAddress);
    }

    // FUNCTIONALITY /////////////////////////////////////////
    function CreditReceived(address sender, uint256 amount, bytes memory data) external override
        isFromPaymentContract(msg.sender)
    {
        onCreditReceived(sender, amount, data);
    }

    function onCreditReceived(address sender, uint256 amount, bytes memory data) internal virtual;

}