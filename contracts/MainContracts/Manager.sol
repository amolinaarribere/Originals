// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.7;

/**
 * @title Storage
 * @dev Store & retrieve value in a variable

Transparent Proxies:
    - 0 : Itself (Certificate Pool Manager)
    - 1 : Public Pool
    - 2 : Treasury
    - 3 : Certis Token
    - 4 : Private Pool Factory
    - 5 : Provider Factory
    - 6 : Price Converter
    - 7 : Proposition Settings
    - 8 : ENS

Beacons:
    - 0 : Private Pool
    - 1 : Provider

 NewProposals :
    - Amount of New Transaparent proxies = m
    - Amount of New Beacons = q
    - New Address Transaparent proxy 1
    - ...
    - New Address Transaparent proxy n
    - Address New Transaparent proxy 1
    - ...
    - Address New Transaparent proxy m
    - New Address Beacon proxy 1
    - ...
    - New Address Beacon proxy p
    - Address New Beacon proxy 1
    - ...
    - Address New Beacon proxy q
    - Data Transaparent proxy 1
    - ..
    - Data Transaparent proxy n
    - Data New Transaparent proxy 1
    - ..
    - Data New Transaparent proxy m
 */

import "../Interfaces/IManager.sol";
import "../Interfaces/IFactory.sol";
import "../Base/StdPropositionBaseContract.sol";
import "../Libraries/AddressLibrary.sol";
import "../Libraries/Library.sol";
import "../Libraries/UintLibrary.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";
import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
import "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";


