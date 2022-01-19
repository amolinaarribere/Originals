// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.7;

/*
  Manager Contract is a Base contract that simply adds a manager contract as a reference for multiple operations
 */

import "../Libraries/Library.sol";
import "../Interfaces/IManager.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract ManagedBaseContract is Initializable{
    using Library for *;

    // DATA /////////////////////////////////////////
    IManager internal _managerContract;

    // MODIFIERS /////////////////////////////////////////
     modifier isFromManagerContract(address addr){
        Library.ItIsSomeone(addr, address(_managerContract));
        _;
    }

    // CONSTRUCTOR /////////////////////////////////////////
    function ManagedBaseContract_init(address managerContractAddress) internal initializer {
        _managerContract = IManager(managerContractAddress);
    }

    // FUNCTIONALITY /////////////////////////////////////////
    function retrieveManagerContract() external view returns(address){
        return address(_managerContract);
    }

}