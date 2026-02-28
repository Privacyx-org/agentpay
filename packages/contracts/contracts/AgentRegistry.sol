// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract AgentRegistry is Ownable {
    struct Agent {
        address payout;
        bool active;
        string metadataURI;
        uint64 registeredAt;
        uint64 updatedAt;
    }

    mapping(address => Agent) public agents;

    event AgentRegistered(address indexed agent, address indexed payout, string metadataURI);
    event AgentUpdated(address indexed agent, address indexed payout, bool active, string metadataURI);

    error NotAgent();
    error ZeroAddress();

    constructor() Ownable(msg.sender) {}

    function register(string calldata metadataURI, address payout) external {
        if (payout == address(0)) revert ZeroAddress();
        Agent storage a = agents[msg.sender];

        // first time or re-register
        a.payout = payout;
        a.active = true;
        a.metadataURI = metadataURI;
        if (a.registeredAt == 0) a.registeredAt = uint64(block.timestamp);
        a.updatedAt = uint64(block.timestamp);

        emit AgentRegistered(msg.sender, payout, metadataURI);
    }

    function update(string calldata metadataURI, address payout, bool active) external {
        Agent storage a = agents[msg.sender];
        if (a.registeredAt == 0) revert NotAgent();
        if (payout == address(0)) revert ZeroAddress();

        a.payout = payout;
        a.active = active;
        a.metadataURI = metadataURI;
        a.updatedAt = uint64(block.timestamp);

        emit AgentUpdated(msg.sender, payout, active, metadataURI);
    }

    function setActive(bool active) external {
        Agent storage a = agents[msg.sender];
        if (a.registeredAt == 0) revert NotAgent();

        a.active = active;
        a.updatedAt = uint64(block.timestamp);

        emit AgentUpdated(msg.sender, a.payout, active, a.metadataURI);
    }
}
