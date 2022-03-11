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
    event _NewAddresses(uint[] index, address[] TokenAddresses);

    // DATA /////////////////////////////////////////
    Library.PaymentTokenStruct[] _Tokens;

    // MODIFIERS /////////////////////////////////////////
    modifier areAddressesOK(bytes[] memory NewValues)
    {
        require(NewValues.length % 2 == 0, "For each address and index must be provided");
        _;
    }

    modifier isFromCertifiedContract(address addr, uint256 id)
    {
        require(
            addr == _managerContract.retrieveTransparentProxies()[uint256(Library.TransparentProxies.PublicPool)] || 
            addr == _managerContract.retrieveTransparentProxies()[uint256(Library.TransparentProxies.Treasury)] || 
            addr == _managerContract.retrieveTransparentProxies()[uint256(Library.TransparentProxies.AdminPiggyBank)] || 
            addr == _managerContract.retrieveTransparentProxies()[uint256(Library.TransparentProxies.MarketsCredits)] || 
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

        Library.NewPaymentTokenStruct[] memory initTokenAddresses = new Library.NewPaymentTokenStruct[](tokenAddresses.length);

        for(uint i=0; i < tokenAddresses.length; i++){
            initTokenAddresses[i].index = i;
            initTokenAddresses[i].TokenContractAddress = tokenAddresses[i];
        }

        InternalupdateSettings(initTokenAddresses);
    }

    // GOVERNANCE /////////////////////////////////////////
    function checkProposition(bytes[] memory NewValues) internal override 
        areAddressesOK(NewValues)
    {}

    function UpdateAll() internal override
    {
        bytes32[] memory ProposedNewValues = PropositionsToBytes32();
        Library.NewPaymentTokenStruct[] memory newTokenAddresses = new Library.NewPaymentTokenStruct[](ProposedNewValues.length / 2);
        address[] memory NewAddresses = new address[](ProposedNewValues.length / 2);
        uint256[] memory Indexes = new uint256[](ProposedNewValues.length / 2);

        for(uint256 i=0; i < newTokenAddresses.length; i++){
            Indexes[i] = UintLibrary.Bytes32ToUint(ProposedNewValues[2 * i]);
            NewAddresses[i] = AddressLibrary.Bytes32ToAddress(ProposedNewValues[(2 * i) + 1]);
            newTokenAddresses[i].index = Indexes[i];
            newTokenAddresses[i].TokenContractAddress = NewAddresses[i];
        }

        InternalupdateSettings(newTokenAddresses);
        emit _NewAddresses(Indexes, NewAddresses);
    }

    function InternalupdateSettings(Library.NewPaymentTokenStruct[] memory tokenAddresses) internal
    {
        for(uint256 i=0; i < tokenAddresses.length; i++){
            if(tokenAddresses[i].index < _Tokens.length){
                if(address(0) != tokenAddresses[i].TokenContractAddress){
                    _Tokens[tokenAddresses[i].index].TokenContract =  IERC20(tokenAddresses[i].TokenContractAddress);
                    if(!_Tokens[tokenAddresses[i].index].active)_Tokens[tokenAddresses[i].index].active =  true;
                } 
                else {
                    if(_Tokens[tokenAddresses[i].index].active)_Tokens[tokenAddresses[i].index].active = false;
                }
            }
            else{
                if(address(0) != tokenAddresses[i].TokenContractAddress){
                    Library.PaymentTokenStruct memory newToken = Library.PaymentTokenStruct(IERC20(tokenAddresses[i].TokenContractAddress), true);
                    _Tokens.push(newToken);
                }
                
            }
        }
    }

    // FUNCTIONALITY /////////////////////////////////////////
    function TransferFrom(address sender, address recipient, uint256 amount, uint256 MarketId, bytes memory data, uint256 tokenId) external override
        isTokenIdOK(tokenId)
        isFromCertifiedContract(msg.sender, MarketId)
    {
        require(_Tokens[tokenId].TokenContract.allowance(sender, address(this)) >= amount, "Contract does not have enough approved funds");
        bool success = _Tokens[tokenId].TokenContract.transferFrom(sender, recipient, amount);
        require(true == success, "Transfer From did not work");
        ICreditor(recipient).CreditReceived(sender, amount, tokenId, data);
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