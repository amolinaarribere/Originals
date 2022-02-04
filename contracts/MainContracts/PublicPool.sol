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

  event _CreditReceived(address indexed receiver, uint256 amount, address indexed sender);
  event _CreditUnAssignedReceived(uint256 indexed NFTMarketId, uint256 indexed tokenID, uint256 amount);
  event _CreditAssigned(uint256 indexed NFTMarketId, uint256 indexed tokenID, address indexed receiver, uint256 amount, uint256 factor);
  event _CreditReused(uint256 indexed NFTMarketId, uint256 indexed tokenID, address indexed creditor, uint256 amount);
  event _CreditWithdrawn(address indexed withdrawer, uint256 amount);
  event _CreditWithdrawnFor(address indexed withdrawer, uint256 amount, address indexed sender);


  // DATA /////////////////////////////////////////
  mapping(uint256 => address) private _issuers;
  uint256[] private _listOfIssuers;

  mapping(uint256 => _pendingIssuerStruct) private _pendingIssuers;
  uint256[] private _listOfPendingIssuers;

  mapping(address => ItemsLibrary._BalanceStruct) private _creditOfAccount;
  mapping(uint256 => mapping(uint256 => uint256)) private _unassignedCreditForMarket;



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

  modifier isNFTMarket(uint256 MarketId, address MarketAddress){
      isNFTMarketFunc(MarketId, MarketAddress);
      _;
  }

  function isNFTMarketFunc(uint256 MarketId, address MarketAddress) internal view{
    require(MarketAddress == _issuers[MarketId], "The Market Id and Address do not correspond");
  }

  modifier isTokenUnassignedCreditEmpty(uint256 NFTMarketId, uint256 tokenID){
    isTokenUnassignedCreditEmptyFunc(NFTMarketId, tokenID);
    _;
  }

  function isTokenUnassignedCreditEmptyFunc(uint256 NFTMarketId, uint256 tokenID) internal view{
    require(0 == _unassignedCreditForMarket[NFTMarketId][tokenID], "Unassigned credit for this token is not empty");
  }

  modifier checkTotal(uint256 total, uint256[] memory amounts, uint256[] memory factors){
    checkTotalFunc(total, amounts, factors);
    _;
  }

  function checkTotalFunc(uint256 total, uint256[] memory amounts, uint256[] memory factors) internal pure{
    require(amounts.length == factors.length, "Provided arrays do not have the same length");
    uint256 CommonDividend = UintLibrary.ProductOfFactors(factors);
    uint256 calculatedTotal = 0;
    for(uint256 i=0; i < factors.length; i++){
        calculatedTotal += amounts[i] * CommonDividend / factors[i];
    }
    require((total * CommonDividend) == calculatedTotal, "the total amount is not equal to the calculated one");
  }

  // CONSTRUCTOR /////////////////////////////////////////
  function PublicPool_init(address[] memory owners,  uint256 minOwners, address managerContractAddress) public initializer {
      super.MultiSigContract_init(owners, minOwners); 
      super.ManagedBaseContract_init(managerContractAddress); 
  }

  // FUNCTIONALITY /////////////////////////////////////////
  function requestIssuer(address owner, string memory name, string memory symbol, uint256 feeAmount, uint256 feeDecimals, Library.PaymentPlans paymentPlan) external override payable
    validOwner(owner)
    validFees(feeAmount, feeDecimals)
  {

    uint[] memory Prices = ITreasury(_managerContract.retrieveTransparentProxies()[uint256(Library.TransparentProxies.Treasury)]).retrieveSettings();
    uint256 NewIssuerFee = Prices[uint256(Library.Prices.NewIssuerFee)];
    uint256 AdminNewIssuerFee = Prices[uint256(Library.Prices.AdminNewIssuerFee)];
    require(msg.value >= NewIssuerFee + AdminNewIssuerFee, "New Issuer Fees not enough");

    ItemsLibrary.TransferEtherTo(NewIssuerFee, _managerContract.retrieveTransparentProxies()[uint256(Library.TransparentProxies.Treasury)]);
    ItemsLibrary.TransferEtherTo(msg.value - NewIssuerFee, _managerContract.retrieveTransparentProxies()[uint256(Library.TransparentProxies.AdminPiggyBank)]);

    uint256 IssuerID = getIssuerIdFromName(name);
    require(address(0) == _pendingIssuers[IssuerID]._issuer._owner && address(0) == _issuers[IssuerID], "This Issuer Name has already been taken");

    _pendingIssuers[IssuerID]._issuer._owner = owner;
    _pendingIssuers[IssuerID]._issuer._name = name;
    _pendingIssuers[IssuerID]._issuer._symbol = symbol;
    _pendingIssuers[IssuerID]._issuer._feeAmount = feeAmount;
    _pendingIssuers[IssuerID]._issuer._feeDecimals = feeDecimals;
    _pendingIssuers[IssuerID]._issuer._paymentPlan = paymentPlan;
    _pendingIssuers[IssuerID]._pendingId = _listOfPendingIssuers.length;
    _listOfPendingIssuers.push(IssuerID);

    emit _NewIssuerRequest(IssuerID, owner, name, symbol);
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
    uint256 OffersLifeTime = ITreasury(_managerContract.retrieveTransparentProxies()[uint256(Library.TransparentProxies.Treasury)]).retrieveSettings()[uint256(Library.Prices.OffersLifeTime)];
    bytes memory data = abi.encodeWithSignature("NFTMarket_init(address,address,string,string,uint256,uint256,uint256,uint256,uint8)", address(_managerContract), owner, name, symbol, OffersLifeTime, feeAmount, feeDecimals, id, uint8(paymentPlan));

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

  // Credit Functionality

  function sendCredit(address addr) external override payable
  {
    ItemsLibrary.addBalance(_creditOfAccount[addr], msg.value, 1);
    emit _CreditReceived(addr, msg.value, msg.sender);
  }

  function transferUnassignedCredit(uint256 NFTMarketId, uint256 tokenID) external override payable
    isNFTMarket(NFTMarketId, msg.sender)
    isTokenUnassignedCreditEmpty(NFTMarketId, tokenID)
  {
    internalTransferUnassignedCredit(NFTMarketId, tokenID, msg.value);
    emit _CreditUnAssignedReceived(NFTMarketId, tokenID, msg.value);
  }

  function addCredit(uint256 NFTMarketId, uint256 tokenID, address[] calldata addrs, uint256[] calldata amounts, uint256[] calldata factors) external override
    isNFTMarket(NFTMarketId, msg.sender)
    checkTotal(_unassignedCreditForMarket[NFTMarketId][tokenID], amounts, factors)
  {
    require(addrs.length == factors.length, "Provided arrays do not have the same length");
    for(uint i=0; i < addrs.length; i++){
      ItemsLibrary.addBalance(_creditOfAccount[addrs[i]], amounts[i], factors[i]);
      emit _CreditAssigned(NFTMarketId, tokenID, addrs[i], amounts[i], factors[i]);
    }
    delete(_unassignedCreditForMarket[NFTMarketId][tokenID]);
  }

  function reuseCredit(uint256 NFTMarketId, uint256 tokenID, address addr, uint256 amount) external override
    isNFTMarket(NFTMarketId, msg.sender)
    isTokenUnassignedCreditEmpty(NFTMarketId, tokenID)
  {
    ItemsLibrary.InternalWithdraw(_creditOfAccount[addr], amount, address(0), false);
    internalTransferUnassignedCredit(NFTMarketId, tokenID, amount);
    emit _CreditReused(NFTMarketId, tokenID, addr, amount);
  }

  function withdraw(uint amount) external override
  {
    internalWithdraw(msg.sender, amount, address(0));
  }
  
  function withdrawAll() external override
  {
    uint amount = ItemsLibrary.checkFullBalance(_creditOfAccount[msg.sender]);
    internalWithdraw(msg.sender, amount, address(0));
  }
  
  function withdrawAllFor(uint256 NFTMarketId, address addr) external override
    isNFTMarket(NFTMarketId, msg.sender)
  {
    uint amount = ItemsLibrary.checkFullBalance(_creditOfAccount[addr]);
    internalWithdraw(addr, amount, msg.sender);
  }

  function internalTransferUnassignedCredit(uint256 NFTMarketId, uint256 tokenID, uint256 amount) internal
  {
      _unassignedCreditForMarket[NFTMarketId][tokenID] = amount;
  }

  function internalWithdraw(address addr, uint amount, address sender) internal
  {
    ItemsLibrary.InternalWithdraw(_creditOfAccount[addr], amount, addr, true);
    if(address(0) != sender) emit _CreditWithdrawnFor(addr, amount, sender);
    else emit _CreditWithdrawn(addr, amount);
  }

  function retrieveCredit(address addr) external override view returns (uint256)
  {
    return ItemsLibrary.checkFullBalance(_creditOfAccount[addr]);
  }



 }