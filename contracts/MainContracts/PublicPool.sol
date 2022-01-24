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


 contract PublicPool is  Initializable, MultiSigContract, ManagedBaseContract, IPool {

  // EVENTS /////////////////////////////////////////
    event _NewRequest(address indexed owner, string name, string symbol);

  // DATA /////////////////////////////////////////

  // MODIFIERS /////////////////////////////////////////
 

  // CONSTRUCTOR /////////////////////////////////////////
  function PublicPool_init(address[] memory owners,  uint256 minOwners, address managerContractAddress) public initializer {
      super.MultiSigContract_init(owners, minOwners); 
      super.ManagedBaseContract_init(managerContractAddress); 
  }

  // FUNCTIONALITY /////////////////////////////////////////
  function requestIssuer(address owner, string memory name, string memory symbol, Library.PaymentPlans paymentPlan) external override payable returns (uint)
  {
    return 0;
  }

  function validateIssuer(uint id) external override
  {
  }

  function rejectIssuer(uint id) external override
  {
  }

  function retrieveIssuers() external override view returns (uint[] memory)
  {
    
  }

  function retrieveNFTMarketForIssuer(uint id) external override view returns (address)
  {
    return address(0);
  }

  function retrievePendingIssuers() external override view returns (uint[] memory)
  {

  }

  function retrievePendingIssuer(uint id) external override view returns (ItemsLibrary._pendingIssuerStruct memory)
  {

  }



 }