#!/usr/bin/env node

import { writeFileSync } from 'fs';
import { spawn } from 'child_process';

const output = [];

const proc = spawn('node', ['scripts/demo-autonomy.mjs'], {
  env: { ...process.env, DRY_RUN: '1' }
});

proc.stdout.on('data', (data) => {
  const text = data.toString();
  output.push(text);
  process.stdout.write(text);
});

proc.stderr.on('data', (data) => {
  const text = data.toString();
  output.push(text);
  process.stderr.write(text);
});

proc.on('close', (code) => {
  writeFileSync('demo-output.txt', output.join(''));
  console.log(`\nDemo exited with code ${code}`);
  console.log('Output saved to demo-output.txt');
  process.exit(code);
});
