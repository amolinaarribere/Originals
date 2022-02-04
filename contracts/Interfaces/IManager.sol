// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.7;

/**
 * @title Storage
 * @dev Store & retrieve value in a variable
 */
 import "../Libraries/Library.sol";
 import "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";
import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";

 interface IManager  {
    function InitializeContracts(Library.ProposedContractsStruct calldata initialContracts, TransparentUpgradeableProxy ManagerProxy) external;

    function retrieveTransparentProxies() external view returns (address[] memory) ;
    function retrieveBeacons() external view returns (address[] memory);
    function retrieveTransparentProxiesImpl() external view returns (address[] memory);
    function retrieveBeaconsImpl() external view returns (address[] memory);
    function retrieveProxyAdmin() external view returns (address);
    
    function isInitialized() external view returns(bool);
}