#!/usr/bin/env node

import { spawn } from 'child_process';
import http from 'http';

console.log('Starting server...');

const server = spawn('node', ['production-server.js'], {
  env: {
    ...process.env,
    DRY_RUN: '1',
    PORT: '3002',
    AUTO_HEALING: '1',
    AUTO_SCALING: '1'
  }
});

let output = '';
server.stdout.on('data', (data) => {
  output += data.toString();
  console.log('[SERVER]', data.toString().trim());
});

server.stderr.on('data', (data) => {
  output += data.toString();
  console.error('[SERVER ERR]', data.toString().trim());
});

// Wait for server to start
setTimeout(async () => {
  console.log('\nTesting /metrics/autonomy endpoint...');
  
  const req = http.get('http://127.0.0.1:3002/metrics/autonomy', (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      console.log('\n=== METRICS OUTPUT ===');
      console.log(data);
      console.log('=== END METRICS ===\n');
      
      console.log('Status:', res.statusCode);
      console.log('Stopping server...');
      server.kill('SIGTERM');
      
      setTimeout(() => {
        process.exit(res.statusCode === 200 ? 0 : 1);
      }, 1000);
    });
  });
  
  req.on('error', (err) => {
    console.error('Request error:', err.message);
    server.kill('SIGTERM');
    setTimeout(() => process.exit(1), 1000);
  });
}, 12000);
