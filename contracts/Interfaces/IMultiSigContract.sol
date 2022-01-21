// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.7;

/**
 * @title Storage
 * @dev Store & retrieve value in a variable
 */
import "../Libraries/ItemsLibrary.sol";

 interface IMultiSigContract  {
    function addOwner(address owner) external;
    function removeOwner(address owner) external;
    function validateOwner(address owner) external;
    function rejectOwner(address owner) external;

    function changeMinOwners(uint newMinOwners) external;
    function validateMinOwners() external;
    function rejectMinOwners() external;

    function retrieveAllOwners() external view returns (address[] memory);
    function retrieveMinOwners() external view returns (uint);
    function retrievePendingOwners(bool addedORremove) external view returns (address[] memory);
    function retrievePendingMinOwners() external view returns (uint);
    function retrievePendingMinOwnersStatus() external view returns (uint, uint, address[] memory);

}