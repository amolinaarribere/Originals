// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.7;

/**
 Certis Token is an ERC20 Token that grants its holder the right to:
   - Vote on all the systems propositions (changing system configuraiton etc...)
   - Receive Dividends for all the payments forwarded to the Treasury contract

Before every token transfer we contact the token gouvernance Base contracts so that the can update the tokens used for voting if needed

 */

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../Interfaces/IPool.sol";
import "../Base/ManagedBaseContract.sol";
import "../Base/MultiSigContract.sol";
import "../Libraries/ItemsLibrary.sol";
import "../Libraries/UintLibrary.sol";



 contract PublicPool is  Initializable, MultiSigContract, ManagedBaseContract, IPool {
  using ItemsLibrary for *;
  using UintLibrary for *;

  // EVENTS /////////////////////////////////////////
  event _NewIssuerRequest(address indexed owner, string name, string symbol);

  event _VoteForIssuer(uint256 id, address voter, bool vote);
  event _IssuerValidation(uint256 id);
  event _IssuerRejection(uint256 id);

  // DATA /////////////////////////////////////////
  mapping(uint256 => address) _issuers;
  uint256[] _listOfIssuers;

  mapping(uint256 => ItemsLibrary._pendingIssuerStruct) _pendingIssuers;
  uint256[] _listOfPendingIssuers;

  uint256 nextIssuerId;

  // MODIFIERS /////////////////////////////////////////
  modifier validOwners(address owner){
      require(address(0) != owner, "NFT Market owner cannot be address 0");
      _;
  }

  modifier IssuerPending(uint256 id){
      require(address(0) != _pendingIssuers[id]._issuer._owner, "This issuer id is not pending");
      _;
  }

  // CONSTRUCTOR /////////////////////////////////////////
  function PublicPool_init(address[] memory owners,  uint256 minOwners, address managerContractAddress) public initializer {
      super.MultiSigContract_init(owners, minOwners); 
      super.ManagedBaseContract_init(managerContractAddress); 

      nextIssuerId = 0;
  }

  // FUNCTIONALITY /////////////////////////////////////////
  function requestIssuer(address owner, string memory name, string memory symbol, Library.PaymentPlans paymentPlan) external override payable
    validOwners(owner)
  returns (uint)
  {
    _pendingIssuers[nextIssuerId]._issuer._owner = owner;
    _pendingIssuers[nextIssuerId]._issuer._name = name;
    _pendingIssuers[nextIssuerId]._issuer._symbol = symbol;
    _pendingIssuers[nextIssuerId]._issuer._paymentPlan = paymentPlan;
    _pendingIssuers[nextIssuerId]._pendingId = _listOfPendingIssuers.length;
    
    _listOfPendingIssuers.push(nextIssuerId);
    nextIssuerId++;

    return(nextIssuerId - 1);
  }

  function validateIssuer(uint256 id) external override
  {
    voteForIssuer(id, true);
  }

  function rejectIssuer(uint id) external override
  {
    voteForIssuer(id, false);
  }

  function voteForIssuer(uint id, bool vote) internal
    isAnOwner(msg.sender, true)
    IssuerPending(id)
  {
    emit _VoteForIssuer(id, msg.sender, vote);

    _pendingIssuers[id]._voters.push(msg.sender);
        
    if(vote){
        _pendingIssuers[id]._validations++;

        if(_pendingIssuers[id]._validations >= _minOwners){
            _listOfIssuers.push(id);
            _issuers[id] = GenerateNewNFTMarket(_pendingIssuers[id]._issuer._owner, _pendingIssuers[id]._issuer._name, _pendingIssuers[id]._issuer._symbol, _pendingIssuers[id]._issuer._paymentPlan);
            deletingPendingIssuer(id);
        }
    }
    else{
        _pendingIssuers[id]._rejections++;

        if(_pendingIssuers[id]._rejections >= _minOwners){
            deletingPendingIssuer(id);
        }
    }
  }

  function deletingPendingIssuer(uint256 id) internal
  {
    uint pos = _pendingIssuers[id]._pendingId;
    UintLibrary.UintArrayRemoveResize(pos, _listOfPendingIssuers);
    if(_listOfPendingIssuers.length > pos) _pendingIssuers[_listOfPendingIssuers[pos]]._pendingId = pos;

    delete(_pendingIssuers[id]._issuer);
    delete(_pendingIssuers[id]._validations);
    delete(_pendingIssuers[id]._rejections);
    delete(_pendingIssuers[id]._voters);
  }

  function GenerateNewNFTMarket(address owner, string memory name, string memory symbol, Library.PaymentPlans paymentPlan) internal returns(address)
  {
    return address(0);
  }

  function retrieveIssuers() external override view returns (uint[] memory)
  {
    return _listOfIssuers;
  }

  function retrieveNFTMarketForIssuer(uint id) external override view returns (address)
  {
    return _issuers[id];
  }

  function retrievePendingIssuers() external override view returns (uint[] memory)
  {
    return _listOfPendingIssuers;
  }

  function retrievePendingIssuer(uint id) external override view returns (ItemsLibrary._pendingIssuerStruct memory)
  {
    return _pendingIssuers[id];
  }



 }