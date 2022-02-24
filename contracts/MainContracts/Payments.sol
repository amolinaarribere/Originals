// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.7;

/**
 * @title Storage
 * @dev Store & retrieve value in a variable
 */

import "../Interfaces/IPayments.sol";
import "../Interfaces/IPool.sol";
import "../Interfaces/ICreditor.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../Libraries/UintLibrary.sol";
import "../Base/StdPropositionBaseContract.sol";


contract Payments is IPayments, StdPropositionBaseContract{
    using UintLibrary for *;
    using Library for *;

    // EVENTS /////////////////////////////////////////
    event _NewAddresses(address[] TokenAddresses);

    // DATA /////////////////////////////////////////
    Library.PaymentTokenStruct[] _Tokens;

    // MODIFIERS /////////////////////////////////////////
    modifier areAddressesOK(bytes[] memory NewValues)
    {
        require(NewValues.length > 0, "At least one token address must be provided");

        if(NewValues.length > _Tokens.length){
            for(uint256 i=_Tokens.length; i < NewValues.length; i++){
                require(address(0) != AddressLibrary.Bytes32ToAddress(Library.BytestoBytes32(NewValues[i])[0]), "New Token addresses cannot be empty");
            }
        }
        else{
            bool AtLeastOneActiveToken = false;
            for(uint256 i=0; i < NewValues.length; i++){
                if(address(0) != AddressLibrary.Bytes32ToAddress(Library.BytestoBytes32(NewValues[i])[0])) {
                    AtLeastOneActiveToken = true;
                    break;
                }
            }
            require(AtLeastOneActiveToken, "EC21-");
        }
        _;
    }

    modifier isFromCertifiedContract(address addr, uint256 id)
    {
        require(
            addr == _managerContract.retrieveTransparentProxies()[uint256(Library.TransparentProxies.PublicPool)] || 
            addr == _managerContract.retrieveTransparentProxies()[uint256(Library.TransparentProxies.Treasury)] || 
            addr == _managerContract.retrieveTransparentProxies()[uint256(Library.TransparentProxies.AdminPiggyBank)] || 
            isNFTMarket(addr, id) 
        , "It is not from one of the certified contracts");
        _;
    }

    function isNFTMarket(address addr, uint256 id) internal view returns(bool)
    {
        if(0 == id) return false;
        IPool PublicPool = IPool(_managerContract.retrieveTransparentProxies()[uint256(Library.TransparentProxies.PublicPool)]);
        return (addr == PublicPool.retrieveNFTMarketForIssuer(id));
    }

    modifier isTokenIdOK(uint256 tokenId)
    {
        require(tokenId < _Tokens.length && 
            address(0) != address(_Tokens[tokenId].TokenContract), "this token Id does not have a corresponding Token address");
        require(true == _Tokens[tokenId].active, "this token Id is not active");
        _;
    }
   
    // CONSTRUCTOR /////////////////////////////////////////
    function Payments_init(address managerContractAddress, address chairPerson, address[] memory tokenAddresses) public initializer 
    {
        super.StdPropositionBaseContract_init(chairPerson, managerContractAddress);
        InternalupdateSettings(tokenAddresses);
    }

    // GOVERNANCE /////////////////////////////////////////
    function checkProposition(bytes[] memory NewValues) internal override 
        areAddressesOK(NewValues)
    {}

    function UpdateAll() internal override
    {
        bytes32[] memory ProposedNewValues = PropositionsToBytes32();
        address[] memory NewAddresses = new address[](ProposedNewValues.length);
        for(uint256 i=0; i < NewAddresses.length; i++){
            NewAddresses[i] = AddressLibrary.Bytes32ToAddress(ProposedNewValues[i]);
        }

        InternalupdateSettings(NewAddresses);
        emit _NewAddresses(NewAddresses);
    }

    function InternalupdateSettings(address[] memory tokenAddresses) internal
    {
        for(uint256 i=0; i < _Tokens.length; i++){
            if(i < tokenAddresses.length && address(0) != tokenAddresses[i]) {
                _Tokens[i].TokenContract = IERC20(tokenAddresses[i]);
                if(!_Tokens[i].active)_Tokens[i].active = true;
            }
            else{
                if(_Tokens[i].active)_Tokens[i].active = false;
            }
        }

        for(uint256 k=_Tokens.length; k < tokenAddresses.length; k++){
            _Tokens[k].TokenContract = IERC20(tokenAddresses[k]);
            _Tokens[k].active = true;
        }
    }

    // FUNCTIONALITY /////////////////////////////////////////
    function TransferFrom(address sender, address recipient, uint256 amount, uint256 MarketId, bytes memory data, uint256 tokenId) external override
        isFromCertifiedContract(msg.sender, MarketId)
        isTokenIdOK(tokenId)
    {
        require(_Tokens[tokenId].TokenContract.allowance(sender, address(this)) >= amount, "Contract does not have enough approved funds");
        bool success = _Tokens[tokenId].TokenContract.transferFrom(sender, recipient, amount);
        require(true == success, "Transfer From did not work");
        ICreditor(recipient).CreditReceived(sender, amount, data);
    }

    function BalanceOf(address account, uint256 tokenId) external override view returns(uint256)
    {
        if(tokenId >= _Tokens.length || address(0) == address(_Tokens[tokenId].TokenContract)) return 0;
        return(_Tokens[tokenId].TokenContract.balanceOf(account));
    }

    function retrieveSettings() external override view returns(Library.PaymentTokenStruct[] memory)
    {
        return(_Tokens);
    }

}