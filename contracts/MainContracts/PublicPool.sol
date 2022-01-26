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
import "../Interfaces/ITreasury.sol";
import "../Base/ManagedBaseContract.sol";
import "../Base/MultiSigContract.sol";
import "../Libraries/ItemsLibrary.sol";
import "../Libraries/UintLibrary.sol";
import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";



 contract PublicPool is  Initializable, MultiSigContract, ManagedBaseContract, IPool {
  using ItemsLibrary for *;
  using UintLibrary for *;

  // EVENTS /////////////////////////////////////////
  event _NewIssuerRequest(uint256 indexed id, address owner, string name, string symbol);

  event _VoteForIssuer(uint256 indexed id, address voter, bool vote);
  event _IssuerValidation(uint256 indexed id, address NFTMarket);
  event _IssuerRejection(uint256 indexed id);

  // DATA /////////////////////////////////////////
  mapping(uint256 => address) _issuers;
  uint256[] _listOfIssuers;

  mapping(uint256 => _pendingIssuerStruct) _pendingIssuers;
  uint256[] _listOfPendingIssuers;

  uint256 nextIssuerId;

  // MODIFIERS /////////////////////////////////////////
  modifier validOwner(address owner){
      require(address(0) != owner, "NFT Market owner cannot be address 0");
      _;
  }

  modifier IssuerPending(uint256 id){
      require(address(0) != _pendingIssuers[id]._issuer._owner, "This issuer id is not pending");
      _;
  }

  modifier validFees(uint256 fee, uint256 decimals){
      Library.validFees(fee, decimals);
      _;
  }

  // CONSTRUCTOR /////////////////////////////////////////
  function PublicPool_init(address[] memory owners,  uint256 minOwners, address managerContractAddress) public initializer {
      super.MultiSigContract_init(owners, minOwners); 
      super.ManagedBaseContract_init(managerContractAddress); 

      nextIssuerId = 0;
  }

  // FUNCTIONALITY /////////////////////////////////////////
  function requestIssuer(address owner, string memory name, string memory symbol, uint256 feeAmount, uint256 feeDecimals, Library.PaymentPlans paymentPlan) external override payable
    validOwner(owner)
    validFees(feeAmount, feeDecimals)
  returns (uint256)
  {

    uint[] memory Prices = ITreasury(_managerContract.retrieveTransparentProxies()[uint256(Library.TransparentProxies.Treasury)]).retrieveSettings();
    uint256 NewIssuerFee = Prices[uint256(Library.Prices.NewIssuerFee)];
    uint256 AdminNewIssuerFee = Prices[uint256(Library.Prices.AdminNewIssuerFee)];
    require(msg.value >= NewIssuerFee + AdminNewIssuerFee, "New Issuer Fees not enough");

    ItemsLibrary.TransferEtherTo(NewIssuerFee, _managerContract.retrieveTransparentProxies()[uint256(Library.TransparentProxies.Treasury)]);
    ItemsLibrary.TransferEtherTo(msg.value - NewIssuerFee, _managerContract.retrieveTransparentProxies()[uint256(Library.TransparentProxies.AdminPiggyBank)]);

    _pendingIssuers[nextIssuerId]._issuer._owner = owner;
    _pendingIssuers[nextIssuerId]._issuer._name = name;
    _pendingIssuers[nextIssuerId]._issuer._symbol = symbol;
    _pendingIssuers[nextIssuerId]._issuer._feeAmount = feeAmount;
    _pendingIssuers[nextIssuerId]._issuer._feeDecimals = feeDecimals;
    _pendingIssuers[nextIssuerId]._issuer._paymentPlan = paymentPlan;
    _pendingIssuers[nextIssuerId]._pendingId = _listOfPendingIssuers.length;
    _listOfPendingIssuers.push(nextIssuerId);

    emit _NewIssuerRequest(nextIssuerId, owner, name, symbol);

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
            _issuers[id] = GenerateNewNFTMarket(_pendingIssuers[id]._issuer._owner, _pendingIssuers[id]._issuer._name, _pendingIssuers[id]._issuer._symbol, _pendingIssuers[id]._issuer._feeAmount, _pendingIssuers[id]._issuer._feeDecimals, _pendingIssuers[id]._issuer._paymentPlan);
            deletingPendingIssuer(id);
            emit _IssuerValidation(id, _issuers[id]);
        }
    }
    else{
        _pendingIssuers[id]._rejections++;

        if(_pendingIssuers[id]._rejections >= _minOwners){
            deletingPendingIssuer(id);
            emit _IssuerRejection(id);
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

  function GenerateNewNFTMarket(address owner, string memory name, string memory symbol, uint256 feeAmount, uint256 feeDecimals, Library.PaymentPlans paymentPlan) internal returns(address)
  {
    address beaconAddress = _managerContract.retrieveBeacons()[uint256(Library.Beacons.NFT)];
    uint256 OffersLifeTime = ITreasury(_managerContract.retrieveTransparentProxies()[uint256(Library.TransparentProxies.Treasury)]).retrieveSettings()[uint256(Library.Prices.OffersLifeTime)];
    bytes memory data = abi.encodeWithSignature("NFTMarket_init(address,address,string,string,uint256,uint256,uint256,uint8)", address(_managerContract), owner, name, symbol, OffersLifeTime, feeAmount, feeDecimals, uint8(paymentPlan));

    BeaconProxy beaconProxy = new BeaconProxy(beaconAddress, data);

    return address(beaconProxy);
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

  function retrievePendingIssuer(uint id) external override view returns (_pendingIssuerStruct memory)
  {
    return _pendingIssuers[id];
  }



 }