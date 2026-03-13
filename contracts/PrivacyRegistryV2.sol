// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PrivacyRegistryV2
 * @dev Advanced privacy registry with Merkle tree batch commitments
 * Allows agents to register multiple credentials in a single transaction
 */
contract PrivacyRegistryV2 {
    struct BatchCommitment {
        bytes32 merkleRoot;
        address owner;
        uint256 createdAt;
        bool isActive;
        uint256 count;
    }

    mapping(bytes32 => BatchCommitment) public batchCommitments;
    mapping(address => bytes32[]) public userBatches;
    
    event BatchCommitmentRegistered(
        bytes32 indexed batchId,
        address indexed owner,
        bytes32 merkleRoot,
        uint256 count,
        uint256 timestamp
    );
    
    event BatchCommitmentRevoked(
        bytes32 indexed batchId,
        address indexed owner
    );

    /**
     * @dev Register a batch of commitments using Merkle root
     * @param _merkleRoot Root of the Merkle tree containing all commitments
     * @param _count Number of commitments in the batch
     */
    function registerBatchCommitment(bytes32 _merkleRoot, uint256 _count) 
        external 
        returns (bytes32) 
    {
        bytes32 batchId = keccak256(
            abi.encodePacked(_merkleRoot, msg.sender, block.timestamp)
        );
        
        require(batchCommitments[batchId].createdAt == 0, "Batch already exists");

        batchCommitments[batchId] = BatchCommitment({
            merkleRoot: _merkleRoot,
            owner: msg.sender,
            createdAt: block.timestamp,
            isActive: true,
            count: _count
        });

        userBatches[msg.sender].push(batchId);

        emit BatchCommitmentRegistered(
            batchId,
            msg.sender,
            _merkleRoot,
            _count,
            block.timestamp
        );
        
        return batchId;
    }

    /**
     * @dev Verify a commitment is part of a batch using Merkle proof
     * @param _batchId The batch ID
     * @param _leaf The commitment hash to verify
     * @param _proof Merkle proof array
     */
    function verifyCommitmentInBatch(
        bytes32 _batchId,
        bytes32 _leaf,
        bytes32[] calldata _proof
    ) external view returns (bool) {
        BatchCommitment memory batch = batchCommitments[_batchId];
        require(batch.isActive, "Batch is not active");
        
        return verifyProof(_proof, batch.merkleRoot, _leaf);
    }

    /**
     * @dev Verify Merkle proof
     */
    function verifyProof(
        bytes32[] memory proof,
        bytes32 root,
        bytes32 leaf
    ) internal pure returns (bool) {
        bytes32 computedHash = leaf;

        for (uint256 i = 0; i < proof.length; i++) {
            bytes32 proofElement = proof[i];

            if (computedHash <= proofElement) {
                computedHash = keccak256(
                    abi.encodePacked(computedHash, proofElement)
                );
            } else {
                computedHash = keccak256(
                    abi.encodePacked(proofElement, computedHash)
                );
            }
        }

        return computedHash == root;
    }

    /**
     * @dev Revoke an entire batch of commitments
     */
    function revokeBatchCommitment(bytes32 _batchId) external {
        require(batchCommitments[_batchId].owner == msg.sender, "Not the owner");
        require(batchCommitments[_batchId].isActive, "Already revoked");

        batchCommitments[_batchId].isActive = false;

        emit BatchCommitmentRevoked(_batchId, msg.sender);
    }

    /**
     * @dev Get user's batch IDs
     */
    function getUserBatches(address _user) external view returns (bytes32[] memory) {
        return userBatches[_user];
    }
}
