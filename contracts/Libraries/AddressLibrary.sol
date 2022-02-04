// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.7;

/**
 Address data type common functionality
 */

 import "./Library.sol";

library AddressLibrary{
    using Library for *;

    // AUX FUNCTIONALITY /////////////////////////////////////////
    function FindAddress(address add, address[] memory list) public pure returns (bool){
        for(uint i=0; i < list.length; i++){
            if(add == list[i]) return true;
        }

        return false;
    }

    function AddressArrayRemoveResize(uint index, address[] storage array) public 
    {
        array[index] = array[array.length - 1];
        array.pop();
    }

    function AddressToBytes32(address element) public pure returns(bytes32){
        return bytes32(uint256(uint160(element)));
    }

    function Bytes32ToAddress(bytes32 element) public pure returns(address){
        return address(uint160(uint256(element)));
    }

    function UintToAddress(uint element) public pure returns(address){
        return address(uint160(element));
    }

    function AddressToUint(address element) public pure returns(uint){
        return uint256(uint160(element));
    }

}