import { createClient, createAccount, chains } from 'genlayer-js';
import * as fs from 'fs';
import * as path from 'path';

const PK_FILE = process.env.GENLAYER_PK_FILE || path.resolve('deployer_pk.json');
const { privateKey } = JSON.parse(fs.readFileSync(PK_FILE, 'utf8'));
const account = createAccount(privateKey);

const client = createClient({
  chain: chains.studionet,
  account
});

async function main() {
  console.log("=== Deploying PromiseCheck to GenLayer StudioNet ===");
  console.log(`Deployer Address: ${account.address}`);

  const contractPath = path.resolve('contracts', 'promise_check.py');
  const code = fs.readFileSync(contractPath, 'utf-8');

  console.log("Broadcasting deployment transaction to StudioNet...");
  const txHash = await client.deployContract({
    code,
    args: [],
    leaderOnly: false
  });

  console.log(`Deployment Tx broadcast: ${txHash}`);
  console.log("Waiting for validator committee consensus on StudioNet (Chain ID 61999)...");

  const receipt = await client.waitForTransactionReceipt({
    hash: txHash,
    status: 'ACCEPTED',
    retries: 45,
    interval: 4000
  });

  const contractAddress = receipt.contract_address || receipt.contractAddress;
  console.log(`SUCCESS! PromiseCheck deployed at: ${contractAddress}`);

  const deployRecord = {
    contract: "PromiseCheck",
    address: contractAddress,
    deployTx: txHash,
    deployer: account.address,
    network: "GenLayer StudioNet",
    chainId: 61999,
    explorerUrl: `https://explorer-studio.genlayer.com/address/${contractAddress}`,
    txExplorerUrl: `https://explorer-studio.genlayer.com/tx/${txHash}`,
    timestamp: new Date().toISOString()
  };

  fs.mkdirSync(path.resolve('deploy'), { recursive: true });
  fs.writeFileSync(
    path.resolve('deploy', 'deployment.json'),
    JSON.stringify(deployRecord, null, 2)
  );
  console.log("Saved deploy/deployment.json");
}

main().catch(err => {
  console.error("Deployment failed:", err);
  process.exit(1);
});
