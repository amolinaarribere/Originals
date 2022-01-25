// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.7;

import "./Library.sol";
import "./UintLibrary.sol";

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

    struct _pendingIssuerStruct{
        _issuerStruct _issuer;
        uint _pendingId;
        uint _validations;
        uint _rejections;
        address[] _voters;
    }

    struct _offerStruct{
        uint256 _offer;
        address _sender;
        address _bidder;
        uint256 _deadline; 
    }

    struct _tokenStruct{
        Library.PaymentPlans _paymentPlan;
        uint256 _price;
    }

    // dividends per token owner
    struct _BalanceStruct{
        mapping(uint => uint) _balance;
        uint[] _factors;
    }
    
    // AUX FUNCTIONALITY /////////////////////////////////////////
    function CheckValidations(uint256 signatures, uint256 minSignatures) public pure returns(bool){
        if(signatures < minSignatures) return false;
        return true;
    }

    // TREASURY ///////////////////////////
    function InternalWithdraw(_BalanceStruct storage balance, uint amount, address to, bool transfer) public 
    {
        require(checkFullBalance(balance) >= amount, "Cannot withdraw that amount");

        uint[] memory f = returnFactors(balance);
        (uint total, uint commonDividend) = sumUpTotal(balance);
        uint remainder =  total - (amount * commonDividend);

        for(uint i=0; i < f.length; i++){
            substractBalance(balance, returnBalanceForFactor(balance, f[i]), f[i]);
        }

        addBalance(balance, remainder, commonDividend);

        if(transfer){
            (bool success, bytes memory data) = to.call{value: amount}("");
            require(success, string(abi.encodePacked("Error transfering funds to address : ", data)));
        }
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