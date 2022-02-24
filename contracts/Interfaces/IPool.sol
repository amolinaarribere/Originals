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

    function requestIssuer(ItemsLibrary._issuerStruct memory requestedIssuer, bool FromCredit) external;
    function validateIssuer(uint256 id) external;
    function rejectIssuer(uint256 id) external;

    function sendCredit(address addr, uint256 amount) external;
    function addCredit(uint256 NFTMarketId, uint256 tokenID, address[] calldata addrs, uint256[] calldata amounts, uint256[] calldata factors) external;
    function reuseCredit(uint256 NFTMarketId, uint256 tokenID, address addr, uint256 amount) external;
    function spendCredit(uint256 NFTMarketId, address from, uint256 amount, address to) external;
    function withdraw(uint256 amount) external;
    function withdrawAll() external;
    function withdrawAllFor(uint256 NFTMarketId, address addr, bytes memory data) external;


    function retrieveIssuers() external view returns (uint256[] memory);
    function retrieveNFTMarketForIssuer(uint256 id) external view returns (address);
    function retrievePendingIssuers() external view returns (uint256[] memory);
    function retrievePendingIssuer(uint256 id) external view returns (_pendingIssuerStruct memory);
    function retrieveCredit(address addr) external view returns (uint256);


}