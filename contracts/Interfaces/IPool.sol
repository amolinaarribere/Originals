// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.7;

/**
 * @title Storage
 * @dev Store & retrieve value in a variable
 */
  import "../Libraries/ItemsLibrary.sol";

 interface IPool  {

    function requestIssuer(address owner, string memory name, string memory symbol, Library.PaymentPlans paymentPlan) external payable returns (uint256);
    function validateIssuer(uint256 id) external;
    function rejectIssuer(uint256 id) external;

    function retrieveIssuers() external view returns (uint256[] memory);
    function retrieveNFTMarketForIssuer(uint256 id) external view returns (address);
    function retrievePendingIssuers() external view returns (uint256[] memory);
    function retrievePendingIssuer(uint256 id) external view returns (ItemsLibrary._pendingIssuerStruct memory);

}