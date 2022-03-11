// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.7;

/**
 Certis Token is an ERC20 Token that grants its holder the right to:
   - Vote on all the systems propositions (changing system configuraiton etc...)
   - Receive Dividends for all the payments forwarded to the Treasury contract

Before every token transfer we contact the token gouvernance Base contracts so that the can update the tokens used for voting if needed

 */

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../Interfaces/IMarketsCredits.sol";
import "../Interfaces/IPool.sol";
import "../Libraries/ItemsLibrary.sol";
import "../Libraries/UintLibrary.sol";
import "../Libraries/Library.sol";
import "../Libraries/AddressLibrary.sol";
import "../Base/CreditorBaseContract.sol";
import "../Interfaces/IPayments.sol";

 contract MarketsCredits is  IMarketsCredits, Initializable, CreditorBaseContract {
  using ItemsLibrary for *;
  using UintLibrary for *;
  using Library for *;
  using AddressLibrary for *;


  // EVENTS /////////////////////////////////////////
  event _CreditReceived(address indexed receiver, uint256 amount, address indexed sender, uint256 paymentTokenID);
  event _CreditUnAssignedReceived(uint256 indexed NFTMarketId, uint256 indexed tokenID, uint256 amount, uint256 paymentTokenID);
  event _CreditAssigned(uint256 indexed NFTMarketId, uint256 indexed tokenID, address indexed receiver, uint256 amount, uint256 factor, uint256 paymentTokenID);
  event _CreditReused(uint256 indexed NFTMarketId, uint256 indexed tokenID, address indexed creditor, uint256 amount, uint256 paymentTokenID);
  event _CreditSpent(uint256 indexed NFTMarketId, address indexed from, uint256 amount, address indexed to, uint256 paymentTokenID);
  event _CreditWithdrawn(address indexed withdrawer, uint256 amount, uint256 paymentTokenID);
  event _CreditWithdrawnFor(address indexed withdrawer, uint256 amount, address indexed sender, uint256 paymentTokenID);


 

  mapping(uint256 => mapping(address => ItemsLibrary._BalanceStruct)) private _creditOfAccount;
  mapping(uint256 => mapping(uint256 => _unassignedCreditStruct)) private _unassignedCreditForMarket;


  // MODIFIERS /////////////////////////////////////////
  modifier isNFTMarket(uint256 MarketId, address MarketAddress){
      isNFTMarketorPublicFunc(MarketId, MarketAddress, false);
      _;
  }

  modifier isNFTMarketorPublicPool(uint256 MarketId, address MarketAddress){
      isNFTMarketorPublicFunc(MarketId, MarketAddress, true);
      _;
  }

  function isNFTMarketorPublicFunc(uint256 MarketId, address Addr, bool PublicPool) internal view{
    IPool publicPool = IPool(_managerContract.retrieveTransparentProxies()[uint256(Library.TransparentProxies.PublicPool)]);
    if(PublicPool) require(Addr == publicPool.retrieveNFTMarketForIssuer(MarketId) ||
                           Addr == address(publicPool) , "The Market Id and Address do not correspond");
    else require(Addr == publicPool.retrieveNFTMarketForIssuer(MarketId), "The Market Id and Address do not correspond");
  }

  modifier isTokenUnassignedCreditEmpty(uint256 NFTMarketId, uint256 tokenID){
    require(false == _unassignedCreditForMarket[NFTMarketId][tokenID]._inProgress, "Unassigned credit for this token is not empty");
    _;
  }

  modifier checkTotal(uint256 total, uint256[] memory amounts, uint256[] memory factors){
    checkTotalFunc(total, amounts, factors);
    _;
  }

  function checkTotalFunc(uint256 total, uint256[] memory amounts, uint256[] memory factors) internal{
    require(amounts.length == factors.length, "Provided arrays do not have the same length");
    uint256 CommonDividend = UintLibrary.ProductOfFactors(factors);
    uint256 calculatedTotal = 0;
    for(uint256 i=0; i < factors.length; i++){
        calculatedTotal += amounts[i] * CommonDividend / factors[i];
    }
    require((total * CommonDividend) == calculatedTotal, "the total amount is not equal to the calculated one");
  }

  modifier isPaymentTokenOK(uint256 paymentTokenID, bool checkActive){
    isPaymentTokenOKFunc(paymentTokenID, checkActive);
    _;
  }

  function isPaymentTokenOKFunc(uint256 paymentTokenID, bool checkActive) internal view{
    IPayments payments = IPayments(_managerContract.retrieveTransparentProxies()[uint256(Library.TransparentProxies.Payments)]);
    Library.PaymentTokenStruct[] memory paymentTokens = payments.retrieveSettings();
    require(paymentTokenID < paymentTokens.length, "This payment token is not valid");
    require(address(0) != address(paymentTokens[paymentTokenID].TokenContract), "This payment token has address 0");
    if(checkActive) require(true == paymentTokens[paymentTokenID].active, "This payment token is not enabled");
  }

  // CONSTRUCTOR /////////////////////////////////////////
  function MarketsCredits_init(address managerContractAddress) public initializer {
      super.CreditorBaseContract_init(managerContractAddress); 
  }

  // FUNCTIONALITY /////////////////////////////////////////
  function onCreditReceived(address sender, uint256 amount, uint256 paymentTokenID, bytes memory data) internal override
  {
    bytes32[] memory receivedData = Library.BytestoBytes32(data);
    Library.MarketsCreditsPaymentTypes paymentType = Library.MarketsCreditsPaymentTypes(uint256(receivedData[0]));

    if(Library.MarketsCreditsPaymentTypes.SendCredit == paymentType){
      address account = AddressLibrary.Bytes32ToAddress(receivedData[1]);
      ItemsLibrary.addBalance(_creditOfAccount[paymentTokenID][account], amount, 1);
      emit _CreditReceived(account, amount, sender, paymentTokenID);
    }

    else{
      uint256 NFTMarketId = UintLibrary.Bytes32ToUint(receivedData[1]);
      uint256 tokenID = UintLibrary.Bytes32ToUint(receivedData[2]);
      internalTransferUnassignedCredit(NFTMarketId, tokenID, amount, paymentTokenID);
      emit _CreditUnAssignedReceived(NFTMarketId, tokenID, amount, paymentTokenID);
    }
     
  }
  
  function sendCredit(address addr, uint256 amount, uint256 paymentTokenID) external override
  {
    bytes32[] memory dataArray = new bytes32[](3);
    dataArray[0] = UintLibrary.UintToBytes32(uint256(Library.MarketsCreditsPaymentTypes.SendCredit));
    dataArray[1] = AddressLibrary.AddressToBytes32(addr);
    bytes memory data = Library.Bytes32ArrayToBytes(dataArray);

    IPayments payments = IPayments(_managerContract.retrieveTransparentProxies()[uint256(Library.TransparentProxies.Payments)]);
    payments.TransferFrom(msg.sender, address(this), amount, 0, data, paymentTokenID);
  }

  function assignCredit(uint256 NFTMarketId, uint256 tokenID, address[] calldata addrs, uint256[] calldata amounts, uint256[] calldata factors) external override
    checkTotal(_unassignedCreditForMarket[NFTMarketId][tokenID]._credit, amounts, factors)
    isNFTMarket(NFTMarketId, msg.sender)
  {
    require(addrs.length == factors.length, "Provided arrays do not have the same length");
    assignCreditInternal(NFTMarketId, tokenID, addrs, amounts, factors);
    delete(_unassignedCreditForMarket[NFTMarketId][tokenID]);
  }

  function assignCreditInternal(uint256 NFTMarketId, uint256 tokenID, address[] calldata addrs, uint256[] calldata amounts, uint256[] calldata factors) internal 
  {
    uint256 paymentTokenID = _unassignedCreditForMarket[NFTMarketId][tokenID]._paymentTokenID;
    for(uint i=0; i < addrs.length; i++){
      ItemsLibrary.addBalance(_creditOfAccount[paymentTokenID][addrs[i]], amounts[i], factors[i]);
      emit _CreditAssigned(NFTMarketId, tokenID, addrs[i], amounts[i], factors[i], paymentTokenID);
    }
  }

  function reuseCredit(uint256 NFTMarketId, uint256 tokenID, address addr, uint256 amount, uint256 paymentTokenID) external override
    isTokenUnassignedCreditEmpty(NFTMarketId, tokenID)
    isPaymentTokenOK(paymentTokenID, true)
    isNFTMarket(NFTMarketId, msg.sender)
  {
    internalWithdraw(address(0), amount, addr, false, bytes(""), paymentTokenID, false);
    internalTransferUnassignedCredit(NFTMarketId, tokenID, amount, paymentTokenID);
    emit _CreditReused(NFTMarketId, tokenID, addr, amount, paymentTokenID);
  }

  function spendCredit(uint256 NFTMarketId, address from, uint256 amount, address to, uint256 paymentTokenID) external override
    isPaymentTokenOK(paymentTokenID, true)
    isNFTMarketorPublicPool(NFTMarketId, msg.sender)
  {
    internalWithdraw(to, amount, from, true, bytes(""), paymentTokenID, true);
    emit _CreditSpent(NFTMarketId, from, amount, to, paymentTokenID);
  }

  function withdraw(uint amount, uint256 paymentTokenID) external override
    isPaymentTokenOK(paymentTokenID, false)
  {
    internalWithdraw(msg.sender, amount, msg.sender, false, bytes(""), paymentTokenID, true);
    emit _CreditWithdrawn(msg.sender, amount, paymentTokenID);
  }
  
  function withdrawAll(uint256 paymentTokenID) external override
    isPaymentTokenOK(paymentTokenID, false)
  {
    uint amount = ItemsLibrary.checkFullBalance(_creditOfAccount[paymentTokenID][msg.sender]);
    internalWithdraw(msg.sender, amount, msg.sender, false, bytes(""), paymentTokenID, true);
    emit _CreditWithdrawn(msg.sender, amount, paymentTokenID);
  }
  
  function withdrawAllFor(uint256 NFTMarketId, address addr, uint256 paymentTokenID, bytes memory data) external override
    isPaymentTokenOK(paymentTokenID, false)
    isNFTMarket(NFTMarketId, msg.sender)
  {
    uint amount = ItemsLibrary.checkFullBalance(_creditOfAccount[paymentTokenID][addr]);
    internalWithdraw(addr, amount, addr, true, data, paymentTokenID, true);
    emit _CreditWithdrawnFor(addr, amount, msg.sender, paymentTokenID);
  }

  function internalTransferUnassignedCredit(uint256 NFTMarketId, uint256 tokenID, uint256 amount, uint256 paymentTokenID) internal
  {
      _unassignedCreditForMarket[NFTMarketId][tokenID]._credit = amount;
      _unassignedCreditForMarket[NFTMarketId][tokenID]._paymentTokenID = paymentTokenID;
      _unassignedCreditForMarket[NFTMarketId][tokenID]._inProgress = true;
  }

  function internalWithdraw(address to, uint amount, address sender, bool sendData, bytes memory data, uint256 paymentTokenID, bool transfer) internal
  {
      ItemsLibrary.InternalWithdraw(
        _creditOfAccount[paymentTokenID][sender], 
        amount, 
        to, 
        transfer, 
        address(IPayments(_managerContract.retrieveTransparentProxies()[uint256(Library.TransparentProxies.Payments)]).retrieveSettings()[paymentTokenID].TokenContract),
        sendData,
        data,
        paymentTokenID
      );
  }

  function retrieveCredit(address addr, uint256 paymentTokenID) external override view returns (uint256)
  {
    return ItemsLibrary.checkFullBalance(_creditOfAccount[paymentTokenID][addr]);
  }

  function retrieveUnAssignedCredit(uint256 NFTMarketId, uint256 tokenID) external override view returns (_unassignedCreditStruct memory){
    return(_unassignedCreditForMarket[NFTMarketId][tokenID]);
  }


 }