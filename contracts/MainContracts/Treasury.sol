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
import "../Base/CreditorBaseContract.sol";
import "../Interfaces/IPayments.sol";


contract Treasury is ITreasury, StdPropositionBaseContract, CreditorBaseContract{
    using Library for *;
    using UintLibrary for *;
    using ItemsLibrary for *;

    // EVENTS /////////////////////////////////////////
    event _NewPrices(uint[][] Prices);
    event _Pay(address indexed Payer, uint Amount, uint AggregatedAmount, uint256 tokenContractId);
    event _AssignDividend(address indexed Recipient, uint Amount, uint TotalSupply, uint256 tokenContractId);
    event _Withdraw(address indexed Recipient, uint Amount, uint256 tokenContractId);
    /*event _NewPrices(uint[] Prices);
    event _Pay(address indexed Payer, uint Amount, uint AggregatedAmount);
    event _AssignDividend(address indexed Recipient, uint Amount, uint TotalSupply);
    event _Withdraw(address indexed Recipient, uint Amount);*/

    // DATA /////////////////////////////////////////
    // prices parameters usd
    uint256[][] private _Prices;
    //uint256[] private _Prices;

    // last amount at which dividends where assigned for each token owner
    uint256[] private _AggregatedDividendAmount;
    //uint256 private _AggregatedDividendAmount;
    mapping(uint256 => mapping(address => uint256)) private _lastAssigned;
    //mapping(address => uint256) private _lastAssigned;

    // dividends per token owner
    mapping(uint256 => mapping(address => ItemsLibrary._BalanceStruct)) private _balances;
    //mapping(address => ItemsLibrary._BalanceStruct) private _balances;

    // MODIFIERS /////////////////////////////////////////
    
    // CONSTRUCTOR /////////////////////////////////////////
    function Treasury_init(uint256[][] memory Prices, address managerContractAddress, address chairPerson) public initializer 
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
        uint256 PricesPerToken = UintLibrary.Bytes32ToUint(ProposedNewValues[0]);
        uint256[][] memory newPrices;

        for (uint256 i=1; i < ProposedNewValues.length; i++) {
            uint256 paymentTokenID = (i - 1) / PricesPerToken;
            uint256 PriceId = (i - 1) % PricesPerToken;
            newPrices[PriceId][paymentTokenID] = UintLibrary.Bytes32ToUint(ProposedNewValues[i]);
        }

        InternalupdatePrices(newPrices);

        emit _NewPrices(newPrices);
    }

    function InternalupdatePrices(uint256[][] memory Prices) internal
    {
        for (uint i=0; i < Prices.length; i++) {
            if(i < _Prices.length)_Prices[i] = Prices[i];
            else _Prices.push(Prices[i]);
        }
    }

    // FUNCTIONALITY /////////////////////////////////////////
    function onCreditReceived(address sender, uint256 amount, uint256 paymentTokenID, bytes memory data) internal override
    {
        if(paymentTokenID < _AggregatedDividendAmount.length) _AggregatedDividendAmount[paymentTokenID] += amount;
        else _AggregatedDividendAmount.push(amount);

        emit _Pay(sender, amount, _AggregatedDividendAmount[paymentTokenID], paymentTokenID);
    }

    function InternalonTokenBalanceChanged(address from, address to, uint256 amount) internal override
    {
        super.InternalonTokenBalanceChanged(from, to, amount);
        if(address(0) != from) {
            for(uint256 i=0; i < _AggregatedDividendAmount.length; i++){
                InternalAssignDividends(from, i);
            }
        }
        if(address(0) != to) {
            for(uint256 i=0; i < _AggregatedDividendAmount.length; i++){
                InternalAssignDividends(to, i);
            }
        }
    }

    function InternalAssignDividends(address recipient, uint256 paymentTokenID) internal
    {
        (uint totalOffBalance, uint DividendOffBalance) = sumUpTotalOffBalance(recipient, paymentTokenID);
        _lastAssigned[paymentTokenID][recipient] = _AggregatedDividendAmount[paymentTokenID];
        
        if(totalOffBalance > 0){   
           ItemsLibrary.addBalance(_balances[paymentTokenID][recipient], totalOffBalance, DividendOffBalance);
           emit _AssignDividend(recipient, totalOffBalance, DividendOffBalance, paymentTokenID);
        }
    }

    function withdraw(uint amount, uint256 paymentTokenID) external 
    override
    {
        InternalWithdraw(amount, paymentTokenID);
    }

    function withdrawAll(uint256 paymentTokenID) external override
    {
        uint All = ItemsLibrary.checkFullBalance(_balances[paymentTokenID][msg.sender]);
        InternalWithdraw(All, paymentTokenID);
    }

    function InternalWithdraw(uint amount, uint256 paymentTokenID) internal 
    {
        InternalAssignDividends(msg.sender, paymentTokenID);
        ItemsLibrary.InternalWithdraw(
            _balances[paymentTokenID][msg.sender], 
            amount, 
            msg.sender, 
            true, 
            address(IPayments(_managerContract.retrieveTransparentProxies()[uint256(Library.TransparentProxies.Payments)]).retrieveSettings()[paymentTokenID].TokenContract),
            false,
            bytes(""),
            paymentTokenID
        );

        emit _Withdraw(msg.sender, amount, paymentTokenID);
    }

    function retrieveLastAssigned(address addr, uint256 paymentTokenID) external override view returns(uint)
    {
        return _lastAssigned[paymentTokenID][addr];
    }

    function retrieveFullBalance(address addr, uint256 paymentTokenID) external override view returns(uint)
    {
        return ItemsLibrary.checkFullBalance(_balances[paymentTokenID][addr]);
    }

    function retrieveSettings() external override view returns(uint[][] memory)
    {
        return(_Prices);
    }

    function retrieveAggregatedAmount(uint256 paymentTokenID) external override view returns(uint){
        return _AggregatedDividendAmount[paymentTokenID];
    }

    function sumUpTotal(address addr, uint256 paymentTokenID) internal view returns (uint, uint)
    {
        (uint totalOnBalance, uint commonDividendOnBalance) = sumUpTotalOnBalance(addr, paymentTokenID);
        (uint totalOffBalance, uint DividendOffBalance) = sumUpTotalOffBalance(addr, paymentTokenID);

        uint total = (totalOnBalance * DividendOffBalance) + (totalOffBalance * commonDividendOnBalance);
        uint CommonDividend = commonDividendOnBalance * DividendOffBalance;

        return (total, CommonDividend);
    }

    function sumUpTotalOnBalance(address addr, uint256 paymentTokenID) internal view returns (uint, uint)
    {
        return ItemsLibrary.sumUpTotal(_balances[paymentTokenID][addr]);
    }

    function sumUpTotalOffBalance(address addr, uint256 paymentTokenID) internal view returns (uint, uint)
    {
        uint total = 0;

        if(_lastAssigned[paymentTokenID][addr] < _AggregatedDividendAmount[paymentTokenID])
        {
            total = (_AggregatedDividendAmount[paymentTokenID] - _lastAssigned[paymentTokenID][addr]) * GetTokensBalance(addr);           
        }

        return (total, totalSupply());
    }


}