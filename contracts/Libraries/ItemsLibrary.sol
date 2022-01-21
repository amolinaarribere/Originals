// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.7;

/*
Common functionality for all Items
  Items -> Certificate & Entities(Owners & Providers & Pools)
    Item Identity : 
       - activated : Item is activated (true/false)
       - info : Item info
       - id : Item id (only is item is activated)
       - pendingId : Item id in activation/deletion pending list (only if item is been added or removed)
       - validations[] : List of address that validated the item (accepted its activation or deletion)
       - rejections[] : List of address that rejected the item (rejected its activation or deletion)
    Items structure:
        - mapping bytes32 to Item identity
        - List of currently activated items (id -> to reference from item identity)
        - List of currently pending Items to be activated (pendingId -> to reference from item identity)
        - List of currently pending Items to be deleted (pendingId -> to reference from item identity)

Functionality (with basic security check)
    - Add Item
    - Remove Item
    - Validate Item creation/removal
    - Reject Item creation/removal
  
  Events : 
  Item Type(string) - Item(bytes32) - Item info(string)
    - Item activation validated
    - Item activation rejected
    - Item deletion validated
    - Item deletion rejected
  
 */

import "./Library.sol";
import "../Libraries/AddressLibrary.sol";

library ItemsLibrary{
    using AddressLibrary for *;
    using Library for *;

    // EVENTS /////////////////////////////////////////
    event _AddItemValidation(string ItemType,  bytes32 indexed Item,  string Info);
    event _RemoveItemValidation(string ItemType,  bytes32 indexed Item,  string Info);
    event _AddItemRejection(string ItemType,  bytes32 indexed Item,  string Info);
    event _RemoveItemRejection( string ItemType,  bytes32 indexed Item,  string Info);

    // FUNCTIONS for MODIFIERS /////////////////////////////////////////
    function ItemNotActivated(bytes32 item, _ItemsStruct storage itemStruct) public view {
        require(false == isItem(item, itemStruct), "EC6-");
    }

    function ItemActivated(bytes32 item, _ItemsStruct storage itemStruct) public view {
        require(true == isItem(item, itemStruct), "EC7-");
    }

    function ItemNotPending(bytes32 item, _ItemsStruct storage itemStruct) public view{
        require(false == isItemPendingToAdded(item, itemStruct) && 
                false == isItemPendingToRemoved(item, itemStruct), "EC27-");
    }

    function ItemPending(bytes32 item, _ItemsStruct storage itemStruct) public view{
        require(true == isItemPendingToAdded(item, itemStruct) ||
                true == isItemPendingToRemoved(item, itemStruct), "EC28-");
    }

    function HasNotAlreadyVoted(address addr, bytes32 item, _ItemsStruct storage itemStruct) public view{
        require(false == hasVoted(addr, item, itemStruct), "EC5-");
    }
    
    // DATA /////////////////////////////////////////
    struct _issuerStruct{
        address owner;
        string name;
        string symbol;
        Library.PaymentPlans paymentPlan;
    }

    struct _pendingIssuerStruct{
        _issuerStruct issuer;
        address[] _Validations;
        address[] _Rejections;
    }

    struct _offerStruct{
        uint256 offer;
        address sender;
        address bidder;
        uint256 deadline; 
    }
    
    struct _itemIdentity{
        string _Info;
        bool _activated;
        uint _id;
        uint _pendingId;
        address[] _Validations;
        address[] _Rejections;
    }

    struct _ItemsStruct{
        mapping(bytes32 => _itemIdentity) _items;
        bytes32[] _activatedItems;
        bytes32[] _pendingItemsAdd;
        bytes32[] _pendingItemsRemove;
    }

    // structured used as input parameter for CRUD functions
    struct _manipulateItemStruct{
        bytes32 item;
        string info;
        uint256 _minSignatures;
        string ItemTypeLabel; // Certificate, owner, provider, pool
        uint[] ids; // Ids that will be returned to callback when item activation/deletion has been validated/rejected 
    }

    
    // AUX FUNCTIONALITY /////////////////////////////////////////
    function CheckValidations(uint256 signatures, uint256 minSignatures) public pure returns(bool){
        if(signatures < minSignatures) return false;
        return true;
    }

    function ReturnManipulateStructContent(_manipulateItemStruct memory manipulateItemstruct) public pure returns(bytes32, uint, string memory, uint[] memory)
    {
        return(manipulateItemstruct.item,
         manipulateItemstruct._minSignatures,
         manipulateItemstruct.ItemTypeLabel,
         manipulateItemstruct.ids);
    }

    function deleteVoters(bytes32 item, _ItemsStruct storage itemStruct) public{
        delete(itemStruct._items[item]._Rejections);
        delete(itemStruct._items[item]._Validations);
        itemStruct._items[item]._pendingId = 0;
    }

    // Remove Item from array and resize (not keeping order) it reindexing the item that was moved
    function RemoveResizePending(bool addOrRemove, bytes32 item, _ItemsStruct storage itemStruct) public
    {
        bytes32[] storage arrayToRemoveResize = (addOrRemove)? itemStruct._pendingItemsAdd : itemStruct._pendingItemsRemove;
        uint position = itemStruct._items[item]._pendingId;

        Library.ArrayRemoveResize(position, arrayToRemoveResize);

        if(position < arrayToRemoveResize.length){
            bytes32 ItemMoved = arrayToRemoveResize[position];
            itemStruct._items[ItemMoved]._pendingId = position;
        }

    }

    function RemoveResizeActivated(bytes32 item, _ItemsStruct storage itemStruct) public
    {
        bytes32[] storage arrayToRemoveResize = itemStruct._activatedItems;
        uint position = itemStruct._items[item]._id;

        Library.ArrayRemoveResize(position, arrayToRemoveResize);

        if(position < arrayToRemoveResize.length){
            bytes32 ItemMoved = arrayToRemoveResize[position];
            itemStruct._items[ItemMoved]._id = position;
        }

    }

    // MAIN FUNCTIONALITY /////////////////////////////////////////
    function addItem(_manipulateItemStruct memory manipulateItemstruct, _ItemsStruct storage itemStruct, address callerContract) public
    {
        ItemNotActivated(manipulateItemstruct.item, itemStruct);
        ItemNotPending(manipulateItemstruct.item, itemStruct);

        bytes32 item = manipulateItemstruct.item;
        string memory info = manipulateItemstruct.info;

        itemStruct._items[item]._Info = info;
        itemStruct._pendingItemsAdd.push(item);
        itemStruct._items[item]._pendingId = itemStruct._pendingItemsAdd.length - 1;
        
        validateItem(manipulateItemstruct, itemStruct, callerContract);
    }
     
    function removeItem(_manipulateItemStruct memory manipulateItemstruct, _ItemsStruct storage itemStruct, address callerContract) public
    {
        ItemActivated(manipulateItemstruct.item, itemStruct);
        ItemNotPending(manipulateItemstruct.item, itemStruct);

        bytes32 item = manipulateItemstruct.item;

        itemStruct._pendingItemsRemove.push(item);
        itemStruct._items[item]._pendingId = itemStruct._pendingItemsRemove.length - 1;

        validateItem(manipulateItemstruct, itemStruct, callerContract);
    }

    function validateItem(_manipulateItemStruct memory manipulateItemstruct, _ItemsStruct storage itemStruct, address callerContract) public
    {
        ItemPending(manipulateItemstruct.item, itemStruct);
        HasNotAlreadyVoted(msg.sender, manipulateItemstruct.item, itemStruct);

        (bytes32 item, uint _minSignatures, string memory ItemTypeLabel, uint[] memory ids) = ReturnManipulateStructContent(manipulateItemstruct);

        itemStruct._items[item]._Validations.push(msg.sender);

        if(CheckValidations(itemStruct._items[item]._Validations.length, _minSignatures))
        {
            if(isItemPendingToAdded(item, itemStruct))
            {
                itemStruct._items[item]._activated = true; 
                itemStruct._activatedItems.push(item);
                itemStruct._items[item]._id = itemStruct._activatedItems.length - 1;

                RemoveResizePending(true, item, itemStruct);

                (bool success, bytes memory data) = callerContract.call(abi.encodeWithSignature("onItemValidated(bytes32,uint256[],bool)", item, ids, true));
                require(success, string(data));
                
                deleteVoters(item, itemStruct);
                emit _AddItemValidation(ItemTypeLabel, item, itemStruct._items[item]._Info);
            }
            else{
                RemoveResizeActivated(item, itemStruct);
                RemoveResizePending(false, item, itemStruct);

                (bool success, bytes memory data) = callerContract.call(abi.encodeWithSignature("onItemValidated(bytes32,uint256[],bool)", item, ids, false));
                require(success, string(data));

                emit _RemoveItemValidation(ItemTypeLabel, item, itemStruct._items[item]._Info);
                delete(itemStruct._items[item]);
            }   
        }
    }

    function rejectItem(_manipulateItemStruct memory manipulateItemstruct, _ItemsStruct storage itemStruct, address callerContract) public
    {
        ItemPending(manipulateItemstruct.item, itemStruct);
        HasNotAlreadyVoted(msg.sender, manipulateItemstruct.item, itemStruct);

        (bytes32 item, uint _minSignatures, string memory ItemTypeLabel, uint[] memory ids) = ReturnManipulateStructContent(manipulateItemstruct);

        itemStruct._items[item]._Rejections.push(msg.sender);

        if(CheckValidations(itemStruct._items[item]._Rejections.length, _minSignatures))
        {

            if(isItemPendingToAdded(item, itemStruct))
            {
                RemoveResizePending(true, item, itemStruct);

                (bool success, bytes memory data) = callerContract.call(abi.encodeWithSignature("onItemRejected(bytes32,uint256[],bool)", item, ids, true)); 
                require(success, string(data));

                emit _AddItemRejection(ItemTypeLabel, item, itemStruct._items[item]._Info);
                delete(itemStruct._items[item]);
            }
            else
            {
                RemoveResizePending(false, item, itemStruct);

                (bool success, bytes memory data) = callerContract.call(abi.encodeWithSignature("onItemRejected(bytes32,uint256[],bool)", item, ids, false));
                require(success, string(data));

                deleteVoters(item, itemStruct);
                emit _RemoveItemRejection(ItemTypeLabel, item, itemStruct._items[item]._Info);
            }
                
        }
    }


    // READ Data

    function isItem(bytes32 item, _ItemsStruct storage itemStruct) public view returns(bool){
        return itemStruct._items[item]._activated;
    }

    function isItemPendingToAdded(bytes32 item, _ItemsStruct storage itemStruct) public view returns(bool)
    {
        if(itemStruct._pendingItemsAdd.length > itemStruct._items[item]._pendingId){
            if(item == itemStruct._pendingItemsAdd[itemStruct._items[item]._pendingId]) return true;
        }
        return false;
    }

    function isItemPendingToRemoved(bytes32 item, _ItemsStruct storage itemStruct) public view returns(bool)
    {
        if(itemStruct._pendingItemsRemove.length > itemStruct._items[item]._pendingId){
            if(item == itemStruct._pendingItemsRemove[itemStruct._items[item]._pendingId]) return true;
        }
        return false;
    }

    function retrievePendingItems(bool addORemove, _ItemsStruct storage itemStruct) public view returns (bytes32[] memory)
    {
        bytes32[] memory Items;

        if(addORemove) Items = itemStruct._pendingItemsAdd;
        else Items = itemStruct._pendingItemsRemove;
        
        return Items;
    }

    function retrieveItem(bytes32 item, _ItemsStruct storage itemStruct) public view returns (_itemIdentity memory) 
    {
        return (itemStruct._items[item]);
    }

    function retrieveAllItems(_ItemsStruct storage itemStruct) public view returns (bytes32[] memory) 
    {
        return itemStruct._activatedItems;
    }

    function hasVoted(address add, bytes32 item, _ItemsStruct storage itemStruct) public view returns (bool) 
    {
        return (AddressLibrary.FindAddress(add, itemStruct._items[item]._Validations) ||
                AddressLibrary.FindAddress(add, itemStruct._items[item]._Rejections));
    }

}