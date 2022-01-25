// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.7;

/**
 * @title Storage
 * @dev Store & retrieve value in a variable
 */

 import "../Libraries/Library.sol";

 interface ITreasury  {

    function pay() external payable;    
    function withdraw(uint256 amount) external;
    function withdrawAll() external;

    function retrieveLastAssigned(address addr) external view returns(uint256);
    function retrieveFullBalance(address addr) external view returns(uint256);
    function retrieveSettings() external view returns(uint256[] memory);
    function retrieveAggregatedAmount() external view returns(uint256);

}