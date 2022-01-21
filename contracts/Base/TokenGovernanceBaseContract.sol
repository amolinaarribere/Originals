// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.7;

/*
Common functionality for all Contracts which configuration must be managed by Tokens owners
  - Proposition can be added only by token owners with a minimum number of token or the chair person
  - Proposition can be voted for or against only by token owners
  - Proposition have a deadline
  - Proposition that reach the threshold are validated/cancelled
  - Proposition can be cancelled by the creator if not yet validated or cancelled by voters

Proposition LifeTime, minimum number of tokens to propose and threshold percentages are common to all proposition and can be changed as well.

Only one proposition can run at a time.

If tokens are transfered after voting, the new owner cannot use them to vote again.

Functionality (with basic security check)
    - Add Proposition
    - Vote on Proposition
    - Cancel Proposition
  
  Events : 
    - Prop added : id, proposer, deadline, threshold
    - Prop cancelled : id, proposer
    - Prop voted : id, voter, vote, tokens used
    - Prop approved : id, proposer, votes For, votes Against
    - Prop rejected : id, proposer, votes For, votes Against
    - PRop used tokens transfered : id, from, to, tokes used
  
 */

 import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
 import "../Interfaces/ITokenEventSubscriber.sol";
 import "../Libraries/AddressLibrary.sol";
 import "./ManagedBaseContract.sol";
 import "../Interfaces/IPropositionSettings.sol";


