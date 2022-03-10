function returnUpgradeObject(address_1, address_2, data){
        return {
            "TransparentAddresses": address_1,
            "BeaconAddresses": address_2,
            "TransparentData": data
        };  
}

function returnIssuerObject(owner, name, symbol, feeAmount, feeDecimals, paymentPlan){
        return {
            "_owner": owner,
            "_name": name,
            "_symbol": symbol,
            "_feeAmount": feeAmount,
            "_feeDecimals": feeDecimals,
            "_paymentPlan": paymentPlan
        };  
}

function returnNewPaymentsObject(index, address){
    return {
        "TokenContractAddress": address,
        "index": index
    };  
}

exports.returnUpgradeObject = returnUpgradeObject;
exports.returnIssuerObject = returnIssuerObject;
exports.returnNewPaymentsObject = returnNewPaymentsObject;