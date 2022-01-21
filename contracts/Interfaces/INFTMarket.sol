// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.7;

/**
 * @title Storage
 * @dev Store & retrieve value in a variable
 */

   import "../Libraries/ItemsLibrary.sol";

 interface INFTMarket  {

    function changeOwner(address newOwner) external;
    function changePaymentPlan(Library.PaymentPlans newPaymentPlan) external;
    function mintToken(uint tokenId, address receiver, uint price, bool roundingUp) external;

    function setTokenPrice(uint tokenId, uint price) external;
    function acceptOffer(uint tokenId, bool roundingUp) external;
    function rejectOffer(uint tokenId) external;



    function submitOffer(uint tokenId, address bidder) external payable;
    function withdrawOffer(uint tokenId) external;

    function retrieveIssuer() external view returns (ItemsLibrary._issuerStruct memory);
    function retrieveToken(uint tokenId) external view returns (address, uint);
    function retrieveOffer(uint tokenId) external view returns (ItemsLibrary._offerStruct memory);

}