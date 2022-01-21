// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.7;

/**
 * @title Storage
 * @dev Store & retrieve value in a variable
 */
  import "../Libraries/Library.sol";


interface IFactory {

    function create(address owner, string memory name, string memory symbol, Library.PaymentPlans paymentPlan) external returns (address);
    
}