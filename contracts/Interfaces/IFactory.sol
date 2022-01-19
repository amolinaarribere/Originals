// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.7;

/**
 * @title Storage
 * @dev Store & retrieve value in a variable
 */


interface IFactory {

    function create(address[] memory owners,  uint256 minOwners, string memory ElementName, string memory ENSName) external payable;
    function updateContractName(string memory contractName) external;
    function updateContractVersion(string memory contractVersion) external;

    function retrieve(uint Id) external view returns (address, address, string memory);
    function retrieveTotal() external view returns (uint);
    function retrieveConfig() external view returns (string memory, string memory, string memory);

}