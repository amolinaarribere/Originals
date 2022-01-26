function Bytes32ToAddress(bytes){
    return ("0x" + (bytes.toString()).substring(26));
}

function AddressToBytes32(address){
    return ("0x000000000000000000000000" + (address.toString()).substring(2));
}

function Bytes32ToInt(bytes){
    return parseInt(bytes, 16);
}

function IntToBytes32(value){
    let returnValue = "0x";
    let valueHex = parseInt(value).toString(16);
    for(let i=0; i < 64 - valueHex.length; i++){
        returnValue = returnValue + "0";
    }
    returnValue = returnValue + valueHex;
    return returnValue;
}

function StringToBytes(str) {
    return web3.utils.asciiToHex(str);
}

function BytesToString(bytes) {
    return web3.utils.hexToAscii(bytes);
}

exports.AddressToBytes32 = AddressToBytes32;
exports.Bytes32ToAddress = Bytes32ToAddress;
exports.IntToBytes32 = IntToBytes32;
exports.Bytes32ToInt = Bytes32ToInt;
exports.StringToBytes = StringToBytes;
exports.BytesToString = BytesToString;
