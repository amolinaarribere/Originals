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
import "../Interfaces/IMarketsCredits.sol";
import "../Interfaces/ITreasury.sol";
import "../Base/MultiSigContract.sol";
import "../Libraries/ItemsLibrary.sol";
import "../Libraries/UintLibrary.sol";
import "../Libraries/Library.sol";
import "../Libraries/AddressLibrary.sol";
import "../Base/ManagedBaseContract.sol";
import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import "../Interfaces/IPayments.sol";

 contract PublicPool is  IPool, Initializable, ManagedBaseContract, MultiSigContract {
  using ItemsLibrary for *;
  using UintLibrary for *;
  using Library for *;
  using AddressLibrary for *;


  // EVENTS /////////////////////////////////////////
  event _NewIssuerRequest(uint256 indexed id, address owner, string name, string symbol, uint256 paymentTokenID);
  event _VoteForIssuer(uint256 indexed id, address voter, bool vote);
  event _IssuerValidation(uint256 indexed id, address NFTMarket);
  event _IssuerRejection(uint256 indexed id);

  event _CreditReceived(address indexed receiver, uint256 amount, address indexed sender, uint256 paymentTokenID);
  event _CreditUnAssignedReceived(uint256 indexed NFTMarketId, uint256 indexed tokenID, uint256 amount, uint256 paymentTokenID);
  event _CreditAssigned(uint256 indexed NFTMarketId, uint256 indexed tokenID, address indexed receiver, uint256 amount, uint256 factor, uint256 paymentTokenID);
  event _CreditReused(uint256 indexed NFTMarketId, uint256 indexed tokenID, address indexed creditor, uint256 amount, uint256 paymentTokenID);
  event _CreditSpent(uint256 indexed NFTMarketId, address indexed from, uint256 amount, address indexed to, uint256 paymentTokenID);
  event _CreditWithdrawn(address indexed withdrawer, uint256 amount, uint256 paymentTokenID);
  event _CreditWithdrawnFor(address indexed withdrawer, uint256 amount, address indexed sender, uint256 paymentTokenID);


  // DATA /////////////////////////////////////////
  struct _unassignedCreditStruct{
    uint256 _credit;
    uint256 _paymentTokenID;
  }

  mapping(uint256 => address) private _issuers;
  uint256[] private _listOfIssuers;

  mapping(uint256 => _pendingIssuerStruct) private _pendingIssuers;
  uint256[] private _listOfPendingIssuers;


  // MODIFIERS /////////////////////////////////////////
  modifier IssuerPending(uint256 id){
      require(address(0) != _pendingIssuers[id]._issuer._owner, "This issuer id is not pending");
      _;
  }

  modifier validIssuerRequest(ItemsLibrary._issuerStruct memory requestedIssuer){
    require(address(0) != requestedIssuer._owner, "NFT Market owner cannot be address 0");
    Library.validFees(requestedIssuer._feeAmount, requestedIssuer._feeDecimals);
    require(0 < bytes(requestedIssuer._name).length, "Name is empty");
    require(0 < bytes(requestedIssuer._symbol).length, "Symbol is empty");
     _;
  }

  // CONSTRUCTOR /////////////////////////////////////////
  function PublicPool_init(address[] memory owners, uint256 minOwners, address managerContractAddress) public initializer {
      super.MultiSigContract_init(owners, minOwners); 
      super.ManagedBaseContract_init(managerContractAddress); 
  }

  // FUNCTIONALITY /////////////////////////////////////////
  function requestIssuer(ItemsLibrary._issuerStruct memory requestedIssuer, bool FromCredit, uint256 paymentTokenID) external override
    validIssuerRequest(requestedIssuer)
  {
    (uint256[][] memory Fees, , ) = ITreasury(_managerContract.retrieveTransparentProxies()[uint256(Library.TransparentProxies.Treasury)]).retrieveSettings();
    require(paymentTokenID < Fees.length, "No system prices for this payment ID");

    uint256 NewIssuerFee = Fees[paymentTokenID][uint256(Library.Fees.NewIssuerFee)];
    uint256 AdminNewIssuerFee = Fees[paymentTokenID][uint256(Library.Fees.AdminNewIssuerFee)];

    if(FromCredit){
      IMarketsCredits marketsCredits = IMarketsCredits(_managerContract.retrieveTransparentProxies()[uint256(Library.TransparentProxies.MarketsCredits)]);
      marketsCredits.spendCredit(0, msg.sender, NewIssuerFee, _managerContract.retrieveTransparentProxies()[uint256(Library.TransparentProxies.Treasury)], paymentTokenID);
      marketsCredits.spendCredit(0, msg.sender, AdminNewIssuerFee, _managerContract.retrieveTransparentProxies()[uint256(Library.TransparentProxies.AdminPiggyBank)], paymentTokenID);
    }
    else{
      IPayments payments = IPayments(_managerContract.retrieveTransparentProxies()[uint256(Library.TransparentProxies.Payments)]);
      payments.TransferFrom(msg.sender, _managerContract.retrieveTransparentProxies()[uint256(Library.TransparentProxies.Treasury)], NewIssuerFee, 0, bytes(""), paymentTokenID);
      payments.TransferFrom(msg.sender, _managerContract.retrieveTransparentProxies()[uint256(Library.TransparentProxies.AdminPiggyBank)], AdminNewIssuerFee, 0, bytes(""), paymentTokenID);
    }

    uint256 IssuerID = getIssuerIdFromName(requestedIssuer._name);

    addPendingIssuer(IssuerID, requestedIssuer);

    emit _NewIssuerRequest(IssuerID, requestedIssuer._owner, requestedIssuer._name, requestedIssuer._symbol, paymentTokenID);
  }

  function addPendingIssuer(uint256 IssuerID, ItemsLibrary._issuerStruct memory requestedIssuer) internal
  {

    require(address(0) == _pendingIssuers[IssuerID]._issuer._owner && address(0) == _issuers[IssuerID], "This Issuer Name has already been taken");

    _pendingIssuers[IssuerID]._issuer._owner = requestedIssuer._owner;
    _pendingIssuers[IssuerID]._issuer._name = requestedIssuer._name;
    _pendingIssuers[IssuerID]._issuer._symbol = requestedIssuer._symbol;
    _pendingIssuers[IssuerID]._issuer._feeAmount = requestedIssuer._feeAmount;
    _pendingIssuers[IssuerID]._issuer._feeDecimals = requestedIssuer._feeDecimals;
    _pendingIssuers[IssuerID]._issuer._paymentPlan = requestedIssuer._paymentPlan;
    _pendingIssuers[IssuerID]._pendingId = _listOfPendingIssuers.length;
    _listOfPendingIssuers.push(IssuerID);
  }

  function getIssuerIdFromName(string memory name) internal pure returns(uint256)
  {
    return uint256(keccak256(bytes(name)));
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
    HasNotAlreadyVoted(msg.sender, _pendingIssuers[id]._voters)
    IssuerPending(id)
  {
    emit _VoteForIssuer(id, msg.sender, vote);

    _pendingIssuers[id]._voters.push(msg.sender);
        
    if(vote){
        _pendingIssuers[id]._validations++;

        if(_pendingIssuers[id]._validations >= _minOwners){
            _listOfIssuers.push(id);
            _issuers[id] = GenerateNewNFTMarket(_pendingIssuers[id]._issuer._owner, _pendingIssuers[id]._issuer._name, _pendingIssuers[id]._issuer._symbol, _pendingIssuers[id]._issuer._feeAmount, _pendingIssuers[id]._issuer._feeDecimals, id, _pendingIssuers[id]._issuer._paymentPlan);
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

  function GenerateNewNFTMarket(address owner, string memory name, string memory symbol, uint256 feeAmount, uint256 feeDecimals, uint256 id, Library.PaymentPlans paymentPlan) internal returns(address)
  {
    address beaconAddress = _managerContract.retrieveBeacons()[uint256(Library.Beacons.NFT)];
    ( , , uint256[] memory OffersSettings) = ITreasury(_managerContract.retrieveTransparentProxies()[uint256(Library.TransparentProxies.Treasury)]).retrieveSettings();
    bytes memory data = abi.encodeWithSignature("NFTMarket_init(address,address,string,string,uint256,uint256,uint256,uint256,uint8)", address(_managerContract), owner, name, symbol, OffersSettings[uint256(Library.OffersSettings.OffersLifeTime)], feeAmount, feeDecimals, id, uint8(paymentPlan));

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