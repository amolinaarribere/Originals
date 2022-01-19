// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.7;

/**
  Events : 
    - New Settings Added : list of settings
 */

import "../Interfaces/IPropositionSettings.sol";
import "../Libraries/UintLibrary.sol";
import "../Base/StdPropositionBaseContract.sol";

contract PropositionSettings is IPropositionSettings, StdPropositionBaseContract{
    using UintLibrary for *;

    // EVENTS /////////////////////////////////////////
    event _NewSettings(uint256 LifeTime, uint256 Threshold, uint256 minToPropose);

    // DATA /////////////////////////////////////////
    uint256 internal _LifeTime;
    uint256 internal _Threshold;
    uint256 internal _minToPropose;

    // MODIFIERS /////////////////////////////////////////
    function areSettingsOKFunc(uint256 PropositionThreshold, uint256 minToPropose) internal view{
        require(totalSupply() >= PropositionThreshold, "EC21-");
        require(totalSupply() >= minToPropose, "EC21-");
    }
    
    // CONSTRUCTOR /////////////////////////////////////////
    function PropositionSettings_init(address managerContractAddress, address chairPerson, uint256 PropositionLifeTime, uint256 PropositionThreshold, uint256 minToPropose, string memory contractName, string memory contractVersion) public initializer 
    {
        super.StdPropositionBaseContract_init(chairPerson, managerContractAddress, contractName, contractVersion);
        areSettingsOKFunc(PropositionThreshold, minToPropose);
        InternalupdateSettings(PropositionLifeTime, PropositionThreshold, minToPropose);
    }

    // GOVERNANCE /////////////////////////////////////////
    function checkProposition(bytes[] memory NewValues) internal override view 
    {
        areSettingsOKFunc(UintLibrary.Bytes32ToUint(Library.BytestoBytes32(NewValues[1])[0]), UintLibrary.Bytes32ToUint(Library.BytestoBytes32(NewValues[2])[0]));
    }

    function UpdateAll() internal override
    {
        bytes32[] memory ProposedNewValues = PropositionsToBytes32();

        uint256 PropositionLifeTime = UintLibrary.Bytes32ToUint(ProposedNewValues[0]);
        uint256 PropositionThreshold = UintLibrary.Bytes32ToUint(ProposedNewValues[1]);
        uint256 minToPropose = UintLibrary.Bytes32ToUint(ProposedNewValues[2]);

        InternalupdateSettings(PropositionLifeTime, PropositionThreshold, minToPropose);

        emit _NewSettings(PropositionLifeTime, PropositionThreshold, minToPropose);
    }

    function InternalupdateSettings(uint256 PropLifeTime, uint256 PropThreshold, uint256 minToProp) internal
    {
        _LifeTime = PropLifeTime;
        _Threshold = PropThreshold;
        _minToPropose = minToProp;
    }

    // FUNCTIONALITY /////////////////////////////////////////
    function retrieveSettings() external override view returns(uint256, uint256, uint256)
    {
        return(_LifeTime, _Threshold, _minToPropose);
    }


}