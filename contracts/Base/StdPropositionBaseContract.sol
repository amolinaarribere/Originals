// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.7;

/**
 Price Converter is an interface to the Chain Link Price Registry for USD to ETH exchange
 */

import "./TokenGovernanceBaseContract.sol";
import "../Interfaces/IStdPropositionBaseContract.sol";


abstract contract StdPropositionBaseContract is IStdPropositionBaseContract, TokenGovernanceBaseContract {

    // DATA /////////////////////////////////////////
    bytes[] internal _ProposedNewValues;

    // CONSTRUCTOR /////////////////////////////////////////
    function StdPropositionBaseContract_init(address chairPerson, address managerContractAddress, string memory contractName, string memory contractVersion) public initializer 
    {
        super.TokenGovernanceContract_init(chairPerson, managerContractAddress, contractName, contractVersion);
    }

    // GOVERNANCE /////////////////////////////////////////
    function sendProposition(bytes[] memory NewValues) external override
    {
        checkProposition(NewValues);
        addProposition();
        for(uint i=0; i < NewValues.length; i++){
            _ProposedNewValues.push(NewValues[i]);
        }
    }

    function propositionApproved() internal override
    {
        UpdateAll();
        removeProposition();
    }

    function propositionRejected() internal override
    {
        removeProposition();
    }

    function propositionExpired() internal override
    {
        removeProposition();
    }

    function propositionCancelled() internal override
    {
        removeProposition();
    }


    function removeProposition() internal
    {
        delete(_ProposedNewValues);
    }

    function retrieveProposition() external override view returns(bytes[] memory)
    {
        return _ProposedNewValues;
    }

    function PropositionsToBytes32() internal view returns (bytes32[] memory)
    {
        bytes32[] memory PropositionsBytes32 = new bytes32[](_ProposedNewValues.length);

        for(uint i=0; i<_ProposedNewValues.length; i++){
            PropositionsBytes32[i] = Library.BytestoBytes32(_ProposedNewValues[i])[0];
        }

        return PropositionsBytes32;
    }

    function checkProposition(bytes[] memory NewValues) internal virtual{}

    function UpdateAll() internal virtual;

}