// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.7;

/**
 * @title Storage
 * @dev Store & retrieve value in a variable
 */

   import "../Libraries/ItemsLibrary.sol";

 interface INFTMarket  {
    struct _offerStruct{
        uint256 _offer;
        uint256 _paymentTokenID;
        address _sender;
        address _bidder;
        uint256 _deadline; 
    }

    struct _submitOfferStruct{
        uint256 _tokenId;
        address _bidder;
        uint256 _offer;
        bool _FromCredit;
        uint256 _paymentTokenID;
    }

    struct _tokenPriceStruct {
        uint256 _paymentTokenID;
        uint256 _price;
        bool _enabled;
    }

    struct _tokenStruct{
        Library.PaymentPlans _paymentPlan;
        _tokenPriceStruct[] _prices;
    }

    function changeOwner(address newOwner) external;
    function changePaymentPlan(Library.PaymentPlans newPaymentPlan) external;
    function changeOffersLifeTime(uint256 newLifeTime) external;
    function changeOwnerTransferFees(uint256 newAmount, uint256 newDecimals) external;

    function mintToken(uint256 tokenId, address receiver, _tokenPriceStruct[] memory prices, bool FromCredit, uint256 paymentTokenID) external;

    function setTokenPrice(uint256 tokenId, _tokenPriceStruct[] memory prices) external;
    function acceptOffer(uint256 tokenId) external;
    function rejectOffer(uint256 tokenId) external;


    function submitOffer(_submitOfferStruct memory offer) external;
    function withdrawOffer(uint256 tokenId) external;

    function retrieveIssuer() external view returns (ItemsLibrary._issuerStruct memory, uint256);
    function retrieveToken(uint256 tokenId) external view returns (_tokenStruct memory, address);
    function retrieveOffer(uint256 tokenId) external view returns (_offerStruct memory);

}