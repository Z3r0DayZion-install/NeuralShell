#!/usr/bin/env node

import { buildServer } from '../router.js';

console.log('Starting simple test...');

try {
  const server = await buildServer({
    AUTO_HEALING: '1',
    AUTO_SCALING: '1',
    DRY_RUN: '1'
  });

  console.log('Server built successfully');
  console.log('Autonomy controller:', server.autonomyController ? 'ATTACHED' : 'NOT ATTACHED');

  if (server.autonomyController) {
    const status = server.autonomyController.getStatus();
    console.log('Status:', JSON.stringify(status, null, 2));
  }

  console.log('Test complete - exiting');
  process.exit(0);
} catch (error) {
  console.error('Error:', error.message);
  console.error(error.stack);
  process.exit(1);
}
