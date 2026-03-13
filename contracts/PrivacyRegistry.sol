// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract PrivacyRegistry {
    struct Commitment {
        bytes32 commitmentHash;
        address owner;
        uint256 createdAt;
        bool isActive;
        uint256 nonce;
    }

    mapping(bytes32 => Commitment) public commitments;
    mapping(address => bytes32[]) public userCommitments;

    event CommitmentRegistered(bytes32 indexed commitmentId, address indexed owner, uint256 timestamp);
    event CommitmentRevoked(bytes32 indexed commitmentId, address indexed owner);

    function registerCommitment(bytes32 _commitmentHash) external returns (bytes32) {
        bytes32 commitmentId = keccak256(abi.encodePacked(_commitmentHash, msg.sender, block.timestamp));
        
        require(commitments[commitmentId].createdAt == 0, "Commitment already exists");

        commitments[commitmentId] = Commitment({
            commitmentHash: _commitmentHash,
            owner: msg.sender,
            createdAt: block.timestamp,
            isActive: true,
            nonce: userCommitments[msg.sender].length
        });

        userCommitments[msg.sender].push(commitmentId);

        emit CommitmentRegistered(commitmentId, msg.sender, block.timestamp);
        return commitmentId;
    }

    function getCommitment(bytes32 _commitmentId) external view returns (
        bytes32 commitmentHash,
        address owner,
        uint256 createdAt,
        bool isActive,
        uint256 nonce
    ) {
        Commitment memory commitment = commitments[_commitmentId];
        return (
            commitment.commitmentHash,
            commitment.owner,
            commitment.createdAt,
            commitment.isActive,
            commitment.nonce
        );
    }

    function revokeCommitment(bytes32 _commitmentId) external {
        require(commitments[_commitmentId].owner == msg.sender, "Not the owner");
        require(commitments[_commitmentId].isActive, "Already revoked");

        commitments[_commitmentId].isActive = false;

        emit CommitmentRevoked(_commitmentId, msg.sender);
    }

    function getUserCommitments(address _user) external view returns (bytes32[] memory) {
        return userCommitments[_user];
    }
}
