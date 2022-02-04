// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.7;

/**
 * @title Storage
 * @dev Store & retrieve value in a variable
 */

interface IAdminPiggyBank {
    struct _TransferStruct{
        address _to;
        uint256 _amount;
        uint _validations;
        uint _rejections;
        address[] _voters;
    }

    function transfer(address receiver, uint256 amount) external;
    function approve() external;
    function reject() external;

    function retrieveTransferInfo() external view returns(_TransferStruct memory);
}