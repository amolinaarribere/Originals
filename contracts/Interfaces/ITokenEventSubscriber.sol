// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.7;

/**
 * @title Storage
 * @dev Store & retrieve value in a variable
 */

 interface ITokenEventSubscriber {
    function onTokenBalanceChanged(address from, address to, uint256 amount) external;
 }