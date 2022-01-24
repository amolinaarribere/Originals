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


 contract NFTMarket is  Initializable, ManagedBaseContract, ERC721Upgradeable {
    using Library for *;

  // EVENTS /////////////////////////////////////////
  

  // DATA /////////////////////////////////////////
  address _owner;
  Library.PaymentPlans _paymentPlan;

  // MODIFIERS /////////////////////////////////////////
  

  // CONSTRUCTOR /////////////////////////////////////////
  function NFTMarket_init(address managerContractAddress, address owner, string memory name, string memory symbol, uint8 paymentPlan) public initializer {
      super.ManagedBaseContract_init(managerContractAddress); 
      super.__ERC721_init(name, symbol); 

      _owner = owner;
      _paymentPlan = Library.PaymentPlans(paymentPlan);
  }

  // FUNCTIONALITY /////////////////////////////////////////
 }