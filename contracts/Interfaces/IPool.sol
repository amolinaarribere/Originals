// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.7;

/**
 * @title Storage
 * @dev Store & retrieve value in a variable
 */
  import "../Libraries/ItemsLibrary.sol";

 interface IPool  {

    function requestIssuer(address owner, string memory name, string memory symbol) external payable;
    function validateIssuer(uint id) external;
    function rejectIssuer(uint id) external;

    function retrieveIssuer(uint id) external view returns (ItemsLibrary._issuerStruct memory);
    function retrieveNFTMarketForIssuer(uint id) external view returns (address);

}