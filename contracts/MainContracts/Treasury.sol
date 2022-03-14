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
    modifier FeesOK(uint256[][] memory Fees){
        if(_Fees.length > 0){
            for(uint256 i=0; i < Fees.length; i++){
                require(_Fees[0].length + 1 == Fees[i].length, "Number of Fees does not match");
            }
        }
        _;
    }
    modifier TransferFeesOK(uint256[] memory TransferFees){
        if(_TransferFees.length > 0){
            require(_TransferFees.length == TransferFees.length, "Number of Transfer Fees does not match");
        }
        _;
    }
    modifier OfferSettingsOK(uint256[] memory OfferSettings){
        if(_OfferSettings.length > 0){
            require(_OfferSettings.length == OfferSettings.length, "Number of Offer Settings does not match");
        }
        _;
    }
    // CONSTRUCTOR /////////////////////////////////////////
    function Treasury_init(uint256[][] memory Fees, uint256[] memory TransferFees, uint256[] memory OfferSettings, address managerContractAddress, address chairPerson) public initializer 
    {
        super.StdPropositionBaseContract_init(chairPerson, managerContractAddress);

        uint256[][] memory initFees = new uint256[][](Fees.length);

        if(Fees.length > 0){
            for(uint i=0; i < initFees.length; i++){
                uint256[] memory FeesForToken = new uint256[](Fees[i].length + 1);
                FeesForToken[0] = i;
                for(uint j=0; j < Fees[i].length; j++){
                    FeesForToken[j + 1] = Fees[i][j];
                }
                initFees[i] = FeesForToken;
            }
        }

        InternalupdateSettings(initFees, TransferFees, OfferSettings);
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
        uint256 ItemsPerToken = FeesPerToken + 1;
        uint256 numberOfTransferFees = UintLibrary.Bytes32ToUint(ProposedNewValues[count++]);
        uint256[][] memory newFees = new uint256[][](numberOfTokens);
        uint256[] memory newTransferFees = new uint256[](numberOfTransferFees);
        uint256[] memory newOfferSettings = new uint256[](ProposedNewValues.length - (numberOfTokens * ItemsPerToken) - count - numberOfTransferFees);

        require(ProposedNewValues.length >= count + (numberOfTokens * ItemsPerToken) + numberOfTransferFees, "There are some missing fees and/or settings");
        require(numberOfTransferFees == _TransferFees.length, "Number of Transfer fees does not match");
        require(newOfferSettings.length == _OfferSettings.length, "Number of Offer settings does not match");

        uint index = count;

        for (uint256 i=0; i < numberOfTokens; i++) {
            uint256[] memory newFeesForToken = new uint256[](ItemsPerToken);
            for(uint256 j=0; j < ItemsPerToken; j++){
                newFeesForToken[j] = UintLibrary.Bytes32ToUint(ProposedNewValues[index++]);
            }
            newFees[i] = newFeesForToken;
        }

        for (uint256 j=0; j < numberOfTransferFees; j++) {
            newTransferFees[j] = UintLibrary.Bytes32ToUint(ProposedNewValues[index++]);
        }

        for (uint256 k=0; k < newOfferSettings.length; k++) {
            newOfferSettings[k] = UintLibrary.Bytes32ToUint(ProposedNewValues[index++]);
        }

        InternalupdateSettings(newFees, newTransferFees, newOfferSettings);

        emit _NewSettings(newFees, newTransferFees, newOfferSettings);
    }

    function InternalupdateSettings(uint256[][] memory Fees, uint256[] memory TransferFees, uint256[] memory OfferSettings) internal
        FeesOK(Fees)
        TransferFeesOK(TransferFees)
        OfferSettingsOK(OfferSettings)
    {
        for (uint i=0; i < Fees.length; i++) {
            uint256 paymentTokenID = Fees[i][0];
            if(paymentTokenID < _Fees.length){
                for(uint p=0; p < _Fees[paymentTokenID].length; p++){
                    _Fees[paymentTokenID][p] = Fees[i][p + 1];
                }
            }
            else {
                uint256[] memory FeesForNewPaymentID = new uint256[](Fees[i].length - 1);
                for(uint p=0; p < FeesForNewPaymentID.length; p++){
                    FeesForNewPaymentID[p] = Fees[i][p + 1];
                }
                _Fees.push(FeesForNewPaymentID);
            }
        }

        for (uint j=0; j < TransferFees.length; j++) {
            if(j < _TransferFees.length) _TransferFees[j] = TransferFees[j];
            else _TransferFees.push(TransferFees[j]);
        }

        for (uint k=0; k < OfferSettings.length; k++) {
            if(k < _OfferSettings.length) _OfferSettings[k] = OfferSettings[k];
            else _OfferSettings.push(OfferSettings[k]);
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
        (uint total, uint dividend) = sumUpTotal(addr, paymentTokenID);
        return total / dividend;
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