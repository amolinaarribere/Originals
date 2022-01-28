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

    function requestIssuer(address owner, string memory name, string memory symbol, uint256 feeAmount, uint256 feeDecimals, Library.PaymentPlans paymentPlan) external payable returns (uint256);
    function validateIssuer(uint256 id) external;
    function rejectIssuer(uint256 id) external;

    function transferUnassignedCredit(uint256 NFTMarketId, uint256 tokenID) external payable;
    function sendCredit(address addr) external payable;
    function addCredit(uint256 NFTMarketId, uint256 tokenID, address[] calldata addrs, uint256[] calldata amounts, uint256[] calldata factors) external;
    function reuseCredit(uint256 NFTMarketId, uint256 tokenID, address addr, uint256 amount) external;
    function withdraw(uint256 amount) external;
    function withdrawFor(uint256 NFTMarketId, address addr, uint amount) external;
    function withdrawAll() external;
    function withdrawAllFor(uint256 NFTMarketId, address addr) external;


    function retrieveIssuers() external view returns (uint256[] memory);
    function retrieveNFTMarketForIssuer(uint256 id) external view returns (address);
    function retrievePendingIssuers() external view returns (uint256[] memory);
    function retrievePendingIssuer(uint256 id) external view returns (_pendingIssuerStruct memory);
    function retrieveCredit(address addr) external view returns (uint256);


}