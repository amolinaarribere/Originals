// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.7;

/**
 * @title Storage
 * @dev Store & retrieve value in a variable
 */

 import "../Libraries/Library.sol";

 interface ITreasury  {

    function withdraw(uint256 amount, uint256 tokenId) external;
    function withdrawAll(uint256 tokenId) external;

    function retrieveLastAssigned(address addr, uint256 tokenId) external view returns(uint256);
    function retrieveFullBalance(address addr, uint256 tokenId) external view returns(uint256);
    function retrieveSettings() external view returns(uint256[][] memory, uint256[] memory, uint256[] memory);
    function retrieveAggregatedAmount(uint256 tokenId) external view returns(uint256);

}