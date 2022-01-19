// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.7;

/**
 * @title Storage
 * @dev Store & retrieve value in a variable
 */


interface IFactory {

    function create(address owner, string memory name, string memory symbol) external returns (address);

    function retrieve(uint Id) external view returns (address, string memory, string memory);
    function retrieveTotal() external view returns (uint);

}