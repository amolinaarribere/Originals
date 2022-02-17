// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.7;

import "./Library.sol";
import "./UintLibrary.sol";
import "../Interfaces/ICreditor.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";


library ItemsLibrary{
    using UintLibrary for *;
    using Library for *;
    
    // DATA /////////////////////////////////////////
    struct _issuerStruct{
        address _owner;
        string _name;
        string _symbol;
        uint256 _feeAmount;
        uint256 _feeDecimals;
        Library.PaymentPlans _paymentPlan;
    }

    // balance per token owner
    struct _BalanceStruct{
        mapping(uint => uint) _balance;
        uint[] _factors;
    }

    // TREASURY & NFTMarket///////////////////////////
    function InternalWithdraw(_BalanceStruct storage balance, uint amount, address to, bool transfer, address TokenContractAddress, bool sendData, bytes memory data) public 
    {
        require(checkFullBalance(balance) >= amount, "EC20-");

        uint[] memory f = returnFactors(balance);
        (uint total, uint commonDividend) = sumUpTotal(balance);
        uint remainder =  total - (amount * commonDividend);

        for(uint i=0; i < f.length; i++){
            substractBalance(balance, returnBalanceForFactor(balance, f[i]), f[i]);
        }

        addBalance(balance, remainder, commonDividend);

        if(transfer){
            TransferTo(amount, to, TokenContractAddress, sendData, data);
        }
    }

    function TransferTo(uint amount, address to, address TokenContractAddress, bool sendData, bytes memory data) public
    {
        IERC20 TokenContract = IERC20(TokenContractAddress);
        require(TokenContract.balanceOf(address(this)) >= amount, "Contract does not have enough funds");

        bool success = TokenContract.transfer(to, amount);
        require(true == success, "Transfer did not work");

        if(sendData) ICreditor(to).CreditReceived(address(this), amount, data);
    }

    function addBalance(_BalanceStruct storage balance, uint amount, uint factor) public
    {
        if(amount > 0){
            if(0 == balance._balance[factor])
            {
                balance._factors.push(factor);
            }
            balance._balance[factor] += amount;
        }
    }

    function substractBalance(_BalanceStruct storage balance, uint amount, uint factor) public
    {
        require(balance._balance[factor] >= amount, "Not enough balance for this factor");

        balance._balance[factor] -= amount;

        if(0 == balance._balance[factor])
        {
            UintLibrary.UintArrayRemoveResize(UintLibrary.FindUintPosition(factor, balance._factors), balance._factors);
        }
        
    }

    function checkFullBalance(_BalanceStruct storage balance) public view returns(uint)
    {
        (uint total, uint commonDividend) = sumUpTotal(balance);

        return total / commonDividend;
    }

    function sumUpTotal(_BalanceStruct storage balance) public view returns (uint, uint)
    {
        uint[] memory f = returnFactors(balance);
        uint CommonDividend = UintLibrary.ProductOfFactors(f);
        uint total = 0;

        for(uint i=0; i < f.length; i++){
            total += returnBalanceForFactor(balance, f[i]) * CommonDividend / f[i];
        }

        return (total, CommonDividend);
    }

    function returnFactors(_BalanceStruct storage balance) public view returns(uint[] memory)
    {
        return balance._factors;
    }

    function returnBalanceForFactor(_BalanceStruct storage balance, uint factor) public view returns(uint)
    {
        return balance._balance[factor];
    }

}