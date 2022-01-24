// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.7;

/**
 Certis Token is an ERC20 Token that grants its holder the right to:
   - Vote on all the systems propositions (changing system configuraiton etc...)
   - Receive Dividends for all the payments forwarded to the Treasury contract

Before every token transfer we contact the token gouvernance Base contracts so that the can update the tokens used for voting if needed

 */

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../Base/ManagedBaseContract.sol";
import "../Libraries/Library.sol";
import "../Libraries/ItemsLibrary.sol";
import "../Interfaces/ITreasury.sol";
import "../Interfaces/INFTMarket.sol";


 contract NFTMarket is  INFTMarket, Initializable, ManagedBaseContract, ERC721Upgradeable {
    using Library for *;

  // EVENTS /////////////////////////////////////////
  

  // DATA /////////////////////////////////////////
  address _owner;
  Library.PaymentPlans _paymentPlan;
  uint256 _offersLifeTime;
  uint256 _ownerTransferFeeAmount;
  uint256 _ownerTransferFeeDecimals;

  mapping(uint256 => ItemsLibrary._tokenStruct) private _tokenInfo;
  mapping(uint256 => ItemsLibrary._offerStruct) private _tokenOffer;

  mapping(address => ItemsLibrary._BalanceStruct) private _balanceOfAccount;
  mapping(address => uint256) private _balanceOfAccountLocked;



  // MODIFIERS /////////////////////////////////////////
  modifier isTheOwner(address addr){
      require(_owner == addr, "Only the Owner is allowed to do that");
      _;
  }

  modifier isTokenOwnerOrApproved(uint256 tokenId){
      require(_isApprovedOrOwner(_msgSender(), tokenId), "Only owner or approved can change token price");
      _;
  }

  modifier OfferInProgress(uint256 tokenId, bool YesOrNo){
      if(YesOrNo) require(now <= _tokenOffer[tokenId].deadline, "There is no offer in progress");
      else require(now > _tokenOffer[tokenId].deadline, "There is an offer in progress");
      _;
  }

  modifier priceOK(uint256 tokenId, uint256 offer){
      require(offer >= _tokenInfo[tokenId]._price, "The offer is below the minimum price");
      _;
  }

  modifier validFees(uint256 fee, uint256 decimals){
    Library.validFees(fee, decimals);
    _;
  }

  

  // CONSTRUCTOR /////////////////////////////////////////
  function NFTMarket_init(address managerContractAddress, address owner, string memory name, string memory symbol, uint256 offersLifeTime, uint256 ownerTransferFeeAmount, uint256 ownerTransferFeeDecimals, uint8 paymentPlan) public initializer 
    validFees(ownerTransferFeeAmount, ownerTransferFeeDecimals)
  {
      super.ManagedBaseContract_init(managerContractAddress); 
      super.__ERC721_init(name, symbol); 

      _owner = owner;
      _paymentPlan = Library.PaymentPlans(paymentPlan);
      _offersLifeTime = offersLifeTime;
      _ownerTransferFeeAmount = ownerTransferFeeAmount;
      _ownerTransferFeeDecimals = ownerTransferFeeDecimals;
  }

  // FUNCTIONALITY /////////////////////////////////////////
  function changeOwner(address newOwner) external override
    isTheOwner(msg.sender)
  {
      _owner = newOwner;
  }

  function changePaymentPlan(Library.PaymentPlans newPaymentPlan) external override
    isTheOwner(msg.sender)
  {
      _paymentPlan = newPaymentPlan;
  }

  function changeOffersLifeTime(uint256 newLifeTime) external override
    isTheOwner(msg.sender)
  {
      _offersLifeTime = newLifeTime;
  }

  function changeOwnerTransferFees(uint256 newAmount, uint256 newDecimals) external override
    isTheOwner(msg.sender)
    validFees(newAmount, newDecimals)
  {
      _ownerTransferFeeAmount = newAmount;
      _ownerTransferFeeDecimals = newDecimals;
  }



  function mintToken(uint256 tokenId, address receiver, uint256 price) external override
    isTheOwner(msg.sender)
  {
      if(_paymentPlan == Library.PaymentPlans.Minting)
      {
        ITreasury(_managerContract.retrieveTransparentProxies()[uint256(Library.TransparentProxies.Treasury)]).pay{value:msg.value}(Library.Prices.MintingFee);
      }
      _safeMint(receiver, tokenId);
      _tokenInfo[tokenId]._price = price;
      _tokenInfo[tokenId]._paymentPlan = _paymentPlan;
  }

  function setTokenPrice(uint256 tokenId, uint256 price) external override
    isTokenOwnerOrApproved(tokenId)
  {
      _tokenInfo._price = price;
  }

  function acceptOffer(uint256 tokenId) external override
    isTokenOwnerOrApproved(tokenId)
    OfferInProgress(tokenId, true)
  {
    uint256 OwnerTransferFeeAmount = _ownerTransferFeeAmount;
    uint256 OwnerTransferFeeDecimals = _ownerTransferFeeDecimals;
    uint256 TransferFeeAmount = 0;
    uint256 TransferFeeDecimals = 0;
    uint256 AdminTransferFeeAmount = 0;
    uint256 AdminTransferFeeDecimals = 0;

    if(Library.PaymentPlans.TransferFee == _tokenInfo[tokenId]._paymentPlan){
        (,, TransferFeeAmount, TransferFeeDecimals, AdminTransferFeeAmount, AdminTransferFeeDecimals,) = ITreasury(_managerContract.retrieveTransparentProxies()[uint256(Library.TransparentProxies.Treasury)]).retrieveSettings();
    }

    uint256 commonDecimals = getLargest([OwnerTransferFeeDecimals, TransferFeeDecimals, AdminTransferFeeDecimals]); 
    OwnerTransferFeeAmount = OwnerTransferFeeAmount * 10**(commonDecimals - OwnerTransferFeeDecimals);
    TransferFeeAmount = TransferFeeAmount * 10**(commonDecimals - TransferFeeDecimals);
    AdminTransferFeeAmount = AdminTransferFeeAmount * 10**(commonDecimals - AdminTransferFeeDecimals);
    uint256 percentageForTokenOwner = (100 * 10**commonDecimals) - OwnerTransferFeeAmount - TransferFeeAmount - AdminTransferFeeAmount;

    require(percentageForTokenOwner >= 0, "Fees exceed 100 percent");

    _balanceOfAccountLocked[_tokenOffer[tokenId]._sender] -= _tokenOffer[tokenId]._offer;

    _safeTransfer(_owners[tokenId], bidder, tokenId, "");
    address sender = _tokenOffer[tokenId]._sender;
    uint256 offer = _tokenOffer[tokenId]._offer;
    removeOffer(tokenId);

    Pay(address(0), offer, TransferFeeAmount, commonDecimals);
    Pay( _managerContract.retrieveTransparentProxies()[uint256(Library.TransparentProxies.AdminPiggyBank)], offer, AdminTransferFeeAmount, commonDecimals);
    Pay(_owner, offer, OwnerTransferFeeAmount, commonDecimals);
    Pay(_owners[tokenId], offer, percentageForTokenOwner, commonDecimals);
   
  }
    
  function rejectOffer(uint256 tokenId) external override
    isTokenOwnerOrApproved(tokenId)
    OfferInProgress(tokenId, true)
  {
    assignToRejectedSender(_tokenOffer[tokenId]._sender, _tokenOffer[tokenId]._offer);
    removeOffer(tokenId);
  }

  function removeOffer(uint256 tokenId) internal
  {
    delete(_tokenOffer[tokenId]);
  }

  function submitOffer(uint256 tokenId, address bidder) external payable override
    OfferInProgress(tokenId, false)
    priceOK(tokenId, msg.value)
  {
      if(address(0) != _tokenOffer[tokenId]._sender) assignToRejectedSender(_tokenOffer[tokenId]._sender, _tokenOffer[tokenId]._offer);
      _tokenOffer[tokenId]._offer = msg.value;
      _tokenOffer[tokenId]._sender = msg.sender;
      _tokenOffer[tokenId]._bidder = bidder;
      _tokenOffer[tokenId]._deadline = now + _offersLifeTime;
      _balanceOfAccountLocked[msg.sender] += _offer;
  }
    
  function withdrawOffers(uint256 tokenId) external override
    OfferInProgress(tokenId, false)
  {
    require(msg.sender == _tokenOffer[tokenId]._sender, "Only the original sender can withdraw the bid");
    assignToRejectedSender(_tokenOffer[tokenId]._sender, _tokenOffer[tokenId]._offer);
    removeOffer(tokenId);
    internalWithdraw(msg.sender);
  }

  function withdraw() external override
  {
    internalWithdraw(msg.sender);
  }

  function assignToRejectedSender(address sender, uint256 offer) internal
  {
      _balanceOfAccountLocked[sender] -= _offer;
      ItemsLibrary.addBalance(_balanceOfAccount[sender], offer, 1);
  }

  function Pay(address to, uint256 amount, uint256 percentage, uint256 decimals) internal
  {
      uint256 numerator = amount * percentage;
      uint256 denominator = 100 * 10**decimals;

      uint256 quotient = numerator / denominator;
      uint256 remainder = numerator - (quotient * denominator);

      ItemsLibrary.addBalance(_balanceOfAccount[to], quotient, 1);
      ItemsLibrary.addBalance(_balanceOfAccount[to], remainder, denominator);

      if(to == address(0)){

      }
      else{
        internalWithdraw(to);
      }
  }

  function internalWithdraw(address addr) internal
  {
    uint256 amount = ItemsLibrary.checkFullBalance(_balanceOfAccount[addr]);
    ItemsLibrary.InternalWithdraw(_balanceOfAccount[addr], amount, addr);
  }

  function retrieveIssuer() external override view returns (ItemsLibrary._issuerStruct memory)
  {
    return(ItemsLibrary._issuerStruct(_owner, _name, _symbol, _paymentPlan), _offersLifeTime);
  }

  function retrieveToken(uint256 tokenId) external override view returns (ItemsLibrary._tokenStruct memory, address)
  {
    return(_tokenInfo[tokenId], _owners[tokenId]);
  }

  function retrieveOffer(uint256 tokenId) external override view returns (ItemsLibrary._offerStruct memory)
  {
      return(_tokenOffer[tokenId]);
  }

  function getLargest(uint256[] nums) internal returns(uint256)
  {
    uint256 largest = 0;

    for(uint i=0; i < nums.length; i++)
    {
        if(largest < nums[i])largest = nums[i];
    }

    return largest;
  }

 }