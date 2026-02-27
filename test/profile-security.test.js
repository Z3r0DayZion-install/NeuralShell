import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createServer } from '../production-server.js';

async function writeTempConfigYaml(yaml) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'neuralshell-profile-'));
  const filePath = path.join(dir, 'config.yaml');
  await fs.writeFile(filePath, yaml, 'utf8');
  return { dir, filePath };
}

function withEnv(vars, fn) {
  const previous = {};
  for (const [key, value] of Object.entries(vars)) {
    previous[key] = process.env[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = String(value);
    }
  }
  return Promise.resolve()
    .then(fn)
    .finally(() => {
      for (const [key, value] of Object.entries(previous)) {
        if (value === undefined) {
          delete process.env[key];
        } else {
          process.env[key] = value;
        }
      }
    });
}

test('profile: local initializes without tokens', async () => {
  const { dir, filePath } = await writeTempConfigYaml(`
version: "1.0.0"
server:
  profile: "local"
  host: "127.0.0.1"
  port: 0
endpoints:
  - name: "ollama-local"
    url: "http://localhost:11434/api/chat"
    model: "llama3"
security:
  corsAllowedOrigins: []
`);

  await withEnv(
    {
      NODE_ENV: 'test',
      PROOF_MODE: '1',
      NS_PROFILE: undefined,
      HOST: undefined,
      ADMIN_TOKEN: undefined,
      PROMPT_TOKEN: undefined,
      PLUGINS_ENABLED: '0',
      SWARM_ENABLED: '0',
      HIVE_ENABLED: '0',
      FEDERATION_ENABLED: '0',
      EVOLUTION_ENABLED: '0'
    },
    async () => {
      const server = await createServer({ configPath: filePath });
      await server.start();
      await server.shutdown();
    }
  );

  await fs.rm(dir, { recursive: true, force: true });
});

test('profile: lan refuses when ADMIN_TOKEN missing', async () => {
  const { dir, filePath } = await writeTempConfigYaml(`
version: "1.0.0"
server:
  profile: "lan"
  host: "127.0.0.1"
  port: 0
endpoints:
  - name: "ollama-local"
    url: "http://localhost:11434/api/chat"
    model: "llama3"
security:
  adminIpAllowlist: ["127.0.0.1"]
  corsAllowedOrigins: []
`);

  await withEnv(
    {
      NODE_ENV: 'test',
      PROOF_MODE: '1',
      NS_PROFILE: 'lan',
      HOST: '127.0.0.1',
      ADMIN_TOKEN: '',
      PROMPT_TOKEN: 'this-is-a-strong-prompt-token',
      PLUGINS_ENABLED: '0',
      SWARM_ENABLED: '0',
      HIVE_ENABLED: '0',
      FEDERATION_ENABLED: '0',
      EVOLUTION_ENABLED: '0'
    },
    async () => {
      await assert.rejects(
        () => createServer({ configPath: filePath }),
        /requires ADMIN_TOKEN|strong ADMIN_TOKEN/i
      );
    }
  );

  await fs.rm(dir, { recursive: true, force: true });
});

test('profile: lan refuses when PROMPT_TOKEN missing', async () => {
  const { dir, filePath } = await writeTempConfigYaml(`
version: "1.0.0"
server:
  profile: "lan"
  host: "127.0.0.1"
  port: 0
endpoints:
  - name: "ollama-local"
    url: "http://localhost:11434/api/chat"
    model: "llama3"
security:
  adminIpAllowlist: ["127.0.0.1"]
  corsAllowedOrigins: []
`);

  await withEnv(
    {
      NODE_ENV: 'test',
      PROOF_MODE: '1',
      NS_PROFILE: 'lan',
      HOST: '127.0.0.1',
      ADMIN_TOKEN: 'this-is-a-strong-admin-token',
      PROMPT_TOKEN: '',
      PLUGINS_ENABLED: '0',
      SWARM_ENABLED: '0',
      HIVE_ENABLED: '0',
      FEDERATION_ENABLED: '0',
      EVOLUTION_ENABLED: '0'
    },
    async () => {
      await assert.rejects(
        () => createServer({ configPath: filePath }),
        /requires PROMPT_TOKEN|strong PROMPT_TOKEN/i
      );
    }
  );

  await fs.rm(dir, { recursive: true, force: true });
});

test('profile: lan refuses weak tokens', async () => {
  const { dir, filePath } = await writeTempConfigYaml(`
version: "1.0.0"
server:
  profile: "lan"
  host: "127.0.0.1"
  port: 0
endpoints:
  - name: "ollama-local"
    url: "http://localhost:11434/api/chat"
    model: "llama3"
security:
  adminIpAllowlist: ["127.0.0.1"]
  corsAllowedOrigins: []
`);

  await withEnv(
    {
      NODE_ENV: 'test',
      PROOF_MODE: '1',
      NS_PROFILE: 'lan',
      HOST: '127.0.0.1',
      ADMIN_TOKEN: 'change-me',
      PROMPT_TOKEN: 'change-me-too',
      PLUGINS_ENABLED: '0',
      SWARM_ENABLED: '0',
      HIVE_ENABLED: '0',
      FEDERATION_ENABLED: '0',
      EVOLUTION_ENABLED: '0'
    },
    async () => {
      await assert.rejects(() => createServer({ configPath: filePath }), /strong .*TOKEN/i);
    }
  );

  await fs.rm(dir, { recursive: true, force: true });
});

