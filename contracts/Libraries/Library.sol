// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.7;

/*
Common functionality for all contracts and libraries
*/

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";


library Library{

    // DATA /////////////////////////////////////////
    // enum
    enum PaymentPlans{Minting, TransferFee}
    enum Fees{NewIssuerFee, AdminNewIssuerFee, MintingFee, AdminMintingFee}
    enum TransferFees{TransferFeeAmount, TransferFeeDecimals, AdminTransferFeeAmount, AdminTransferFeeDecimals}
    enum OffersSettings{OffersLifeTime}
    enum TransparentProxies{Manager, PublicPool, Treasury, Originals, PropSettings, AdminPiggyBank, Payments}
    enum Beacons{NFT}
    enum PublicPoolPaymentTypes{SendCredit, TransferUnassignedCredit}


    // Structures
    // Certificate Manager
    struct ProposedContractsStruct{
        address[] TransparentAddresses;
        address[] BeaconAddresses;
        bytes[] TransparentData;
    }

    struct PaymentTokenStruct{
        IERC20 TokenContract;
        bool active;
    }

    struct NewPaymentTokenStruct{
        address TokenContractAddress;
        uint256 index;
    }

    // FUNCTIONALITY /////////////////////////////////////////
    function validFees(uint256 fee, uint256 decimals) public pure{
      require(fee <= 100 * 10**decimals, "fees cannot be larger than 100 percent");
    }

    function IdCorrect(uint Id, uint length) public pure{
        require(length > Id, "EC1-");
    }

    function ItIsSomeone(address addr, address someone) public pure{
        require(someone == addr, "EC8-");
    }

    function ArrayRemoveResize(uint index, bytes32[] storage array) public 
    {
        IdCorrect(index, array.length);
        array[index] = array[array.length - 1];
        array.pop();
    }

    function Bytes32ArrayToString(bytes32[] memory element) public pure returns(string memory){
        return string(abi.encodePacked(element));
    }

    function Bytes32ArrayToBytes(bytes32[] memory element) public pure returns(bytes memory){
        return abi.encodePacked(element);
    }

    function BytestoBytes32(bytes memory _b) public pure returns(bytes32[] memory){
        uint num = _b.length / 32;
        bytes32[] memory result = new bytes32[](num + 1);
        uint t = 0;
        
        for(uint i=0; i<_b.length; i = i + 32){
            bytes32 r;
            uint p = i + 32;
             assembly {
                r := mload(add(_b, p))
            }
            result[t] = r;
            t += 1;
        }
       
        return result;
    }

    function Bytes32toBytes(bytes32 _b) public pure returns(bytes memory){
        return abi.encodePacked(_b);
    }
    
}