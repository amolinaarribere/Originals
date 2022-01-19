// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.7;

/**
 * @title Storage
 * @dev Store & retrieve value in a variable
 */

 interface INFTMarket  {

    function changeOwner(address newOwner) external;
    function mintToken(uint tokenId, address receiver) external;
    function transferToken(uint tokenId, address to) external;
    function acceptOffer(uint tokenId, uint offerId) external;



    function submitOffer(uint tokenId, address bidder) external returns(uint);
    function withdrawOffer(uint tokenId, address bidder) external returns(uint);



    function retrieveOwner() external view returns (address);
    function retrieveOffer(uint tokenId, uint offerId) external view returns (address, uint);

}