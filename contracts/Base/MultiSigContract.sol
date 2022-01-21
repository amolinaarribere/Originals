// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.7;

/*
  MultiSig Contract.
    Inherits from EntitesBaseCOntract and simply defines CRUD operations for Owners with spepcific security checks
 */

 import "../Interfaces/IMultiSigContract.sol";
 import "../Base/EntitiesBaseContract.sol";
 import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
 import "../Libraries/AddressLibrary.sol";


abstract contract MultiSigContract is IMultiSigContract, Initializable{
    using AddressLibrary for *;

    // DATA /////////////////////////////////////////
    // Owners
    struct _ownerStruct{
        bool _activated;
        uint _id;
        uint _pendingId;
        address[] _Validations;
        address[] _Rejections;
    }

    struct _ownersStruct{
        mapping(address => _ownerStruct) _owner;
        address[] _activatedOwners;
        address[] _pendingOwnersAdd;
        address[] _pendingOwnersRemove;
    }

    _ownersStruct internal _Owners;
    uint256 internal _minOwners;

    // proposal for new min owners
    uint256 internal _newMinOwners;
    uint256 internal _newMinOwnersVotesFor;
    uint256 internal _newMinOwnersVotesAgainst;
    address[] internal _newMinOwnersVoters;

    // MODIFIERS /////////////////////////////////////////
    modifier isAnOwner(address addr, bool YesOrNo){
        isAnOwnerFunc(addr, YesOrNo);
        _;
    }

    function isAnOwnerFunc(address addr, bool YesOrNo) internal view{
        require(YesOrNo == isOwner(addr), "EC9-");
    }

    modifier OwnerPending(address addr, bool YesOrNo){
        OwnerPendingFunc(addr, YesOrNo);
        _;
    }

    function OwnerPendingFunc(address addr, bool YesOrNo) internal view{
        require(YesOrNo == (isOwnerPendingToAdded(addr) || isOwnerPendingToRemoved(addr)), "EC9-");
    }

   /* modifier OwnerPendingToAdded(address addr, bool YesOrNo){
        OwnerPendingToAddedFunc(addr, YesOrNo);
        _;
    }

    function OwnerPendingToAddedFunc(address addr, bool YesOrNo) internal view{
        require(YesOrNo == isOwnerPendingToAdded(addr), "EC9-");
    }

    modifier OwnerPendingToRemoved(address addr, bool YesOrNo){
        OwnerPendingToRemovedFunc(addr, YesOrNo);
        _;
    }

    function OwnerPendingToRemovedFunc(address addr, bool YesOrNo) internal view{
        require(YesOrNo == isOwnerPendingToRemoved(addr), "EC9-");
    }*/
    
    modifier minRequired(uint min, uint number){
         minRequiredFunc(min, number);
        _;
    }

    function minRequiredFunc(uint min, uint number) internal pure{
        require(min <= number, "EC19-");
    }

    modifier HasNotAlreadyVoted(address voter, address owner, bool minOwner){
        HasNotAlreadyVotedFunc(voter, owner, minOwner);
       _;
    }

    function HasNotAlreadyVotedFunc(address voter, address owner, bool minOwner) internal view {
        if(minOwner){
            require(false == AddressLibrary.FindAddress(voter, _newMinOwnersVoters), "EC5-");
        }
        else{
            require (false == (AddressLibrary.FindAddress(voter, _Owners._owner[owner]._Validations) ||
                            AddressLibrary.FindAddress(voter, _Owners._owner[owner]._Rejections))
                    );
        }
    }
    
    modifier NewMinOwnerInProgress(bool YesOrNo){
        NewMinOwnerInProgressFunc(YesOrNo);
        _;
    }

    function NewMinOwnerInProgressFunc(bool YesOrNo) internal view{
        if(YesOrNo) require(0 != _newMinOwners, "EC31-");
        else require(0 == _newMinOwners, "EC30-");
    }

    // CONSTRUCTOR /////////////////////////////////////////
    function MultiSigContract_init(address[] memory owners,  uint256 minOwners) public initializer 
        minRequired(minOwners, owners.length)
        minRequired(1, minOwners)
    {
        _minOwners = minOwners;
        for (uint i=0; i < owners.length; i++) {
            _Owners._owner[owners[i]]._activated = true;
            _Owners._activatedOwners.push(owners[i]);
        } 
    }

    // FUNCTIONALITY OWNER /////////////////////////////////////////
    function addOwner(address owner) external override 
        isAnOwner(msg.sender, true)
        isAnOwner(owner, false)
        OwnerPending(owner, false)
    {
        _Owners._pendingOwnersAdd.push(owner);
        uint pos = _Owners._pendingOwnersAdd.length - 1;
        _Owners._owner[owner]._pendingId = pos;

        vote(msg.sender, owner, true);
    }
    
    function removeOwner(address owner) external override
        isAnOwner(msg.sender, true)
        isAnOwner(owner, true)
        OwnerPending(owner, false)
        minRequired(_minOwners, _Owners._activatedOwners.length - 1)
    {
        _Owners._pendingOwnersRemove.push(owner);
        uint pos = _Owners._pendingOwnersRemove.length - 1;
        _Owners._owner[owner]._pendingId = pos;

        vote(msg.sender, owner, true);
    }

    function validateOwner(address owner) external override
    {
        if(true == isOwnerPendingToRemoved(owner)){
            require(_minOwners <= _Owners._activatedOwners.length - 1, "EC19-");
        }
        Vote(owner, true);
    }

    function rejectOwner(address owner) external override
    {
        Vote(owner, false);
    }

    function VoteForOwner(address owner, bool vote) internal
        isAnOwner(msg.sender, true)
        OwnerPending(owner, true)
        HasNotAlreadyVoted(msg.sender, owner, false)
    {
        if(vote){
            _Owners._owner[owner]._Validations.push(msg.sender);
            if(_Owners._owner[owner]._Validations.length >= _minOwners){
                if(isOwnerPendingToAdded(owner)){
                    AddressLibrary.AddressArrayRemoveResize(_Owners._owner[owner]._pendingId, _Owners._pendingOwnersAdd);


                    ............
                }
                else{

                }
            }
        }
        else{
            _Owners._owner[owner]._Rejections.push(msg.sender);
            if(_Owners._owner[owner]._Rejections.length >= _minOwners){
                if(isOwnerPendingToAdded(owner)){

                }
                else{
                    
                }
            }
        }
    }
    

    function retrieveAllOwners() external override view returns (address[] memory)){
        return(_Owners._activatedOwners);
    }

    function retrievePendingOwners(bool addedORremove) external override view returns (address[] memory){
        if(addedORremove) return(_Owners._pendingOwnersAdd);
        return(_Owners._pendingOwnersRemove);
    }

    function isOwner(address addr) internal 
    view returns (bool)
    {
        return _Owners.owner[addr]._activated;
    }

    function isOwnerPendingToAdded(address addr) public view returns(bool)
    {
        return (addr == _Owners._pendingOwnersAdd[_Owners._owner[addr]._pendingId]);
    }

    function isOwnerPendingToRemoved(address addr) public view returns(bool)
    {
        return (addr == _Owners._pendingOwnersRemove[_Owners._owner[addr]._pendingId]);
    }


    // FUNCTIONALITY MIN OWNER /////////////////////////////////////////
    function retrieveMinOwners() external override view returns (uint){
        return (_minOwners);
    }

    // New min Owners proposal
    function changeMinOwners(uint newMinOwners) external override
        isAnOwner(msg.sender)
        NewMinOwnerInProgress(false)
        minRequired(newMinOwners, _Entities[_ownerId]._activatedItems.length)
        minRequired(1, newMinOwners)
    {
        _newMinOwners = newMinOwners;
        voteNewMinOwners(true);
    }

    function validateMinOwners() external override
        isAnOwner(msg.sender)
        NewMinOwnerInProgress(true)
        HasNotAlreadyVotedMinOwner(msg.sender)
    {
        voteNewMinOwners(true);
    }
    
    function rejectMinOwners() external override
        isAnOwner(msg.sender)
        NewMinOwnerInProgress(true)
        HasNotAlreadyVotedMinOwner(msg.sender)
    {
        voteNewMinOwners(false);
    }

    function deleteNewMinOwners() internal 
    {
        _newMinOwners = 0;
        _newMinOwnersVotesFor = 0;
        _newMinOwnersVotesAgainst = 0;
        delete(_newMinOwnersVoters);
    }

    function voteNewMinOwners(bool vote) internal 
    {
        if(vote) _newMinOwnersVotesFor += 1;
        else _newMinOwnersVotesAgainst += 1;

        _newMinOwnersVoters.push(msg.sender);

        checkNewMinOwners();        
    }

    function checkNewMinOwners() internal
    {
        if(ItemsLibrary.CheckValidations(_newMinOwnersVotesFor, _minOwners))
        {
            _minOwners = _newMinOwners;
            deleteNewMinOwners();
        }
        else if(ItemsLibrary.CheckValidations(_newMinOwnersVotesAgainst, _minOwners))
        {
            deleteNewMinOwners();
        }

    }

    function retrievePendingMinOwners() external override view returns (uint)
    {
        return _newMinOwners;
    }

    function retrievePendingMinOwnersStatus() external override view returns (uint, uint, address[] memory)
    {
        return (_newMinOwnersVotesFor, _newMinOwnersVotesAgainst, _newMinOwnersVoters);
    }

}