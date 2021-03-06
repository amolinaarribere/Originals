// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.7;

import "../Interfaces/IAdminPiggyBank.sol";
import "../Interfaces/IPayments.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../Libraries/ItemsLibrary.sol";
import "../Base/MultiSigContract.sol";
import "../Base/CreditorBaseContract.sol";

contract AdminPiggyBank is Initializable, MultiSigContract, CreditorBaseContract, IAdminPiggyBank {
    using ItemsLibrary for *;

    // EVENTS /////////////////////////////////////////
    event _Pay(address indexed payer, uint amount, uint paymentTokenID);
    event _TransferCreated(address indexed to, uint amount, uint paymentTokenID);
    event _VoteForTransfer(address indexed to, uint amount, uint paymentTokenID, address indexed voter, bool vote);
    event _TransferValidated(address indexed to, uint amount, uint paymentTokenID);
    event _TransferRejected(address indexed to, uint amount, uint paymentTokenID);

    // DATA /////////////////////////////////////////
    _TransferStruct _transferInProgress;

    // MODIFIERS /////////////////////////////////////////
    modifier isReceiverOK(address addr)
    {
        require(address(0) != addr, "We cannot transfer to address 0");
        _;
    }

    modifier isAmountOK(uint256 amount, uint256 paymentTokenID)
    {
        IPayments payments = IPayments(_managerContract.retrieveTransparentProxies()[uint256(Library.TransparentProxies.Payments)]);
        require(paymentTokenID < payments.retrieveSettings().length, "This token Id does not exist yet in the system");
        require(IPayments(_managerContract.retrieveTransparentProxies()[uint256(Library.TransparentProxies.Payments)]).BalanceOf(address(this), paymentTokenID) >= amount, "We cannot transfer more than the current balance");
        _;
    }

    modifier transferInProgress(bool YesOrNo)
    {
        transferInProgressFunc(YesOrNo);
        _;
    }

    function transferInProgressFunc(bool YesOrNo) internal view
    {
        if(YesOrNo) require(address(0) != _transferInProgress._to, "Transfer not in progress");
        else require(address(0) == _transferInProgress._to, "Transfer in progress");
    }

    // CONSTRUCTOR /////////////////////////////////////////
    function AdminPiggyBank_init(address[] memory owners, uint256 minOwners, address managerContractAddress) public initializer {
      super.MultiSigContract_init(owners, minOwners);
      super.CreditorBaseContract_init(managerContractAddress); 
    }


    // FUNCTIONALITY /////////////////////////////////////////
    function onCreditReceived(address sender, uint256 amount, uint256 paymentTokenID, bytes memory data) internal override
    {
        emit _Pay(sender, amount, paymentTokenID);
    }

    function transfer(address receiver, uint256 amount, uint256 paymentTokenID) external override
        isReceiverOK(receiver)
        isAmountOK(amount, paymentTokenID)
        transferInProgress(false)
    {
        _transferInProgress._to = receiver;
        _transferInProgress._amount = amount;
        _transferInProgress._paymentTokenID = paymentTokenID;

        emit _TransferCreated(receiver, amount, paymentTokenID);

        VoteForTransfer(true);
    }

    function approve() external override
    {
        VoteForTransfer(true);
    } 

    function reject() external override
    {
        VoteForTransfer(false);
    }

    function VoteForTransfer(bool vote) internal
        isAnOwner(msg.sender, true)
        transferInProgress(true)
        HasNotAlreadyVoted(msg.sender, _transferInProgress._voters)
    {

        emit _VoteForTransfer(_transferInProgress._to, _transferInProgress._amount, _transferInProgress._paymentTokenID, msg.sender, vote);

        _transferInProgress._voters.push(msg.sender);
        
        if(vote){
            _transferInProgress._validations++;

            if(_transferInProgress._validations >= _minOwners){
                ItemsLibrary.TransferTo(
                    _transferInProgress._amount, 
                    _transferInProgress._to, 
                    address(IPayments(_managerContract.retrieveTransparentProxies()[uint256(Library.TransparentProxies.Payments)]).retrieveSettings()[_transferInProgress._paymentTokenID].TokenContract),
                    false,
                    bytes(""),
                    _transferInProgress._paymentTokenID
                );
                emit _TransferValidated(_transferInProgress._to, _transferInProgress._amount, _transferInProgress._paymentTokenID);
                deletingPendingTransfer();
            }
        }
        else{
            _transferInProgress._rejections++;

            if(_transferInProgress._rejections >= _minOwners){
                emit _TransferRejected(_transferInProgress._to, _transferInProgress._amount, _transferInProgress._paymentTokenID);
                deletingPendingTransfer();
            }
        }

    } 

    function deletingPendingTransfer() internal
    {
        delete(_transferInProgress);
    }

    function retrieveTransferInfo() external override view returns(_TransferStruct memory)
    {
        return(_transferInProgress);
    }
}