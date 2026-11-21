import { createClient, chains } from 'genlayer-js';
import * as fs from 'fs';
import * as path from 'path';

const client = createClient({ chain: chains.studionet });

async function main() {
  const proofPath = path.resolve('deploy', 'proof.json');
  const proof = JSON.parse(fs.readFileSync(proofPath, 'utf8'));
  const address = proof.contract && proof.contract.address;

  if (!address) {
    console.error("deploy/proof.json has no contract.address yet.");
    process.exit(1);
  }

  console.log(`Reading PromiseCheck at ${address}`);

  const total = await client.readContract({
    address,
    functionName: 'get_total_promises',
    args: []
  });
  console.log(`Total promises: ${total}`);

  for (const tx of proof.transactions || []) {
    if (tx.promise_id === undefined || tx.promise_id === null) {
      continue;
    }

    const status = await client.readContract({
      address,
      functionName: 'get_promise_status',
      args: [tx.promise_id]
    });
    const raw = await client.readContract({
      address,
      functionName: 'get_promise',
      args: [tx.promise_id]
    });

    console.log(`\nPromise ${tx.promise_id}: status=${status}`);
    console.log(raw);
  }
}

main().catch(err => {
  console.error("Verify failed:", err);
  process.exit(1);
});
