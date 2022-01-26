// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.7;

/**
 Treasury receives all the payments and assigns dividends to token holders.
 Public Certificate Pool contract can ask for its owners to eb refunded even if they do not own tokens.

 First dividends must be assigned to an account and then the account owner can withdraw the funds.
 Both actions must be triggered by the account owner.

  Events : 
    - New Prices Added : list of prices
    - Payment recieved : payer, amount, new total aggregated contract amount
    - Refund : who, amount, among how many
    - Assign Dividends : who, amount (number of tokens), among how many (total supply)
    - Withdraw : who, how much
 */

import "../Interfaces/ITreasury.sol";
import "../Libraries/UintLibrary.sol";
import "../Libraries/ItemsLibrary.sol";
import "../Libraries/Library.sol";
import "../Base/StdPropositionBaseContract.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";


contract Treasury is ITreasury, StdPropositionBaseContract{
    using Library for *;
    using UintLibrary for *;
    using ItemsLibrary for *;

    // EVENTS /////////////////////////////////////////
    event _NewPrices(uint[] Prices);
    event _Pay(address indexed Payer, uint Amount, uint AggregatedAmount);
    event _AssignDividend(address indexed Recipient, uint Amount, uint TotalSupply);
    event _Withdraw(address indexed Recipient, uint Amount);

    // DATA /////////////////////////////////////////
    // prices parameters usd
    uint[] private _Prices;

    // last amount at which dividends where assigned for each token owner
    uint private _AggregatedDividendAmount;
    mapping(address => uint) private _lastAssigned;

    // dividends per token owner
    mapping(address => ItemsLibrary._BalanceStruct) private _balances;

    // MODIFIERS /////////////////////////////////////////
    
    // CONSTRUCTOR /////////////////////////////////////////
    function Treasury_init(uint256[] memory Prices, address managerContractAddress, address chairPerson) public initializer 
    {
        super.StdPropositionBaseContract_init(chairPerson, managerContractAddress);
        InternalupdatePrices(Prices);
    }

    // GOVERNANCE /////////////////////////////////////////
    function checkProposition(bytes[] memory NewValues) internal override 
    {}

    function UpdateAll() internal override
    {
        bytes32[] memory ProposedNewValues = PropositionsToBytes32();
        uint256[] memory newPrices = new uint256[](ProposedNewValues.length);

        for (uint i=0; i < ProposedNewValues.length; i++) {
            newPrices[i] = UintLibrary.Bytes32ToUint(ProposedNewValues[i]);
        }

        InternalupdatePrices(newPrices);

        emit _NewPrices(newPrices);
    }

    function InternalupdatePrices(uint256[] memory Prices) internal
    {
        for (uint i=0; i < Prices.length; i++) {
            if(i < _Prices.length)_Prices[i] = Prices[i];
            else _Prices.push(Prices[i]);
        }
    }

    // FUNCTIONALITY /////////////////////////////////////////
    receive() external payable
    {
        _AggregatedDividendAmount += msg.value;

        emit _Pay(msg.sender, msg.value, _AggregatedDividendAmount);
    }

    function InternalonTokenBalanceChanged(address from, address to, uint256 amount) internal override
    {
        super.InternalonTokenBalanceChanged(from, to, amount);
        if(address(0) != from) InternalAssignDividends(from);
        if(address(0) != to) InternalAssignDividends(to);
    }

    function InternalAssignDividends(address recipient) internal
    {
        (uint totalOffBalance, uint DividendOffBalance) = sumUpTotalOffBalance(recipient);
        _lastAssigned[recipient] = _AggregatedDividendAmount;
        
        if(totalOffBalance > 0){   
           ItemsLibrary.addBalance(_balances[recipient], totalOffBalance, DividendOffBalance);
           emit _AssignDividend(recipient, totalOffBalance, DividendOffBalance);
        }
    }

    function withdraw(uint amount) external 
    override
    {
        InternalWithdraw(amount);
    }

    function withdrawAll() external override
    {
        uint All = ItemsLibrary.checkFullBalance(_balances[msg.sender]);
        InternalWithdraw(All);
    }

    function InternalWithdraw(uint amount) internal 
    {
        InternalAssignDividends(msg.sender);
        ItemsLibrary.InternalWithdraw(_balances[msg.sender], amount, msg.sender, true);

        emit _Withdraw(msg.sender, amount);
    }

    function retrieveLastAssigned(address addr) external override view returns(uint)
    {
        return _lastAssigned[addr];
    }

    function retrieveFullBalance(address addr) external override view returns(uint)
    {
        return ItemsLibrary.checkFullBalance(_balances[addr]);
    }

    function retrieveSettings() external override view returns(uint[] memory)
    {
        return(_Prices);
    }

    function retrieveAggregatedAmount() external override view returns(uint){
        return _AggregatedDividendAmount;
    }

    function sumUpTotal(address addr) internal view returns (uint, uint)
    {
        (uint totalOnBalance, uint commonDividendOnBalance) = sumUpTotalOnBalance(addr);
        (uint totalOffBalance, uint DividendOffBalance) = sumUpTotalOffBalance(addr);

        uint total = (totalOnBalance * DividendOffBalance) + (totalOffBalance * commonDividendOnBalance);
        uint CommonDividend = commonDividendOnBalance * DividendOffBalance;

        return (total, CommonDividend);
    }

    function sumUpTotalOnBalance(address addr) internal view returns (uint, uint)
    {
        return ItemsLibrary.sumUpTotal(_balances[addr]);
    }

    function sumUpTotalOffBalance(address addr) internal view returns (uint, uint)
    {
        uint total = 0;

        if(_lastAssigned[addr] < _AggregatedDividendAmount)
        {
            total = (_AggregatedDividendAmount - _lastAssigned[addr]) * GetTokensBalance(addr);           
        }

        return (total, totalSupply());
    }


}