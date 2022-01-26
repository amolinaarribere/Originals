// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.7;

import "../Interfaces/IAdminPiggyBank.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../Libraries/ItemsLibrary.sol";
import "../Base/MultiSigContract.sol";


contract AdminPiggyBank is Initializable, MultiSigContract, IAdminPiggyBank {

    // EVENTS /////////////////////////////////////////
    event _Pay(address indexed payer, uint amount);
    event _TransferCreated(address indexed to, uint amount);
    event _VoteForTransfer(address indexed to, uint amount, address indexed voter, bool vote);
    event _TransferValidated(address indexed to, uint amount);
    event _TransferRejected(address indexed to, uint amount);

    // DATA /////////////////////////////////////////
    _TransferStruct _transferInProgress;

    // MODIFIERS /////////////////////////////////////////
    modifier isReceiverOK(address addr)
    {
        require(address(0) != addr, "We cannot transfer to address 0");
        _;
    }

    modifier isAmountOK(uint256 amount)
    {
        require(address(this).balance >= amount, "We cannot transfer more than the current balance");
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
    function AdminPiggyBank_init(address[] memory owners,  uint256 minOwners) public initializer {
      super.MultiSigContract_init(owners, minOwners); 
    }


    // FUNCTIONALITY /////////////////////////////////////////

    receive() external payable
    {
        emit _Pay(msg.sender, msg.value);
    }

    function transfer(address receiver, uint amount) external override
        isReceiverOK(receiver)
        isAmountOK(amount)
        transferInProgress(false)
    {
        _transferInProgress._to = receiver;
        _transferInProgress._amount = amount;

        emit _TransferCreated(receiver, amount);

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

        emit _VoteForTransfer(_transferInProgress._to, _transferInProgress._amount, msg.sender, vote);

        _transferInProgress._voters.push(msg.sender);
        
        if(vote){
            _transferInProgress._validations++;

            if(_transferInProgress._validations >= _minOwners){
                ItemsLibrary.TransferEtherTo(_transferInProgress._amount, _transferInProgress._to);
                emit _TransferValidated(_transferInProgress._to, _transferInProgress._amount);
                deletingPendingTransfer();
            }
        }
        else{
            _transferInProgress._rejections++;

            if(_transferInProgress._rejections >= _minOwners){
                emit _TransferRejected(_transferInProgress._to, _transferInProgress._amount);
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