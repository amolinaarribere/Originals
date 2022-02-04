// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.7;

/**
 * @title Storage
 * @dev Store & retrieve value in a variable
 */

 import "../Libraries/Library.sol";

 interface IPropositionSettings  {

    function retrieveSettings() external view returns(uint256, uint256, uint256);

}