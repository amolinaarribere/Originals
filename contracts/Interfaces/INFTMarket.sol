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
    function changeOffersLifeTime(uint256 newLifeTime) external;
    function changeOwnerTransferFees(uint256 newAmount, uint256 newDecimals) external;

    function mintToken(uint256 tokenId, address receiver, uint256 price) external payable;

    function setTokenPrice(uint256 tokenId, uint256 price) external;
    function acceptOffer(uint256 tokenId) external;
    function rejectOffer(uint256 tokenId) external;



    function submitOffer(uint256 tokenId, address bidder) external payable;
    function withdrawOffer(uint256 tokenId) external;
    function withdraw() external;

    function retrieveIssuer() external view returns (ItemsLibrary._issuerStruct memory, uint256);
    function retrieveToken(uint256 tokenId) external view returns (ItemsLibrary._tokenStruct memory, address);
    function retrieveOffer(uint256 tokenId) external view returns (ItemsLibrary._offerStruct memory);

}