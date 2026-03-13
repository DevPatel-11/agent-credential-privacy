import { PrivacyAgent } from './PrivacyAgent.js';
import { ethers } from 'ethers';

/**
 * Example usage of PrivacyAgent SDK
 * This demonstrates how an AI agent can securely manage credentials
 */

async function main() {
  // Setup (in production, use real contract address and provider)
  const contractAddress = '0x...'; // Deploy contract first
  const provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
  
  // Initialize the Privacy Agent
  const agent = new PrivacyAgent(contractAddress, provider);
  await agent.init(CONTRACT_ABI); // Load contract ABI

  // Example 1: Store API key securely
  console.log('=== Storing API Key ===");
  const apiKey = 'sk_live_abc123def456';
  const commitment = agent.storeCredential('openai', apiKey);
  console.log('Commitment hash:', commitment.commitmentHash);
  console.log('Original key never leaves the client!');

  // Example 2: Register commitment on-chain (with a wallet)
  console.log('\n=== Registering On-Chain ===');
  const wallet = new ethers.Wallet('PRIVATE_KEY', provider);
  const commitmentId = await agent.registerCommitment('openai', wallet);
  console.log('Commitment ID:', commitmentId);
  console.log('Only the hash is on-chain, not the API key!');

  // Example 3: Verify credential without exposing it
  console.log('\n=== Verifying Credential ===');
  const isValid = agent.verifyCredential('openai', 'sk_live_abc123def456');
  console.log('Credential valid:', isValid);

  const isInvalid = agent.verifyCredential('openai', 'wrong_key');
  console.log('Wrong credential valid:', isInvalid);

  // Example 4: Use the credential (when actually needed)
  console.log('\n=== Using Credential ===');
  const key = agent.getCredential('openai');
  // Use key to make API call...
  console.log('Retrieved key (use carefully!):', key.substring(0, 10) + '...');

  // Example 5: Revoke a commitment
  console.log('\n=== Revoking Commitment ===');
  await agent.revokeCommitment(commitmentId, wallet);
  console.log('Commitment revoked on-chain');

  // Example 6: Clear all credentials
  console.log('\n=== Clearing All ===');
  agent.clearAll();
  console.log('All local credentials cleared');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