abstract contract TokenGovernanceBaseContract is ITokenEventSubscriber, ManagedBaseContract {
    using AddressLibrary for *; 

    // EVENTS /////////////////////////////////////////
    event _AddedProposition(uint256 Id, address indexed Proposer, uint256 Deadline, uint256 Threshold);
    event _CancelledProposition(uint256 Id, address indexed Proposer);
    event _PropositionVote(uint256 Id, address indexed Voter, bool Vote, uint256 AmountTokens);
    event _PropositionApproved(uint256 Id, address indexed Proposer, uint256 VotesFor, uint256 VotesAgainst);
    event _PropositionRejected(uint256 Id, address indexed Proposer, uint256 VotesFor, uint256 VotesAgainst);
    event _UsedTokensTransfered(uint256 indexed Id, address From, address To, uint256 Amount);

    // DATA /////////////////////////////////////////
    // chair person
    address internal _chairperson;

    // Proposition Structure
    struct PropositionStruct{
        uint256 PropID;
        address Proposer;
        uint256 DeadLine;
        uint256 validationThreshold;
        uint256 VotesFor;
        uint256 VotesAgainst;
    }

    PropositionStruct internal _Proposition;

    uint256 internal _nextPropID;

    mapping(uint => mapping(address => uint)) internal _votersPerProp;

    // MODIFIERS /////////////////////////////////////////
    modifier isFromChairPerson(address addr){
        Library.ItIsSomeone(addr, _chairperson);
        _;
    }

    modifier isAuthorizedToPropose(address addr){
        bool isAuthorized = false;
        if(addr == _chairperson) isAuthorized = true;
        else 
        {
            uint numberOfTokens = GetTokensBalance(addr);
            (, , uint256 MinProp) = IPropositionSettings(_managerContract.retrieveTransparentProxies()[uint256(Library.TransparentProxies.PropSettings)]).retrieveSettings();
            if(numberOfTokens > MinProp) isAuthorized = true;
        }

        require(true == isAuthorized, "EC22-");
        _;
    }

    modifier isAuthorizedToCancel(address addr){
        Library.ItIsSomeone(addr, _Proposition.Proposer);
        _;
    }

    modifier canVote(address voter, uint256 id){
        uint votingTokens = GetVotingTokens(voter, id);
        require(votingTokens > 0, "EC23-");
        _;
    }

    modifier PropositionInProgress(bool yesOrno){
        PropositionInProgressFunc(yesOrno);
        _;
    }

    function PropositionInProgressFunc(bool yesOrno) internal {
        if(yesOrno) require(true == CheckIfPropositionActive(), "EC25-");
        else require(false == CheckIfPropositionActive(), "EC24-");
    }

    modifier isFromTokenContract(address addr){
        Library.ItIsSomeone(addr, _managerContract.retrieveTransparentProxies()[uint256(Library.TransparentProxies.Originals)]);
        _;
    }

    // auxiliairy function
    
    function AuthorizedToVote(address addr, uint256 id) internal view returns(bool) {
        uint votingTokens = GetVotingTokens(addr, id);
        return (votingTokens > 0);
    }

    function totalSupply() internal view returns(uint256){
        return IERC20Upgradeable(_managerContract.retrieveTransparentProxies()[uint256(Library.TransparentProxies.Originals)]).totalSupply();
    }

    function GetTokensBalance(address add) internal view returns(uint256){
        return IERC20Upgradeable(_managerContract.retrieveTransparentProxies()[uint256(Library.TransparentProxies.Originals)]).balanceOf(add);
    }

    function GetVotingTokens(address addr, uint id) internal view returns(uint256){
        return (GetTokensBalance(addr) - _votersPerProp[id][addr]);
    }

    function CheckIfPropositionActive() internal returns(bool){
        if(block.timestamp < _Proposition.DeadLine)
        {
            return true;
        }
        else 
        {
            if(address(0) != _Proposition.Proposer){
                propositionExpired();
                InternalCancelProposition();
            } 
            return false;
        }
    }

    // CONSTRUCTOR /////////////////////////////////////////
    function TokenGovernanceContract_init(address chairperson, address managerContractAddress, string memory contractName, string memory contractVersion) internal initializer {
        super.ManagedBaseContract_init(managerContractAddress);
        _chairperson = chairperson;
        _nextPropID = 0; 
    }

    // FUNCTIONALITY /////////////////////////////////////////
    function addProposition() internal
        PropositionInProgress(false)
        isAuthorizedToPropose(msg.sender)
    {
        (uint256 PropLifeTime, uint256 PropThres, ) = IPropositionSettings(_managerContract.retrieveTransparentProxies()[uint256(Library.TransparentProxies.PropSettings)]).retrieveSettings();
        _Proposition.Proposer = msg.sender;
        _Proposition.DeadLine = block.timestamp + PropLifeTime;
        _Proposition.validationThreshold = PropThres;
        _Proposition.PropID = _nextPropID;
        _nextPropID++;

        emit _AddedProposition(_Proposition.PropID, _Proposition.Proposer, _Proposition.DeadLine, _Proposition.validationThreshold);
    }

    function cancelProposition() external
        PropositionInProgress(true)
        isAuthorizedToCancel(msg.sender)
    {
        propositionCancelled();
        InternalCancelProposition();
        emit _CancelledProposition(_Proposition.PropID, _Proposition.Proposer);
    }

    function voteProposition(bool vote) external
    {
        votePropositionInternal(msg.sender, vote);
    }

    function votePropositionInternal(address voter, bool vote) internal
        PropositionInProgress(true)
        canVote(voter, _Proposition.PropID)
    {
        uint VotingTokens = GetVotingTokens(voter, _Proposition.PropID);

        if(vote)
        {
            _Proposition.VotesFor += VotingTokens;
        }
        else
        {
            _Proposition.VotesAgainst += VotingTokens;
        }

        Voted(_Proposition.PropID, voter, VotingTokens);

        emit _PropositionVote(_Proposition.PropID, voter, vote, VotingTokens);

        checkProposition();
    }

    function onTokenBalanceChanged(address from, address to, uint256 amount) external
        isFromTokenContract(msg.sender)
    override
    {
        InternalonTokenBalanceChanged(from, to, amount);
    }

    function InternalonTokenBalanceChanged(address from, address to, uint256 amount) internal virtual
    {
        if(true == CheckIfPropositionActive()) transferVoting(from, to, amount);
    }

    function transferVoting(address from, address to, uint256 amount) internal 
    {
        if(address(0) != from && _votersPerProp[_Proposition.PropID][from] > 0)
        {
            uint256 usedTokenToTransfer = amount;
            if(amount > _votersPerProp[_Proposition.PropID][from]) usedTokenToTransfer = _votersPerProp[_Proposition.PropID][from];

            _votersPerProp[_Proposition.PropID][from] -= usedTokenToTransfer;

            if(address(0) != to)  _votersPerProp[_Proposition.PropID][to] += usedTokenToTransfer;

            emit _UsedTokensTransfered(_Proposition.PropID, from, to, usedTokenToTransfer);
        }
    }

    function Voted(uint256 id, address voter, uint256 votingTokens) internal
    {
        _votersPerProp[id][voter] += votingTokens;
    }

    function checkProposition() internal
    {
        if(_Proposition.VotesFor >= _Proposition.validationThreshold) 
        {
            propositionApproved();
            InternalCancelProposition();
            emit _PropositionApproved(_Proposition.PropID, _Proposition.Proposer, _Proposition.VotesFor, _Proposition.VotesAgainst);
        }
        else if(_Proposition.VotesAgainst >= _Proposition.validationThreshold)
        {
            propositionRejected();
            InternalCancelProposition();
            emit _PropositionRejected(_Proposition.PropID, _Proposition.Proposer, _Proposition.VotesFor, _Proposition.VotesAgainst);
        } 
    }

    function InternalCancelProposition() internal
    {
        delete(_Proposition);
    }

    function retrievePropositionStatus() external view returns(address, uint256, uint256, uint256, uint256){
        return (_Proposition.Proposer,
            _Proposition.DeadLine,
            _Proposition.validationThreshold,
            _Proposition.VotesFor,
            _Proposition.VotesAgainst
        );
    }

    function retrieveVotesForVoter(uint256 PropId, address voter) external view returns(uint256){
        return (_votersPerProp[PropId][voter]);
    }

    function retrieveChairPerson() external view returns(address){
        return _chairperson;
    }

    function retrieveNextPropId() external view returns(uint256){
        return _nextPropID;
    }

    function propositionApproved() internal virtual{}

    function propositionRejected() internal virtual{}

    function propositionExpired() internal virtual{}

    function propositionCancelled() internal virtual{}

}