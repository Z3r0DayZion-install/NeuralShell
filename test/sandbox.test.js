import test from 'node:test';
import assert from 'node:assert/strict';
import Docker from 'dockerode';

import { AdaptiveSandbox } from '../src/sandbox/adaptiveSandbox.js';
import { HardenedSandbox } from '../src/sandbox/hardenedSandbox.js';

async function dockerImageExists(image) {
  const docker = new Docker();
  return await new Promise((resolve) => {
    docker.getImage(image).inspect((err) => resolve(!err));
  });
}

const image = process.env.NS_SANDBOX_IMAGE || 'node:20-alpine';
const dockerReachable = await new HardenedSandbox().isAvailable(1000);
const dockerRunnable = dockerReachable ? await dockerImageExists(image) : false;

test('sandbox: vm backend executes code', async () => {
  const sandbox = new AdaptiveSandbox({ backend: 'vm', vmTimeoutMs: 2000 });
  const res = await sandbox.execute('console.log("VM_OK"); 2 + 2');
  assert.equal(res.success, true);
  assert.match(res.output, /VM_OK/);
});

test('sandbox: docker backend executes code', { skip: !dockerRunnable }, async () => {
  const sandbox = new AdaptiveSandbox({ backend: 'docker', dockerTimeoutMs: 4000 });
  const res = await sandbox.execute('console.log("DOCKER_OK");');
  assert.equal(res.success, true);
  assert.match(res.output, /DOCKER_OK/);
});

test('sandbox: docker blocks network egress', { skip: !dockerRunnable }, async () => {
  const sandbox = new AdaptiveSandbox({ backend: 'docker', dockerTimeoutMs: 4000 });
  const code = `
    const net = require('node:net');
    const s = net.connect({ host: '1.1.1.1', port: 80 });
    s.on('connect', () => { console.log('NETOK'); s.end(); });
    s.on('error', () => { console.log('NETFAIL'); });
    setTimeout(() => { console.log('NETTIMEOUT'); try { s.destroy(); } catch {} }, 700);
  `;
  const res = await sandbox.execute(code, 2500);
  assert.equal(res.success, true);
  assert.ok(!res.output.includes('NETOK'), `unexpected NETOK output: ${res.output}`);
  assert.ok(
    res.output.includes('NETFAIL') || res.output.includes('NETTIMEOUT'),
    `expected NETFAIL/NETTIMEOUT output: ${res.output}`
  );
});

test('sandbox: docker uses read-only rootfs', { skip: !dockerRunnable }, async () => {
  const sandbox = new AdaptiveSandbox({ backend: 'docker', dockerTimeoutMs: 4000 });
  const code = `
    const fs = require('node:fs');
    try {
      fs.writeFileSync('/owned_by_sandbox', 'x', 'utf8');
      console.log('WRITEOK');
    } catch (e) {
      console.log('WRITEFAIL:' + (e && e.code ? e.code : 'ERR'));
    }
  `;
  const res = await sandbox.execute(code, 2500);
  assert.equal(res.success, true);
  assert.ok(!res.output.includes('WRITEOK'), `unexpected WRITEOK output: ${res.output}`);
  assert.match(res.output, /WRITEFAIL:(EACCES|EROFS|EPERM|ERR)/);
});
