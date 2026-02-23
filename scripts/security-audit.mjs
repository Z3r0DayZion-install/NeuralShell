#!/usr/bin/env node

import { spawn } from 'child_process';
import fs from 'fs';

console.log('🔒 Running Security Audit...\n');

const audit = spawn('npm', ['audit', '--json'], { stdio: 'pipe' });
let output = '';

audit.stdout.on('data', (data) => {
  output += data.toString();
});

audit.on('close', (code) => {
  try {
    const result = JSON.parse(output);
    const vulnerabilities = result.vulnerabilities || {};
    const metadata = result.metadata || {};

    console.log(`📊 Audit Summary:`);
    console.log(`   Total packages: ${metadata.totalDependencies || 0}`);
    console.log(`   Vulnerabilities found: ${Object.keys(vulnerabilities).length}`);

    const critical = Object.values(vulnerabilities).filter(v => v.severity === 'critical').length;
    const high = Object.values(vulnerabilities).filter(v => v.severity === 'high').length;
    const moderate = Object.values(vulnerabilities).filter(v => v.severity === 'moderate').length;
    const low = Object.values(vulnerabilities).filter(v => v.severity === 'low').length;

    if (critical > 0) console.log(`   🔴 Critical: ${critical}`);
    if (high > 0) console.log(`   🟠 High: ${high}`);
    if (moderate > 0) console.log(`   🟡 Moderate: ${moderate}`);
    if (low > 0) console.log(`   🔵 Low: ${low}`);

    if (critical > 0 || high > 0) {
      console.error('\n❌ Security issues detected!');
      process.exit(1);
    }

    console.log('\n✅ Security audit passed!\n');
    process.exit(0);
  } catch (err) {
    console.error('Failed to parse audit result:', err.message);
    process.exit(1);
  }
});
