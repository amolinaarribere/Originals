// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.7;

/**
 * @title Storage
 * @dev Store & retrieve value in a variable
 */

 interface IMarketsCredits  {

    function sendCredit(address addr, uint256 amount, uint256 paymentTokenID) external;
    function assignCredit(uint256 NFTMarketId, uint256 tokenID, address[] calldata addrs, uint256[] calldata amounts, uint256[] calldata factors) external;
    function reuseCredit(uint256 NFTMarketId, uint256 tokenID, address addr, uint256 amount, uint256 paymentTokenID) external;
    function spendCredit(uint256 NFTMarketId, address from, uint256 amount, address to, uint256 paymentTokenID) external;
    function withdraw(uint256 amount, uint256 paymentTokenID) external;
    function withdrawAll(uint256 paymentTokenID) external;
    function withdrawAllFor(uint256 NFTMarketId, address addr, uint256 paymentTokenID, bytes memory data) external;

    function retrieveCredit(address addr, uint256 paymentTokenID) external view returns (uint256);


}