test('profile: lan refuses CORS wildcard', async () => {
  const { dir, filePath } = await writeTempConfigYaml(`
version: "1.0.0"
server:
  profile: "lan"
  host: "127.0.0.1"
  port: 0
endpoints:
  - name: "ollama-local"
    url: "http://localhost:11434/api/chat"
    model: "llama3"
security:
  adminIpAllowlist: ["127.0.0.1"]
  corsAllowedOrigins: ["*"]
`);

  await withEnv(
    {
      NODE_ENV: 'test',
      PROOF_MODE: '1',
      NS_PROFILE: 'lan',
      HOST: '127.0.0.1',
      ADMIN_TOKEN: 'this-is-a-strong-admin-token',
      PROMPT_TOKEN: 'this-is-a-strong-prompt-token',
      PLUGINS_ENABLED: '0',
      SWARM_ENABLED: '0',
      HIVE_ENABLED: '0',
      FEDERATION_ENABLED: '0',
      EVOLUTION_ENABLED: '0'
    },
    async () => {
      await assert.rejects(() => createServer({ configPath: filePath }), /CORS wildcard/i);
    }
  );

  await fs.rm(dir, { recursive: true, force: true });
});

test('profile: lan refuses public bind without adminIpAllowlist', async () => {
  const { dir, filePath } = await writeTempConfigYaml(`
version: "1.0.0"
server:
  profile: "lan"
  host: "0.0.0.0"
  port: 0
endpoints:
  - name: "ollama-local"
    url: "http://localhost:11434/api/chat"
    model: "llama3"
security:
  corsAllowedOrigins: []
`);

  await withEnv(
    {
      NODE_ENV: 'test',
      PROOF_MODE: '1',
      NS_PROFILE: 'lan',
      HOST: '0.0.0.0',
      ADMIN_TOKEN: 'this-is-a-strong-admin-token',
      PROMPT_TOKEN: 'this-is-a-strong-prompt-token',
      PLUGINS_ENABLED: '0',
      SWARM_ENABLED: '0',
      HIVE_ENABLED: '0',
      FEDERATION_ENABLED: '0',
      EVOLUTION_ENABLED: '0'
    },
    async () => {
      await assert.rejects(() => createServer({ configPath: filePath }), /requires security\.adminIpAllowlist/i);
    }
  );

  await fs.rm(dir, { recursive: true, force: true });
});

test('profile: lan initializes with tokens + allowlist on public bind', async () => {
  const { dir, filePath } = await writeTempConfigYaml(`
version: "1.0.0"
server:
  profile: "lan"
  host: "0.0.0.0"
  port: 0
endpoints:
  - name: "ollama-local"
    url: "http://localhost:11434/api/chat"
    model: "llama3"
security:
  adminIpAllowlist: ["127.0.0.1", "192.168.0.0/16"]
  corsAllowedOrigins: ["https://app.example.com"]
`);

  await withEnv(
    {
      NODE_ENV: 'test',
      PROOF_MODE: '1',
      NS_PROFILE: 'lan',
      HOST: '0.0.0.0',
      ADMIN_TOKEN: 'this-is-a-strong-admin-token',
      PROMPT_TOKEN: 'this-is-a-strong-prompt-token',
      PLUGINS_ENABLED: '0',
      SWARM_ENABLED: '0',
      HIVE_ENABLED: '0',
      FEDERATION_ENABLED: '0',
      EVOLUTION_ENABLED: '0'
    },
    async () => {
      const server = await createServer({ configPath: filePath });
      await server.start();
      await server.shutdown();
    }
  );

  await fs.rm(dir, { recursive: true, force: true });
});

if (process.env.NS_DEBUG_HANDLES === '1') {
  setTimeout(() => {
    try {
      const handles = process._getActiveHandles().map((h) => h?.constructor?.name || typeof h);
      const requests = process._getActiveRequests().map((r) => r?.constructor?.name || typeof r);
      // eslint-disable-next-line no-console
      console.log('NS_DEBUG_HANDLES', { handles, requests });
      try {
        const reportUrl = new URL('../state/profile-security-node-report.json', import.meta.url);
        const reportPath = fileURLToPath(reportUrl);
        // eslint-disable-next-line no-console
        console.log('NS_DEBUG_REPORT', reportPath);
        process.report?.writeReport?.(reportPath);
      } catch {
        // ignore
      }
    } catch {
      // ignore
    }
  }, 500);
}
