#!/usr/bin/env node

import { NeuralShellServer } from './production-server.js';

console.log('Creating server with default config...');

const server = new NeuralShellServer();

try {
  await server.initialize(null); // Use default config
  console.log('Server initialized');
  
  await server.start();
  console.log('Server started');
  
  // Wait a bit then test
  setTimeout(async () => {
    console.log('Stopping server...');
    await server.shutdown();
    process.exit(0);
  }, 3000);
  
} catch (err) {
  console.error('Error:', err.message);
  console.error(err.stack);
  process.exit(1);
}
