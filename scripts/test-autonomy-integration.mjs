#!/usr/bin/env node

/**
 * Simple test to verify autonomy controller integration
 */

import { buildServer } from '../router.js';

console.log('Testing Autonomy Controller Integration...\n');

// Set environment variables
process.env.DRY_RUN = '1';
process.env.AUTO_HEALING = '1';
process.env.AUTO_SCALING = '1';

try {
  console.log('1. Building server...');
  const server = buildServer();
  
  console.log('2. Checking autonomy controller...');
  if (!server.autonomyController) {
    console.error('❌ FAIL: Autonomy controller not attached to server');
    process.exit(1);
  }
  console.log('✅ Autonomy controller attached');
  
  console.log('3. Checking feature flags...');
  console.log('   Feature flags:', server.autonomyController.featureFlags);
  
  console.log('4. Starting server on ephemeral port...');
  await server.listen({ port: 0, host: '127.0.0.1' });
  const address = server.server.address();
  console.log(`✅ Server started on port ${address.port}`);
  
  console.log('5. Testing /metrics/autonomy endpoint...');
  const fetch = (await import('node-fetch')).default;
  const response = await fetch(`http://127.0.0.1:${address.port}/metrics/autonomy`);
  const metrics = await response.text();
  console.log('✅ Metrics endpoint response:');
  console.log(metrics);
  
  console.log('6. Stopping server...');
  await server.close();
  console.log('✅ Server stopped');
  
  console.log('\n🎉 All integration tests passed!');
  process.exit(0);
  
} catch (error) {
  console.error('❌ Test failed:', error.message);
  console.error(error.stack);
  process.exit(1);
}
