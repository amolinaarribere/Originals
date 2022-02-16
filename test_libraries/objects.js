function returnUpgradeObject(address_1, address_2, address_3, address_4, address_5, address_6, address_7,
    data_1, data_2, data_3, data_4, data_5, data_6){
        return {
            "TransparentAddresses": [address_1, address_2, address_3, address_4, address_5, address_7],
            "BeaconAddresses": [address_6],
            "TransparentData": [data_1, data_2, data_3, data_4, data_5, data_6]
        };  
}

exports.returnUpgradeObject = returnUpgradeObject;