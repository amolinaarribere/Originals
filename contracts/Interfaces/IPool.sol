// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.7;

/**
 * @title Storage
 * @dev Store & retrieve value in a variable
 */
  import "../Libraries/ItemsLibrary.sol";

 interface IPool  {
    struct _pendingIssuerStruct{
        ItemsLibrary._issuerStruct _issuer;
        uint _pendingId;
        uint _validations;
        uint _rejections;
        address[] _voters;
    }

    function requestIssuer(ItemsLibrary._issuerStruct memory requestedIssuer, bool FromCredit, uint256 paymentTokenID) external;
    function validateIssuer(uint256 id) external;
    function rejectIssuer(uint256 id) external;

    function retrieveIssuers() external view returns (uint256[] memory);
    function retrieveNFTMarketForIssuer(uint256 id) external view returns (address);
    function retrievePendingIssuers() external view returns (uint256[] memory);
    function retrievePendingIssuer(uint256 id) external view returns (_pendingIssuerStruct memory);


}