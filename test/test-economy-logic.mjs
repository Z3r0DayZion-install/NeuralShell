import { GlobalLedger } from '../src/economy/ledger.js';
import { GenesisAgent } from '../src/agents/genesisAgent.js';

async function testEconomy() {
  console.log('--- Testing Hive Economy Logic ---');

  // 1. Setup Wallet
  const user = 'test-user-01';
  GlobalLedger.createWallet(user, 50); // Give 50 NC
  console.log(`Created wallet for ${user} with 50 NC`);

  const genesis = new GenesisAgent();

  // 2. Test Success (Affordable App)
  console.log('\n--- Scenario 1: Affordable App ---');
  try {
    const prompt = 'Simple Hello World'; // Short prompt = cheap
    console.log(`Requesting: "${prompt}"`);

    // Mock the deployment parts since we don't have Docker here
    genesis.containerManager.deploy = async () => ({ id: 'mock-1', name: 'mock-app', url: 'http://mock' });
    genesis.projectManager.createProject = () => ({ id: 'p1', name: 'mock-proj', path: './deployments/mock' });
    genesis.projectManager.writeFile = () => {};
    genesis.coder.generateAndRun = async () => ({ code: '<html></html>' });

    const result = await genesis.spawnApp(prompt, user);
    console.log(`✓ Success! Cost: ${result.cost} NC`);
    console.log(`   User Balance: ${GlobalLedger.getBalance(user)} NC`);
  } catch (err) {
    console.error(`✗ Failed: ${err.message}`);
  }

  // 3. Test Failure (Expensive App / Insufficient Funds)
  console.log('\n--- Scenario 2: Bankruptcy Check ---');
  try {
    // A very long prompt to drive up cost
    const longPrompt =
      'A very complex MMORPG with 3D graphics, multiplayer networking, database sharding, and AI NPCs... ' +
      'x'.repeat(200);
    console.log(`Requesting expensive app (Length: ${longPrompt.length})`);

    await genesis.spawnApp(longPrompt, user);
    console.log('✗ Failed: Should have thrown insufficient funds error!');
  } catch (err) {
    console.log(`✓ Correctly Rejected: ${err.message}`);
    console.log(`   User Balance: ${GlobalLedger.getBalance(user)} NC`);
  }
}

testEconomy();
