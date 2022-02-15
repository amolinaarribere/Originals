// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.7;

/**
 * @title Storage
 * @dev Store & retrieve value in a variable
 */

import "../Interfaces/IPayments.sol";
import "../Interfaces/IPool.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../Libraries/UintLibrary.sol";
import "../Base/StdPropositionBaseContract.sol";


contract Payment is IPayments, StdPropositionBaseContract{
    using UintLibrary for *;

    // EVENTS /////////////////////////////////////////
    event _NewAddress(address TokenAddress);

    // DATA /////////////////////////////////////////
    IERC20 internal _TokenContract;

    // MODIFIERS /////////////////////////////////////////
    modifier isAddressOK(address addr)
    {
        require(address(0) != addr, "EC21-");
        _;
    }

    modifier isFromCertifiedContract(address addr, uint256 id)
    {
        require(
            addr == _managerContract.retrieveTransparentProxies()[uint256(Library.TransparentProxies.PublicPool)] || 
            addr == _managerContract.retrieveTransparentProxies()[uint256(Library.TransparentProxies.Treasury)] || 
            addr == _managerContract.retrieveTransparentProxies()[uint256(Library.TransparentProxies.AdminPiggyBank)] || 
            isNFTMarket(addr, id) 
        , "EC21-");
        _;
    }

    function isNFTMarket(address addr, uint256 id) internal view returns(bool)
    {
        IPool PublicPool = IPool( _managerContract.retrieveTransparentProxies()[uint256(Library.TransparentProxies.PublicPool)]);
        return (addr == PublicPool.retrieveNFTMarketForIssuer(id));
    }
   
    // CONSTRUCTOR /////////////////////////////////////////
    function Payment_init(address managerContractAddress, address chairPerson, address tokenAddress) public initializer 
    {
        super.StdPropositionBaseContract_init(chairPerson, managerContractAddress);
        InternalupdateSettings(tokenAddress);
    }

    // GOVERNANCE /////////////////////////////////////////
    function checkProposition(bytes[] memory NewValues) internal override 
        isAddressOK(AddressLibrary.Bytes32ToAddress(Library.BytestoBytes32(NewValues[0])[0]))
    {}

    function UpdateAll() internal override
    {
        bytes32[] memory ProposedNewValues = PropositionsToBytes32();
        address NewAddress = AddressLibrary.Bytes32ToAddress(ProposedNewValues[0]);
        InternalupdateSettings(NewAddress);
        emit _NewAddress(NewAddress);
    }

    function InternalupdateSettings(address tokenAddress) internal
    {
        _TokenContract = IERC20(tokenAddress);
    }

    // FUNCTIONALITY /////////////////////////////////////////
    function TransferFundsFrom(address sender, address recipient, uint256 amount, uint256 id) external override
        isFromCertifiedContract(msg.sender, id)
    {
        bool success = _TokenContract.transferFrom(sender, recipient, amount);
        require(true == success, "Transfer From did not work");
    }

    function getBalanceFor(address account) external override view returns(uint256)
    {
        return(_TokenContract.balanceOf(account));
    }


    function retrieveSettings() external override view returns(address)
    {
        return(address(_TokenContract));
    }

}