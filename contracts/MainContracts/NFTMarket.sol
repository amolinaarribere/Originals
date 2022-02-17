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
import "../Libraries/UintLibrary.sol";
import "../Libraries/ItemsLibrary.sol";
import "../Interfaces/ITreasury.sol";
import "../Interfaces/IPool.sol";
import "../Interfaces/INFTMarket.sol";
import "../Interfaces/IPayments.sol";

 contract NFTMarket is  INFTMarket, Initializable, ManagedBaseContract, ERC721Upgradeable {
    using Library for *;
    using UintLibrary for *;
    using ItemsLibrary for *;


  // EVENTS /////////////////////////////////////////
  event _NewOwner(address indexed formerOwner, address newOwner);
  event _NewPaymentPlan(Library.PaymentPlans formerPlan, Library.PaymentPlans newPlan);
  event _NewOffersLifeTime(uint256 indexed formerLifeTime, uint256 newLifeTime);
  event _NewOwnerFees(uint256 indexed formerAmount, uint256 indexed formerDecimals, uint256 newAmount, uint256 newDecimals);

  event _MintToken(uint256 indexed tokenId, address receiver, uint256 price, Library.PaymentPlans plan, uint256 MintingFee, uint256 AdminMintingFee);
  event _SetTokenPrice(uint256 indexed tokenId, uint256 indexed formerPrice, uint256 newPrice);
  event _SubmitOffer(uint256 indexed tokenId, address indexed sender, address indexed bidder, uint256 offer, bool FromCredit);
  event _AcceptOffer(uint256 indexed tokenId, address indexed formerOwner, address indexed newOwner, uint256 offer);
  event _RejectOffer(uint256 indexed tokenId);
  event _WithdrawOffer(uint256 indexed tokenId);
  

  // DATA /////////////////////////////////////////
  address _owner;
  Library.PaymentPlans _paymentPlan;
  uint256 _offersLifeTime;
  uint256 _ownerTransferFeeAmount;
  uint256 _ownerTransferFeeDecimals;
  uint256 _issuerID;

  mapping(uint256 => _tokenStruct) private _tokenInfo;
  mapping(uint256 => _offerStruct) private _tokenOffer;


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
      if(YesOrNo) require(block.timestamp <= _tokenOffer[tokenId]._deadline, "There is no offer in progress");
      else require(block.timestamp > _tokenOffer[tokenId]._deadline, "There is an offer in progress");
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
  function NFTMarket_init(address managerContractAddress, address owner, string memory name, string memory symbol, uint256 offersLifeTime, uint256 ownerTransferFeeAmount, uint256 ownerTransferFeeDecimals, uint256 issuerID, uint8 paymentPlan) public initializer 
    validFees(ownerTransferFeeAmount, ownerTransferFeeDecimals)
  {
      super.ManagedBaseContract_init(managerContractAddress); 
      super.__ERC721_init(name, symbol); 

      _owner = owner;
      _paymentPlan = Library.PaymentPlans(paymentPlan);
      _offersLifeTime = offersLifeTime;
      _ownerTransferFeeAmount = ownerTransferFeeAmount;
      _ownerTransferFeeDecimals = ownerTransferFeeDecimals;
      _issuerID = issuerID;
  }

  // FUNCTIONALITY /////////////////////////////////////////
  function changeOwner(address newOwner) external override
    isTheOwner(msg.sender)
  {
      emit _NewOwner(_owner, newOwner);
      _owner = newOwner;
  }

  function changePaymentPlan(Library.PaymentPlans newPaymentPlan) external override
    isTheOwner(msg.sender)
  {
      emit _NewPaymentPlan(_paymentPlan, newPaymentPlan);
      _paymentPlan = newPaymentPlan;
  }

  function changeOffersLifeTime(uint256 newLifeTime) external override
    isTheOwner(msg.sender)
  {
      emit _NewOffersLifeTime(_offersLifeTime, newLifeTime);
      _offersLifeTime = newLifeTime;
  }

  function changeOwnerTransferFees(uint256 newAmount, uint256 newDecimals) external override
    isTheOwner(msg.sender)
    validFees(newAmount, newDecimals)
  {
      emit _NewOwnerFees(_ownerTransferFeeAmount, _ownerTransferFeeDecimals, newAmount, newDecimals);
      _ownerTransferFeeAmount = newAmount;
      _ownerTransferFeeDecimals = newDecimals;
  }

  function mintToken(uint256 tokenId, address receiver, uint256 price) external override
    isTheOwner(msg.sender)
  {
      uint256 MintingFee = 0;
      uint256 AdminMintingFee = 0;

      if(_paymentPlan == Library.PaymentPlans.Minting)
      {
        uint[] memory Prices = ITreasury(_managerContract.retrieveTransparentProxies()[uint256(Library.TransparentProxies.Treasury)]).retrieveSettings();
        MintingFee = Prices[uint256(Library.Prices.MintingFee)];
        AdminMintingFee = Prices[uint256(Library.Prices.AdminMintingFee)];

        IPayments payments = IPayments(_managerContract.retrieveTransparentProxies()[uint256(Library.TransparentProxies.Payments)]);
        payments.TransferFrom(msg.sender, _managerContract.retrieveTransparentProxies()[uint256(Library.TransparentProxies.Treasury)], MintingFee, _issuerID, bytes(""));
        payments.TransferFrom(msg.sender, _managerContract.retrieveTransparentProxies()[uint256(Library.TransparentProxies.AdminPiggyBank)], AdminMintingFee, _issuerID, bytes(""));
      }
      _safeMint(receiver, tokenId);
      _tokenInfo[tokenId]._price = price;
      _tokenInfo[tokenId]._paymentPlan = _paymentPlan;

      emit _MintToken(tokenId, receiver, price, _paymentPlan, MintingFee, AdminMintingFee);
  }

  function setTokenPrice(uint256 tokenId, uint256 price) external override
    isTokenOwnerOrApproved(tokenId)
  {
      emit _SetTokenPrice(tokenId, _tokenInfo[tokenId]._price, price);
      _tokenInfo[tokenId]._price = price;
  }

  function acceptOffer(uint256 tokenId) external override
    isTokenOwnerOrApproved(tokenId)
    OfferInProgress(tokenId, true)
  {
    emit _AcceptOffer(tokenId, ownerOf(tokenId),  _tokenOffer[tokenId]._bidder,  _tokenOffer[tokenId]._offer);

    (uint256 OwnerTransferFeeAmount, uint256 TransferFeeAmount, uint256 AdminTransferFeeAmount, uint256 commonDecimals) = getFees(tokenId);

    uint256 TotalFees = OwnerTransferFeeAmount + TransferFeeAmount + AdminTransferFeeAmount;
    Library.validFees(TotalFees, commonDecimals);

    uint256 percentageForTokenOwner = 10**(commonDecimals + 2) - TotalFees;

    _safeTransfer(ownerOf(tokenId), _tokenOffer[tokenId]._bidder, tokenId, "");

    AllocatePercents(tokenId,
      [_managerContract.retrieveTransparentProxies()[uint256(Library.TransparentProxies.Treasury)], _managerContract.retrieveTransparentProxies()[uint256(Library.TransparentProxies.AdminPiggyBank)], _owner, ownerOf(tokenId)],
      [TransferFeeAmount, AdminTransferFeeAmount, OwnerTransferFeeAmount, percentageForTokenOwner],
      _tokenOffer[tokenId]._offer,
      commonDecimals);

    removeOffer(tokenId);

    IPool(_managerContract.retrieveTransparentProxies()[uint256(Library.TransparentProxies.PublicPool)]).withdrawAllFor(_issuerID,
      _managerContract.retrieveTransparentProxies()[uint256(Library.TransparentProxies.Treasury)],
      bytes(""));
    IPool(_managerContract.retrieveTransparentProxies()[uint256(Library.TransparentProxies.PublicPool)]).withdrawAllFor(_issuerID,
      _managerContract.retrieveTransparentProxies()[uint256(Library.TransparentProxies.AdminPiggyBank)],
      bytes(""));
  }

  function getFees(uint256 tokenId) internal view returns(uint256, uint256, uint256, uint256)
  {
    uint256 OwnerTransferFeeAmount = _ownerTransferFeeAmount;
    uint256 OwnerTransferFeeDecimals = _ownerTransferFeeDecimals;
    uint256 TransferFeeAmount = 0;
    uint256 TransferFeeDecimals = 0;
    uint256 AdminTransferFeeAmount = 0;
    uint256 AdminTransferFeeDecimals = 0;

    if(Library.PaymentPlans.TransferFee == _tokenInfo[tokenId]._paymentPlan){
        uint[] memory Prices = ITreasury(_managerContract.retrieveTransparentProxies()[uint256(Library.TransparentProxies.Treasury)]).retrieveSettings();
        TransferFeeAmount = Prices[uint256(Library.Prices.TransferFeeAmount)];
        TransferFeeDecimals = Prices[uint256(Library.Prices.TransferFeeDecimals)];
        AdminTransferFeeAmount = Prices[uint256(Library.Prices.AdminTransferFeeAmount)];
        AdminTransferFeeDecimals = Prices[uint256(Library.Prices.AdminTransferFeeDecimals)];
    }

    uint256 commonDecimals = getLargest([OwnerTransferFeeDecimals, TransferFeeDecimals, AdminTransferFeeDecimals]); 
    OwnerTransferFeeAmount = OwnerTransferFeeAmount * 10**(commonDecimals - OwnerTransferFeeDecimals);
    TransferFeeAmount = TransferFeeAmount * 10**(commonDecimals - TransferFeeDecimals);
    AdminTransferFeeAmount = AdminTransferFeeAmount * 10**(commonDecimals - AdminTransferFeeDecimals);

    return(OwnerTransferFeeAmount, TransferFeeAmount, AdminTransferFeeAmount, commonDecimals);
  }
    
  function rejectOffer(uint256 tokenId) external override
    isTokenOwnerOrApproved(tokenId)
    OfferInProgress(tokenId, true)
  {
    assignToRejectedSender(tokenId);
    removeOffer(tokenId);
    emit _RejectOffer(tokenId);
  }

  function removeOffer(uint256 tokenId) internal
  {
    delete(_tokenOffer[tokenId]);
  }

  function submitOffer(uint256 tokenId, address bidder, uint256 offer, bool FromCredit) external override
    OfferInProgress(tokenId, false)
    priceOK(tokenId, offer)
  {
    if(address(0) != _tokenOffer[tokenId]._sender) assignToRejectedSender(tokenId);

    if(FromCredit)
      IPool(_managerContract.retrieveTransparentProxies()[uint256(Library.TransparentProxies.PublicPool)]).reuseCredit(_issuerID, tokenId,  msg.sender, offer);
    
    else{
      bytes32[] memory dataArray = new bytes32[](3);
      dataArray[0] = UintLibrary.UintToBytes32(uint256(Library.PublicPoolPaymentTypes.TransferUnassignedCredit));
      dataArray[1] = UintLibrary.UintToBytes32(_issuerID);
      dataArray[2] = UintLibrary.UintToBytes32(tokenId);
      bytes memory data = Library.Bytes32ArrayToBytes(dataArray);

      IPayments payments = IPayments(_managerContract.retrieveTransparentProxies()[uint256(Library.TransparentProxies.Payments)]);
      payments.TransferFrom(msg.sender, _managerContract.retrieveTransparentProxies()[uint256(Library.TransparentProxies.PublicPool)], offer, _issuerID, data);
    }

    _tokenOffer[tokenId]._offer = offer;
    _tokenOffer[tokenId]._sender = msg.sender;
    _tokenOffer[tokenId]._bidder = bidder;
    _tokenOffer[tokenId]._deadline = block.timestamp + _offersLifeTime;

    emit _SubmitOffer(tokenId, msg.sender, bidder, offer, FromCredit);
  }
    
  function withdrawOffer(uint256 tokenId) external override
    OfferInProgress(tokenId, false)
  {
    require(msg.sender == _tokenOffer[tokenId]._sender, "Only the original sender can withdraw the bid");
    assignToRejectedSender(tokenId);
    removeOffer(tokenId);
    emit _WithdrawOffer(tokenId);
  }

  function assignToRejectedSender(uint tokenId) internal
  {
    address[] memory addrs = new address[](1);
    uint256[] memory amounts = new uint256[](1);
    uint256[] memory factors = new uint256[](1);
    addrs[0] = _tokenOffer[tokenId]._sender;
    amounts[0] = _tokenOffer[tokenId]._offer;
    factors[0] = 1;
    IPool(_managerContract.retrieveTransparentProxies()[uint256(Library.TransparentProxies.PublicPool)]).addCredit(_issuerID, tokenId, addrs, amounts, factors);
  }

  function AllocatePercents(uint256 tokenId, address[4] memory destinations, uint256[4] memory percentages, uint256 offer, uint256 commonDecimals) internal
  {
    address[] memory addrs = new address[](2 * destinations.length);
    uint256[] memory amounts = new uint256[](2 * destinations.length);
    uint256[] memory factors = new uint256[](2 * destinations.length);
    uint quotient = 0;
    uint remainder = 0;
    uint denominator = 0;
    uint pos = 0;


    for(uint i=0; i < destinations.length; i++){
      (quotient, remainder, denominator) = CalculatePercents(offer, percentages[i], commonDecimals);
      addrs[pos] = destinations[i];
      amounts[pos] = quotient;
      factors[pos++] = 1;
      addrs[pos] = destinations[i];
      amounts[pos] = remainder;
      factors[pos++] = denominator;
    }

    IPool(_managerContract.retrieveTransparentProxies()[uint256(Library.TransparentProxies.PublicPool)]).addCredit(_issuerID, 
      tokenId, 
      addrs, 
      amounts, 
      factors);
  }

  function CalculatePercents(uint256 amount, uint256 percentage, uint256 decimals) internal pure returns(uint256, uint256, uint256)
  {
      uint256 numerator = amount * percentage;
      uint256 denominator = 100 * 10**decimals;

      uint256 quotient = numerator / denominator;
      uint256 remainder = numerator - (quotient * denominator);

      return(quotient, remainder, denominator);
  }

  function retrieveIssuer() external override view returns (ItemsLibrary._issuerStruct memory, uint256)
  {
    return(ItemsLibrary._issuerStruct(_owner, name(), symbol(), _ownerTransferFeeAmount, _ownerTransferFeeDecimals, _paymentPlan), _offersLifeTime);
  }

  function retrieveToken(uint256 tokenId) external override view returns (_tokenStruct memory, address)
  {
    return(_tokenInfo[tokenId], ownerOf(tokenId));
  }

  function retrieveOffer(uint256 tokenId) external override view returns (_offerStruct memory)
  {
      return(_tokenOffer[tokenId]);
  }

  function getLargest(uint256[3] memory nums) internal pure returns(uint256)
  {
    uint256 largest = 0;

    for(uint i=0; i < nums.length; i++)
    {
        if(largest < nums[i])largest = nums[i];
    }

    return largest;
  }

 }