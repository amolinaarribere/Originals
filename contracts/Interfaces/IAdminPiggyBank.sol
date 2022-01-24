// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.7;

/**
 * @title Storage
 * @dev Store & retrieve value in a variable
 */

interface IAdminPiggyBank {

    function transfer(address receiver, uint amount) external;
    function approve() external;
    function reject() external;

    function retrieveTransferInfo() external returns(address receiver, uint amount);
}