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

    // EVENTS /////////////////////////////////////////
    event _NewAddresses(address[] TokenAddresses);

    // DATA /////////////////////////////////////////
    mapping(uint256 => IERC20) internal _TokenContracts;
    uint256[] internal _TokenContractsId;
    uint256 internal _lastTokenContractId;
    //IERC20 internal _TokenContract;

    // MODIFIERS /////////////////////////////////////////
    modifier areAddressesOK(bytes[] memory NewValues)
    {
        if(NewValues.length > _TokenContractsId.length){
            for(uint256 i=0; i < NewValues.length; i++){
                require(address(0) != AddressLibrary.Bytes32ToAddress(Library.BytestoBytes32(NewValues[i])[0]), "EC21-");
            }
        }
        else{
            require(NewValues.length > 0, "At least one token address must be provided");
            require(address(0) != AddressLibrary.Bytes32ToAddress(Library.BytestoBytes32(NewValues[0])[0]), "EC21-");
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
        require(tokenId < _TokenContractsId.length, "this token Id does not have a corresponding Token address");
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
        uint256[] memory idsToRemove = new uint256[](_TokenContractsId.length);
        uint256 lastId;

        for(uint256 i=0; i < _TokenContractsId.length; i++){
            if(i < tokenAddresses.length && address(0) != tokenAddresses[i]) _TokenContracts[_TokenContractsId[i]] = IERC20(tokenAddresses[i]);
            else delete(_TokenContracts[_TokenContractsId[i]]);
            if(address(0) == address(_TokenContracts[_TokenContractsId[i]])){
                idsToRemove[lastId] = i;
                lastId++;
            }
        }

        for(uint256 k=_TokenContractsId.length; k < tokenAddresses.length; k++){
            _TokenContractsId.push(_lastTokenContractId);
            _TokenContracts[_lastTokenContractId] = IERC20(tokenAddresses[k]);
            _lastTokenContractId++;
        }

        for(uint256 j=0; j < lastId; j++){
            UintLibrary.UintArrayRemoveResize(idsToRemove[j], _TokenContractsId);
        }

    }

    // FUNCTIONALITY /////////////////////////////////////////
    function TransferFrom(address sender, address recipient, uint256 amount, uint256 MarketId, bytes memory data, uint256 tokenId) external override
        isFromCertifiedContract(msg.sender, MarketId)
        isTokenIdOK(tokenId)
    {
        require(_TokenContracts[_TokenContractsId[tokenId]].allowance(sender, address(this)) >= amount, "Contract does not have enough approved funds");
        bool success = _TokenContracts[_TokenContractsId[tokenId]].transferFrom(sender, recipient, amount);
        require(true == success, "Transfer From did not work");
        ICreditor(recipient).CreditReceived(sender, amount, data);
    }

    function BalanceOf(address account, uint256 tokenId) external override view returns(uint256)
    {
        if(tokenId >= _TokenContractsId.length) return 0;
        return(_TokenContracts[_TokenContractsId[tokenId]].balanceOf(account));
    }

    function retrieveSettings() external override view returns(address[] memory)
    {
        address[] memory tokenAddresses = new address[](_TokenContractsId.length);
        for(uint256 i=0; i < _TokenContractsId.length; i++){
            tokenAddresses[i] = address(_TokenContracts[_TokenContractsId[i]]);
        }
        return(tokenAddresses);
    }

}