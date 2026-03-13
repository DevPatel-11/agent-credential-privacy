import { ethers } from 'ethers';
import crypto from 'crypto';

/**
 * PrivacyAgent SDK - Secure credential management for AI agents
 * Implements privacy-preserving authentication using cryptographic commitments
 */
export class PrivacyAgent {
  constructor(contractAddress, provider) {
    this.contractAddress = contractAddress;
    this.provider = provider;
    this.contract = null;
    this.credentials = new Map();
  }

  /**
   * Initialize the SDK with contract ABI
   */
  async init(contractABI) {
    this.contract = new ethers.Contract(
      this.contractAddress,
      contractABI,
      this.provider
    );
  }

  /**
   * Store credentials securely (client-side only, never transmitted)
   * @param {string} service - Service identifier
   * @param {string} credential - The actual credential (password, API key, etc.)
   * @returns {Object} - Commitment hash and metadata
   */
  storeCredential(service, credential) {
    // Hash the credential locally - never send plaintext
    const hash = crypto.createHash('sha256')
      .update(credential + service)
      .digest('hex');
    
    // Store locally (in-memory, could be encrypted local storage)
    this.credentials.set(service, {
      hash: '0x' + hash,
      originalCredential: credential,
      service,
      timestamp: Date.now()
    });

    return {
      commitmentHash: '0x' + hash,
      service,
      timestamp: Date.now()
    };
  }

  /**
   * Register commitment on-chain (only the hash, not the credential)
   * @param {string} service - Service identifier
   * @param {Object} signer - Ethers signer
   * @returns {string} - Commitment ID
   */
  async registerCommitment(service, signer) {
    const credData = this.credentials.get(service);
    if (!credData) {
      throw new Error('Credential not found. Call storeCredential() first.');
    }

    const contractWithSigner = this.contract.connect(signer);
    const tx = await contractWithSigner.registerCommitment(credData.hash);
    const receipt = await tx.wait();

    // Extract commitment ID from event
    const event = receipt.logs.find(log => {
      try {
        return this.contract.interface.parseLog(log).name === 'CommitmentRegistered';
      } catch {
        return false;
      }
    });

    const parsedEvent = this.contract.interface.parseLog(event);
    const commitmentId = parsedEvent.args.commitmentId;

    // Store the commitment ID
    credData.commitmentId = commitmentId;
    this.credentials.set(service, credData);

    return commitmentId;
  }

  /**
   * Verify a credential without revealing it
   * @param {string} service - Service identifier
   * @param {string} providedCredential - Credential to verify
   * @returns {boolean} - Whether the credential matches
   */
  verifyCredential(service, providedCredential) {
    const credData = this.credentials.get(service);
    if (!credData) {
      return false;
    }

    const providedHash = crypto.createHash('sha256')
      .update(providedCredential + service)
      .digest('hex');

    return ('0x' + providedHash) === credData.hash;
  }

  /**
   * Get credential for use (careful - this exposes the plaintext!)
   * @param {string} service - Service identifier
   * @returns {string|null} - The original credential
   */
  getCredential(service) {
    const credData = this.credentials.get(service);
    return credData ? credData.originalCredential : null;
  }

  /**
   * Revoke a commitment on-chain
   * @param {string} commitmentId - The commitment ID to revoke
   * @param {Object} signer - Ethers signer
   */
  async revokeCommitment(commitmentId, signer) {
    const contractWithSigner = this.contract.connect(signer);
    const tx = await contractWithSigner.revokeCommitment(commitmentId);
    await tx.wait();
  }

  /**
   * Clear all stored credentials (e.g., on logout)
   */
  clearAll() {
    this.credentials.clear();
  }
}

export default PrivacyAgent;
