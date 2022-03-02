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
    event _NewSettings(uint[][] Fees, uint[] TransactionFees, uint[] OfferSettings);
    event _Pay(address indexed Payer, uint Amount, uint AggregatedAmount, uint256 tokenContractId);
    event _AssignDividend(address indexed Recipient, uint Amount, uint TotalSupply, uint256 tokenContractId);
    event _Withdraw(address indexed Recipient, uint Amount, uint256 tokenContractId);

    // DATA /////////////////////////////////////////
    // prices parameters
    uint256[][] private _Fees;
    uint256[] private _TransferFees;
    uint256[] private _OfferSettings;

    // last amount at which dividends where assigned for each token owner
    uint256[] private _AggregatedDividendAmount;
    mapping(uint256 => mapping(address => uint256)) private _lastAssigned;

    // dividends per token owner
    mapping(uint256 => mapping(address => ItemsLibrary._BalanceStruct)) private _balances;

    // MODIFIERS /////////////////////////////////////////
    modifier FeesStructOK(uint256[][] memory Fees){
        require(Fees.length > 0, "No payment token at all for the fees");
        uint256 FeesPerToken = Fees[0].length;
        for(uint256 i=1; i < Fees.length; i++){
            require(FeesPerToken == Fees[1].length, "Diffrent amount of fees for different tokens");
        }
        _;
    }
    // CONSTRUCTOR /////////////////////////////////////////
    function Treasury_init(uint256[][] memory Fees, uint256[] memory TransferFees, uint256[] memory OfferSettings, address managerContractAddress, address chairPerson) public initializer 
    {
        super.StdPropositionBaseContract_init(chairPerson, managerContractAddress);
        InternalupdateSettings(Fees, TransferFees, OfferSettings);
    }

    // GOVERNANCE /////////////////////////////////////////
    function checkProposition(bytes[] memory NewValues) internal override 
    {
        require(NewValues.length >= 3, "Missing Settings");
    }

    function UpdateAll() internal override
    {
        uint256 count;
        bytes32[] memory ProposedNewValues = PropositionsToBytes32();
        uint256 numberOfTokens = UintLibrary.Bytes32ToUint(ProposedNewValues[count++]);
        uint256 FeesPerToken = UintLibrary.Bytes32ToUint(ProposedNewValues[count++]);
        uint256 numberOfTransferFees = UintLibrary.Bytes32ToUint(ProposedNewValues[count++]);
        uint256[][] memory newFees = new uint256[][](numberOfTokens);
        uint256[] memory newTransferFees = new uint256[](numberOfTransferFees);
        uint256[] memory newOfferSettings = new uint256[](ProposedNewValues.length - (numberOfTokens * FeesPerToken) - count - numberOfTransferFees);

        require(ProposedNewValues.length >= count + (numberOfTokens * FeesPerToken) + numberOfTransferFees, "There are some missing fees and/or settings");

        for (uint256 i=0; i < numberOfTokens; i++) {
            uint256[] memory FeesForToken = new uint256[](FeesPerToken);
            for(uint256 j=0; j < FeesPerToken; j++){
                FeesForToken[j] = UintLibrary.Bytes32ToUint(ProposedNewValues[count + (i * FeesPerToken) + j]);
            }
            newFees[i] = FeesForToken;
        }

        for (uint256 j=(numberOfTokens * FeesPerToken) + count; j < (numberOfTokens * FeesPerToken) + count + numberOfTransferFees; j++) {
            newTransferFees[j - ((numberOfTokens * FeesPerToken) + count)] = UintLibrary.Bytes32ToUint(ProposedNewValues[j]);
        }

        for (uint256 k=(numberOfTokens * FeesPerToken) + count + numberOfTransferFees; k < ProposedNewValues.length; k++) {
            newOfferSettings[k - ((numberOfTokens * FeesPerToken) + count + numberOfTransferFees)] = UintLibrary.Bytes32ToUint(ProposedNewValues[k]);
        }

        InternalupdateSettings(newFees, newTransferFees, newOfferSettings);

        emit _NewSettings(newFees, newTransferFees, newOfferSettings);
    }
    function InternalupdateSettings(uint256[][] memory Fees, uint256[] memory TransferFees, uint256[] memory OfferSettings) internal
        FeesStructOK(Fees)
    {
        for (uint i=0; i < Fees.length; i++) {
            if(i < _Fees.length){
                for(uint p=0; p < Fees[i].length; p++){
                    if(p < _Fees[i].length)_Fees[i][p] = Fees[i][p];
                    else _Fees[i].push(Fees[i][p]);
                }
                for(uint p2=Fees[i].length; p2 < _Fees[i].length; p2++){
                    _Fees[i].pop();
                }
            }
            else {
                _Fees.push(Fees[i]);
            }
        }
        for (uint i2=Fees.length; i2 < _Fees.length; i2++) {
           _Fees.pop();
        }


        for (uint j=0; j < TransferFees.length; j++) {
            if(j < _TransferFees.length)_TransferFees[j] = TransferFees[j];
            else _TransferFees.push(TransferFees[j]);
        }
        for (uint j2=TransferFees.length; j2 < _TransferFees.length; j2++) {
            _TransferFees.pop();
        }


        for (uint k=0; k < OfferSettings.length; k++) {
            if(k < _OfferSettings.length)_OfferSettings[k] = OfferSettings[k];
            else _OfferSettings.push(OfferSettings[k]);
        }
        for (uint k2=OfferSettings.length; k2 < _OfferSettings.length; k2++) {
            _OfferSettings.pop();
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
        if(paymentTokenID < _AggregatedDividendAmount.length){
            (uint totalOffBalance, uint DividendOffBalance) = sumUpTotalOffBalance(recipient, paymentTokenID);
            _lastAssigned[paymentTokenID][recipient] = _AggregatedDividendAmount[paymentTokenID];
        
            if(totalOffBalance > 0){   
            ItemsLibrary.addBalance(_balances[paymentTokenID][recipient], totalOffBalance, DividendOffBalance);
            emit _AssignDividend(recipient, totalOffBalance, DividendOffBalance, paymentTokenID);
            }
        }  
    }

    function withdraw(uint amount, uint256 paymentTokenID) external override
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

    function retrieveSettings() external override view returns(uint256[][] memory, uint256[] memory, uint256[] memory)
    {
        return(_Fees, _TransferFees, _OfferSettings);
    }

    function retrieveAggregatedAmount(uint256 paymentTokenID) external override view returns(uint){
        if(paymentTokenID < _AggregatedDividendAmount.length) return _AggregatedDividendAmount[paymentTokenID];
        else return 0;
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

        if(paymentTokenID < _AggregatedDividendAmount.length && 
            _lastAssigned[paymentTokenID][addr] < _AggregatedDividendAmount[paymentTokenID])
        {
            total = (_AggregatedDividendAmount[paymentTokenID] - _lastAssigned[paymentTokenID][addr]) * GetTokensBalance(addr);           
        }

        return (total, totalSupply());
    }


}