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

function returnTokenPriceObject(paymentTokenID, price, enabled){
    return {
        "_paymentTokenID": paymentTokenID,
        "_price": price,
        "_enabled": enabled
    };  
}

function returnSubmitOfferObject(tokenId, bidder, offer, FromCredit, paymentTokenID){
    return {
        "_tokenId": tokenId,
        "_bidder": bidder,
        "_offer": offer,
        "_FromCredit": FromCredit,
        "_paymentTokenID": paymentTokenID
    };  
}

function returnArrayTokenPriceObject(paymentTokenIDs, prices, enableds){
    let array = []
    for(let i=0; i < paymentTokenIDs.length; i++){
        array[i] = returnTokenPriceObject(paymentTokenIDs[i], prices[i], enableds[i]);
    }
    return array;  
}



exports.returnUpgradeObject = returnUpgradeObject;
exports.returnIssuerObject = returnIssuerObject;
exports.returnNewPaymentsObject = returnNewPaymentsObject;
exports.returnArrayTokenPriceObject = returnArrayTokenPriceObject;
exports.returnSubmitOfferObject = returnSubmitOfferObject;