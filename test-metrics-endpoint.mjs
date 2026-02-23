#!/usr/bin/env node

import { NeuralShellServer } from './production-server.js';
import http from 'http';

console.log('Starting server with autonomy enabled...\n');

const server = new NeuralShellServer();

try {
  await server.initialize(null);
  await server.start();
  
  console.log('Server started, waiting 2 seconds...\n');
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('Fetching /metrics/autonomy...\n');
  
  const req = http.get('http://127.0.0.1:3000/metrics/autonomy', (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', async () => {
      console.log('='.repeat(60));
      console.log('METRICS OUTPUT (first 40 lines):');
      console.log('='.repeat(60));
      const lines = data.split('\n').slice(0, 40);
      lines.forEach(line => console.log(line));
      console.log('='.repeat(60));
      console.log(`\nStatus Code: ${res.statusCode}`);
      console.log(`Total Lines: ${data.split('\n').length}`);
      console.log('\nShutting down...');
      
      await server.shutdown();
      process.exit(res.statusCode === 200 ? 0 : 1);
    });
  });
  
  req.on('error', async (err) => {
    console.error('Request error:', err.message);
    await server.shutdown();
    process.exit(1);
  });
  
} catch (err) {
  console.error('Error:', err.message);
  process.exit(1);
}