contract CertificatesPoolManager is IManager, StdPropositionBaseContract{
    using AddressLibrary for *;
    using Library for *;
    using UintLibrary for *;

    // EVENTS /////////////////////////////////////////
    event _NewProxy(address NewContractAddress, uint ProxyId, string ProxyType);
    event _ContractUpgrade(address NewContractAddress, uint ProxyId, string ProxyType);

    // DATA /////////////////////////////////////////
    // Admin Proxy to manage all the TransparentUpgradeableProxies
    ProxyAdmin private _Admin;

    // Transparent Proxies
    TransparentUpgradeableProxy[] private _TransparentProxies;

    // Beacons
    UpgradeableBeacon[] private _Beacons;

    // Proxy Types
    string constant _TransparentType = "Transparent";
    string constant _BeaconType = "Beacon";
    uint constant _NewPropositionsRedimesionFields = 2; // The first "NewPropositionsRedimesionFields" elements of every new proposition indicate the number of new transaprent/beacon/... proxies to add to the system

    // init
    bool private _init;

    // MODIFIERS /////////////////////////////////////////
    modifier isNotInitialized(){
        require(false == _init, "EC26-");
        _;
    }

    // INITIALIZATION /////////////////////////////////////////
    function CertificatesPoolManager_init(address chairPerson, string memory contractName, string memory contractVersion) public initializer
    {
        super.StdPropositionBaseContract_init(chairPerson, address(this), contractName, contractVersion);
        _Admin = new ProxyAdmin();
    }

    function InitializeContracts(Library.ProposedContractsStruct calldata initialContracts, TransparentUpgradeableProxy ManagerProxyAddress) 
        isFromChairPerson(msg.sender)
        isNotInitialized()
    external override
    {
        initProxies(initialContracts, ManagerProxyAddress);
        _init = true;
    }

    // FUNCTIONALITY /////////////////////////////////////////
    // governance : contracts assignment and management
    function initProxies(Library.ProposedContractsStruct calldata initialContracts, TransparentUpgradeableProxy ManagerProxyAddress) private
    {
        _TransparentProxies.push(TransparentUpgradeableProxy(ManagerProxyAddress));

        for(uint i=0; i < initialContracts.TransparentAddresses.length; i++){
            addTransparentProxy(initialContracts.TransparentAddresses[i], initialContracts.TransparentData[i]);
        }
        for(uint i=0; i < initialContracts.BeaconAddresses.length; i++){
            addBeacon(initialContracts.BeaconAddresses[i]);
        }
        IFactory(address(_TransparentProxies[uint256(Library.TransparentProxies.PrivatePoolFactory)])).updateContractName(initialContracts.PrivatePoolContractName);
        IFactory(address(_TransparentProxies[uint256(Library.TransparentProxies.PrivatePoolFactory)])).updateContractVersion(initialContracts.PrivatePoolContractVersion);
    }

    function UpdateAll() internal override
    {

        uint256 pointer = _NewPropositionsRedimesionFields;
        uint256 NewTransparentProxies = UintLibrary.Bytes32ToUint(Library.BytestoBytes32(_ProposedNewValues[0])[0]); // m
        uint256 NewBeaconProxies = UintLibrary.Bytes32ToUint(Library.BytestoBytes32(_ProposedNewValues[1])[0]); // q
        uint256 TransaprentProxyDataSkip = _TransparentProxies.length + NewTransparentProxies + _Beacons.length + NewBeaconProxies;

        // Transaprent Proxies : We start at 1 so that if we update the code of this SC it will be done at the end
        for(uint i=1; i < _TransparentProxies.length; i++){
            upgradeTransparentProxy(_TransparentProxies[i], 
                i, 
                _ProposedNewValues[pointer + i], 
                _ProposedNewValues[pointer + TransaprentProxyDataSkip + i]);
        }

        pointer = pointer + _TransparentProxies.length;

        if(NewTransparentProxies > 0){
            for(uint i=0; i < NewTransparentProxies; i++){
                addTransparentProxy(
                AddressLibrary.Bytes32ToAddress(Library.BytestoBytes32(_ProposedNewValues[pointer + i])[0]), 
                _ProposedNewValues[pointer + TransaprentProxyDataSkip + i]);
            }

            pointer = pointer + NewTransparentProxies;
        }
        
        // Beacons
        for(uint i=0; i < _Beacons.length; i++){
            upgradeBeacon(_Beacons[i], 
                i, 
                _ProposedNewValues[pointer + i]);
        }

        pointer = pointer + _Beacons.length;

        if(NewBeaconProxies > 0){
            for(uint i=0; i < NewBeaconProxies; i++){
                addBeacon(AddressLibrary.Bytes32ToAddress(Library.BytestoBytes32(_ProposedNewValues[pointer + i])[0]));
            }

            pointer = pointer + NewBeaconProxies;
        }

        pointer = pointer + _TransparentProxies.length + NewTransparentProxies;
        

        if(0 < _ProposedNewValues[pointer].length)
            IFactory(address(_TransparentProxies[uint256(Library.TransparentProxies.PrivatePoolFactory)])).updateContractName(string(_ProposedNewValues[pointer]));

        if(0 < _ProposedNewValues[pointer + 1].length)
            IFactory(address(_TransparentProxies[uint256(Library.TransparentProxies.PrivatePoolFactory)])).updateContractVersion(string(_ProposedNewValues[pointer + 1]));

        // We finally upgrade this contract if required
        upgradeTransparentProxy(_TransparentProxies[uint256(Library.TransparentProxies.CertificatePoolManager)], 
                uint256(Library.TransparentProxies.CertificatePoolManager), 
                _ProposedNewValues[_NewPropositionsRedimesionFields], 
                _ProposedNewValues[_NewPropositionsRedimesionFields + TransaprentProxyDataSkip]);

    }

    function addTransparentProxy(address implAddress, bytes memory data) private
    {
        if(address(0) != implAddress){
            _TransparentProxies.push(new TransparentUpgradeableProxy(implAddress, address(_Admin), data));
            emit _NewProxy(implAddress, _TransparentProxies.length, _TransparentType);
        }
    }

    function addBeacon(address implAddress) private
    {
        if(address(0) != implAddress){
            _Beacons.push(new UpgradeableBeacon(implAddress));
            emit _NewProxy(implAddress, _Beacons.length, _BeaconType);
        }
    }

    function upgradeTransparentProxy(TransparentUpgradeableProxy proxy, uint ProxyId, bytes memory NewImpl, bytes memory Data) private
    {
        address NewImplAddress = AddressLibrary.Bytes32ToAddress(Library.BytestoBytes32(NewImpl)[0]);
        if(address(0) != NewImplAddress){
            if(0 < Data.length)_Admin.upgradeAndCall(proxy, NewImplAddress, Data);
            else _Admin.upgrade(proxy, NewImplAddress);
            emit _ContractUpgrade(NewImplAddress, ProxyId, _TransparentType);
        }
    }

    function upgradeBeacon(UpgradeableBeacon beacon, uint BeaconId, bytes memory NewImpl) private
    {
        address NewImplAddress = AddressLibrary.Bytes32ToAddress(Library.BytestoBytes32(NewImpl)[0]);
        if(address(0) != NewImplAddress){
            beacon.upgradeTo(NewImplAddress);
            emit _ContractUpgrade(NewImplAddress, BeaconId, _BeaconType);
        }

    }

    // configuration Proxies
    function retrieveTransparentProxies() external override view returns (address[] memory) 
    {
        address[] memory proxies = new address[](_TransparentProxies.length);
        for(uint i=0; i < proxies.length; i++){
            proxies[i] = address(_TransparentProxies[i]);
        }
        return proxies;
    }

    function retrieveBeacons() external override view returns (address[] memory) 
    {
        address[] memory proxies = new address[](_Beacons.length);
        for(uint i=0; i < proxies.length; i++){
            proxies[i] = address(_Beacons[i]);
        }
        return proxies;
    }

    // configuration implementations
    function retrieveProxyAdmin() external override view returns (address){
        return address(_Admin);
    }

    function retrieveTransparentProxiesImpl() external override view returns (address[] memory) 
    {
        address[] memory implementations = new address[](_TransparentProxies.length);
        for(uint i=0; i < implementations.length; i++){
            implementations[i] = internalRetrieveTransparentProxyImpl(_TransparentProxies[i]);
        }
        return implementations;
    }

    function retrieveBeaconsImpl() external override view returns (address[] memory) 
    {
        address[] memory implementations = new address[](_Beacons.length);
        for(uint i=0; i < implementations.length; i++){
            implementations[i] = internalRetrieveBeaconImpl(_Beacons[i]);
        }
        return implementations;
    }

    function isInitialized() external override view returns(bool){
        return _init;
    }

    // internal
    function internalRetrieveTransparentProxyImpl(TransparentUpgradeableProxy proxy) internal view returns (address){
        return _Admin.getProxyImplementation(proxy);
    }

    function internalRetrieveBeaconImpl(UpgradeableBeacon beacon) internal view returns (address){
        return beacon.implementation();
    }
  
}