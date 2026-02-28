// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract TaskEscrow is Ownable {
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    enum Status {
        None,
        Created,
        Funded,
        Released,
        Refunded
    }

    struct Task {
        address client;
        address agent;
        address token;
        uint256 amount;
        uint64 deadline;
        Status status;
        string metadataURI;
    }

    uint256 public nextTaskId;
    address public treasury;
    uint16 public feeBps;
    address public attestor;
    mapping(uint256 => bytes32) public taskResultHash;

    mapping(uint256 => Task) public tasks;

    event TaskCreated(
        uint256 indexed taskId,
        address indexed client,
        address indexed agent,
        address token,
        uint256 amount,
        uint64 deadline,
        string metadataURI
    );

    event TaskFunded(uint256 indexed taskId);
    event TaskReleased(uint256 indexed taskId, uint256 agentAmount, uint256 feeAmount);
    event TaskRefunded(uint256 indexed taskId);
    event TaskReleasedWithAttestation(uint256 indexed taskId, bytes32 indexed resultHash);

    error InvalidParams();
    error NotClient();
    error WrongStatus();
    error DeadlineNotPassed();
    error ZeroAddress();
    error InvalidSignature();
    error AttestationExpired();

    constructor(address _treasury, uint16 _feeBps) Ownable(msg.sender) {
        if (_treasury == address(0)) revert ZeroAddress();
        if (_feeBps > 1000) revert InvalidParams();
        treasury = _treasury;
        feeBps = _feeBps;
        nextTaskId = 1;
        attestor = msg.sender;
    }

    function setTreasury(address _treasury) external onlyOwner {
        if (_treasury == address(0)) revert ZeroAddress();
        treasury = _treasury;
    }

    function setFeeBps(uint16 _feeBps) external onlyOwner {
        if (_feeBps > 1000) revert InvalidParams();
        feeBps = _feeBps;
    }

    function setAttestor(address _attestor) external onlyOwner {
        if (_attestor == address(0)) revert ZeroAddress();
        attestor = _attestor;
    }

    function createTask(
        address agent,
        address token,
        uint256 amount,
        uint64 deadline,
        string calldata metadataURI
    ) external returns (uint256 taskId) {
        if (agent == address(0) || token == address(0)) revert ZeroAddress();
        if (amount == 0 || deadline <= block.timestamp) revert InvalidParams();

        taskId = nextTaskId++;
        tasks[taskId] = Task({
            client: msg.sender,
            agent: agent,
            token: token,
            amount: amount,
            deadline: deadline,
            status: Status.Created,
            metadataURI: metadataURI
        });

        emit TaskCreated(taskId, msg.sender, agent, token, amount, deadline, metadataURI);
    }

    function fundTask(uint256 taskId) external {
        Task storage t = tasks[taskId];
        if (t.status != Status.Created) revert WrongStatus();
        if (msg.sender != t.client) revert NotClient();

        t.status = Status.Funded;
        IERC20(t.token).safeTransferFrom(t.client, address(this), t.amount);

        emit TaskFunded(taskId);
    }

    function release(uint256 taskId) external {
        Task storage t = tasks[taskId];
        if (t.status != Status.Funded) revert WrongStatus();
        if (msg.sender != t.client) revert NotClient();

        t.status = Status.Released;

        uint256 feeAmount = (t.amount * feeBps) / 10_000;
        uint256 agentAmount = t.amount - feeAmount;

        if (feeAmount > 0) IERC20(t.token).safeTransfer(treasury, feeAmount);
        IERC20(t.token).safeTransfer(t.agent, agentAmount);

        emit TaskReleased(taskId, agentAmount, feeAmount);
    }

    function refund(uint256 taskId) external {
        Task storage t = tasks[taskId];
        if (t.status != Status.Funded) revert WrongStatus();
        if (msg.sender != t.client) revert NotClient();
        if (block.timestamp < t.deadline) revert DeadlineNotPassed();

        t.status = Status.Refunded;
        IERC20(t.token).safeTransfer(t.client, t.amount);

        emit TaskRefunded(taskId);
    }

    function releaseWithAttestation(
        uint256 taskId,
        bytes32 resultHash,
        uint64 validUntil,
        bytes calldata signature
    ) external {
        Task storage t = tasks[taskId];
        if (t.status != Status.Funded) revert WrongStatus();

        // signature must be from attestor
        if (validUntil < block.timestamp) revert AttestationExpired();

        bytes32 messageHash = keccak256(
            abi.encodePacked(
                "AGENTPAY_TASK_ATTESTATION:",
                block.chainid,
                address(this),
                taskId,
                t.client,
                t.agent,
                resultHash,
                validUntil
            )
        );

        bytes32 digest = messageHash.toEthSignedMessageHash();

        address recovered = digest.recover(signature);
        if (recovered != attestor) revert InvalidSignature();

        // execute release (same economics as release())
        t.status = Status.Released;

        taskResultHash[taskId] = resultHash;

        uint256 feeAmount = (t.amount * feeBps) / 10_000;
        uint256 agentAmount = t.amount - feeAmount;

        if (feeAmount > 0) IERC20(t.token).safeTransfer(treasury, feeAmount);
        IERC20(t.token).safeTransfer(t.agent, agentAmount);

        emit TaskReleased(taskId, agentAmount, feeAmount);
        emit TaskReleasedWithAttestation(taskId, resultHash);
    }
}
