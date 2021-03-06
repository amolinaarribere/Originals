// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.7;

/**
 * @title Storage
 * @dev Store & retrieve value in a variable
 */
import "../Libraries/Library.sol";



interface IPayments{
    function TransferFrom(address sender, address recipient, uint256 amount, uint256 id, bytes memory data, uint256 tokenId) external;

    function BalanceOf(address account, uint256 tokenId) external view returns(uint256);
    function retrieveSettings() external view returns(Library.PaymentTokenStruct[] memory);
}