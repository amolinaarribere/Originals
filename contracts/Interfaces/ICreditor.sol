// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.7;

/**
 * @title Storage
 * @dev Store & retrieve value in a variable
 */



interface ICreditor{
    function CreditReceived(address sender, uint256 amount, bytes memory data) external;
}