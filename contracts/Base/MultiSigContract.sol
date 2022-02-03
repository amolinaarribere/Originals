// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.7;

/*
  MultiSig Contract.
    Inherits from EntitesBaseCOntract and simply defines CRUD operations for Owners with spepcific security checks
 */

 import "../Interfaces/IMultiSigContract.sol";
 import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
 import "../Libraries/AddressLibrary.sol";


abstract contract MultiSigContract is IMultiSigContract, Initializable{
    using AddressLibrary for *;

    // EVENTS /////////////////////////////////////////
    event _VoteForOwner(address owner, address voter, bool vote);
    event _AddOwnerValidation(address owner);
    event _RemoveOwnerValidation(address owner);
    event _AddOwnerRejection(address owner);
    event _RemoveOwnerRejection(address owner);

    event _VoteForMinOwner(uint256 minOwner, address voter, bool vote);
    event _MinOwnerValidation(uint256 minOwner);
    event _MinOwnerRejection(uint256 minOwner);

    // DATA /////////////////////////////////////////
    // Owners
    struct _ownerStruct{
        bool _activated;
        uint _id;
        uint _pendingId;
        uint _validations;
        uint _rejections;
        address[] _Voters;
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
        require(YesOrNo == (isOwnerPendingToAdded(addr) || isOwnerPendingToRemoved(addr)), "EC10-");
    }
    
    modifier minRequired(uint min, uint number){
         minRequiredFunc(min, number);
        _;
    }

    function minRequiredFunc(uint min, uint number) internal pure{
        require(min <= number, "EC19-");
    }

    modifier HasNotAlreadyVoted(address voter, address[] memory listOfVoters){
        HasNotAlreadyVotedFunc(voter, listOfVoters);
       _;
    }

    function HasNotAlreadyVotedFunc(address voter, address[] memory listOfVoters) internal pure {
        require(false == AddressLibrary.FindAddress(voter, listOfVoters), "EC5-");
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
        isAnOwner(owner, false)
    {
        updateOwner(owner,  _Owners._pendingOwnersAdd);
    }
    
    function removeOwner(address owner) external override
        isAnOwner(owner, true)
        minRequired(_minOwners, _Owners._activatedOwners.length - 1)
    {
        updateOwner(owner,  _Owners._pendingOwnersRemove);
    }

    function updateOwner(address owner, address[] storage pendingList) internal
        isAnOwner(msg.sender, true)
        OwnerPending(owner, false)
    {
        pendingList.push(owner);
        uint pos = pendingList.length - 1;
        _Owners._owner[owner]._pendingId = pos;

        VoteForOwner(owner, true);
    }

    function validateOwner(address owner) external override
    {
        if(true == isOwnerPendingToRemoved(owner)){
            require(_minOwners <= _Owners._activatedOwners.length - 1, "EC19-");
        }
        VoteForOwner(owner, true);
    }

    function rejectOwner(address owner) external override
    {
        VoteForOwner(owner, false);
    }

    function VoteForOwner(address owner, bool vote) internal
        isAnOwner(msg.sender, true)
        OwnerPending(owner, true)
        HasNotAlreadyVoted(msg.sender, _Owners._owner[owner]._Voters)        
    {

        emit _VoteForOwner(owner, msg.sender, vote);

        _Owners._owner[owner]._Voters.push(msg.sender);
        
        if(vote){
            _Owners._owner[owner]._validations++;

            if(_Owners._owner[owner]._validations >= _minOwners){
                address[] storage pendingList = _Owners._pendingOwnersRemove;
                if(isOwnerPendingToAdded(owner)){
                    pendingList = _Owners._pendingOwnersAdd;
                    _Owners._activatedOwners.push(owner);
                    _Owners._owner[owner]._activated = true;
                    _Owners._owner[owner]._id = _Owners._activatedOwners.length - 1; 
                    emit _AddOwnerValidation(owner);
                }
                else{
                    uint pos = _Owners._owner[owner]._id;
                    AddressLibrary.AddressArrayRemoveResize( pos, _Owners._activatedOwners);
                    if(_Owners._activatedOwners.length > pos)  _Owners._owner[_Owners._activatedOwners[pos]]._id = pos;
                    delete(_Owners._owner[owner]._activated);
                    delete(_Owners._owner[owner]._id); 
                    emit _RemoveOwnerValidation(owner);
                }

                deletingPendingOwner(owner, pendingList);
            }
        }
        else{
            _Owners._owner[owner]._rejections++;

            if(_Owners._owner[owner]._rejections >= _minOwners){
                address[] storage pendingList = _Owners._pendingOwnersRemove;
                if(isOwnerPendingToAdded(owner)){
                    pendingList = _Owners._pendingOwnersAdd;
                    emit _AddOwnerRejection(owner);
                } 
                else{
                    emit _RemoveOwnerRejection(owner);
                }
                
                deletingPendingOwner(owner, pendingList);
            }
        }

    }

    function deletingPendingOwner(address owner, address[] storage pendingList) internal
    {
        uint pos = _Owners._owner[owner]._pendingId;
        AddressLibrary.AddressArrayRemoveResize(pos, pendingList);
        if(pendingList.length > pos)  _Owners._owner[pendingList[pos]]._pendingId = pos;
        delete(_Owners._owner[owner]._pendingId);
        delete(_Owners._owner[owner]._validations);
        delete(_Owners._owner[owner]._rejections);
        delete(_Owners._owner[owner]._Voters);
    }
    

    function retrieveAllOwners() external override view returns (address[] memory){
        return(_Owners._activatedOwners);
    }

    function retrievePendingOwners(bool addedORremove) external override view returns (address[] memory){
        if(addedORremove) return(_Owners._pendingOwnersAdd);
        return(_Owners._pendingOwnersRemove);
    }

    function isOwner(address addr) internal 
    view returns (bool)
    {
        return _Owners._owner[addr]._activated;
    }

    function isOwnerPendingToAdded(address addr) internal view returns(bool)
    {
        if(_Owners._owner[addr]._pendingId >= _Owners._pendingOwnersAdd.length) return false;
        return (addr == _Owners._pendingOwnersAdd[_Owners._owner[addr]._pendingId]);
    }

    function isOwnerPendingToRemoved(address addr) internal view returns(bool)
    {
        if(_Owners._owner[addr]._pendingId >= _Owners._pendingOwnersRemove.length) return false;
        return (addr == _Owners._pendingOwnersRemove[_Owners._owner[addr]._pendingId]);
    }


    // FUNCTIONALITY MIN OWNER /////////////////////////////////////////
    function retrieveMinOwners() external override view returns (uint){
        return (_minOwners);
    }

    // New min Owners proposal
    function changeMinOwners(uint newMinOwners) external override
        isAnOwner(msg.sender, true)
        NewMinOwnerInProgress(false)
        minRequired(newMinOwners, _Owners._activatedOwners.length)
        minRequired(1, newMinOwners)
    {
        _newMinOwners = newMinOwners;
        voteNewMinOwners(true);
    }

    function validateMinOwners() external override
    {
        voteNewMinOwners(true);
    }
    
    function rejectMinOwners() external override
    {
        voteNewMinOwners(false);
    }

    function voteNewMinOwners(bool vote) internal 
        isAnOwner(msg.sender, true)
        NewMinOwnerInProgress(true)
        HasNotAlreadyVoted(msg.sender, _newMinOwnersVoters)
    {
        if(vote) _newMinOwnersVotesFor += 1;
        else _newMinOwnersVotesAgainst += 1;

        _newMinOwnersVoters.push(msg.sender);

        emit _VoteForMinOwner(_newMinOwners, msg.sender, vote);

        checkNewMinOwners();         
    }

    function deleteNewMinOwners() internal 
    {
        _newMinOwners = 0;
        _newMinOwnersVotesFor = 0;
        _newMinOwnersVotesAgainst = 0;
        delete(_newMinOwnersVoters);
    }

    function checkNewMinOwners() internal
    {
        if(CheckValidations(_newMinOwnersVotesFor, _minOwners))
        {
            _minOwners = _newMinOwners;
            emit _MinOwnerValidation(_newMinOwners);
            deleteNewMinOwners();
        }
        else if(CheckValidations(_newMinOwnersVotesAgainst, _minOwners))
        {
            emit _MinOwnerRejection(_newMinOwners);
            deleteNewMinOwners();
        }

    }

    function CheckValidations(uint256 signatures, uint256 minSignatures) internal pure returns(bool){
        if(signatures < minSignatures) return false;
        return true;
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