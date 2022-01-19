// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.7;

/**
 Uint data type common functionality
 */

import "./Library.sol";

library UintLibrary{
    using Library for *;

    // AUX FUNCTIONALITY /////////////////////////////////////////
    function FindUintPosition(uint value, uint[] memory list) public pure returns (uint)
    {
        for(uint i=0; i < list.length; i++){
            if(value == list[i]) return i;
        }

        return list.length + 1;
    }

    function ProductOfFactors(uint[] memory factors) public pure returns (uint)
    {
        uint result = 1;
         for(uint i=0; i < factors.length; i++){
            result = result * factors[i];
        }

        return result;
    }

    function UintArrayRemoveResize(uint index, uint[] storage array) public 
    {
        array[index] = array[array.length - 1];
        array.pop();
    }

    function UintToBytes32(uint element) public pure returns(bytes32)
    {
        return bytes32(element);
    }

    function Bytes32ToUint(bytes32 element) public pure returns(uint)
    {
        return uint256(element);
    }

}