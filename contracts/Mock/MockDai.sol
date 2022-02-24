// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.7;

/**
 Certis Token is an ERC20 Token that grants its holder the right to:
   - Vote on all the systems propositions (changing system configuraiton etc...)
   - Receive Dividends for all the payments forwarded to the Treasury contract

Before every token transfer we contact the token gouvernance Base contracts so that the can update the tokens used for voting if needed

 */

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

 contract MockDai is ERC20 {

    // CONSTRUCTOR /////////////////////////////////////////
    constructor (string memory name, string memory symbol, uint256 MaxSupply, address initialOwner) ERC20(name, symbol){
        _mint(initialOwner, MaxSupply);
    }


 }