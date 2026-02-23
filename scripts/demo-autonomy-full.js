import { spawn } from 'child_process';
import http from 'http';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverPath = path.join(__dirname, '..', 'production-server.js');
const logFile = path.join(__dirname, '..', 'demo-autonomy-full.log');

function log(msg) {
  const ts = new Date().toISOString();
  const line = `[${ts}] ${msg}`;
  console.log(line);
  fs.appendFileSync(logFile, line + '
');
}

log('Starting Full Autonomy Demo...');

// Start Server
const serverProcess = spawn('node', [serverPath], {
  cwd: path.join(__dirname, '..'),
  env: { 
    ...process.env, 
    PORT: '3002', 
    DRY_RUN: '0',
    AUTO_HEALING: '1',
    AUTO_SCALING: '1',
    AUTO_ANOMALY_DETECTION: '1'
  },
  stdio: 'pipe'
});

let serverRunning = false;

serverProcess.stdout.on('data', (data) => {
  const str = data.toString();
  if (str.includes('LISTENING')) {
    serverRunning = true;
    log('Server started successfully on port 3002');
    runTests();
  }
});

serverProcess.stderr.on('data', (data) => {
  // log(`[Server Error]: ${data}`);
});

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3002,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ 
          statusCode: res.statusCode, 
          headers: res.headers, 
          body: data 
        });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  try {
    // 1. Check Metrics
    log('Checking Metrics...');
    const metrics = await request('GET', '/metrics/prometheus');
    if (metrics.statusCode === 200 && metrics.body.includes('neuralshell')) {
      log('✅ Metrics Endpoint Active');
    } else {
      log('❌ Metrics Endpoint Failed');
    }

    // 2. Check Autonomy Status
    log('Checking Autonomy Status...');
    const autonomy = await request('GET', '/metrics/autonomy');
    if (autonomy.statusCode === 200) {
      log('✅ Autonomy Metrics Active');
    } else {
      log('❌ Autonomy Metrics Failed');
    }

    // 3. Send Prompt and Check Quality Score
    log('Sending Prompt...');
    const promptRes = await request('POST', '/prompt', {
      messages: [{ role: 'user', content: 'Hello' }],
      model: 'llama3'
    }, { 'x-prompt-token': 'test' });

    if (promptRes.statusCode === 200) {
      log('✅ Prompt Successful');
      const score = promptRes.headers['x-quality-score'];
      if (score) {
        log(`✅ Quality Score Received: ${score}`);
      } else {
        log('⚠️ No Quality Score Header (Did you add it?)');
      }
    } else {
      log(`❌ Prompt Failed: ${promptRes.statusCode}`);
    }

    // 4. Check Replay Status
    log('Checking Replay Engine...');
    const replayRes = await request('GET', '/admin/replay/status', null, { 'x-admin-token': 'admin' });
    if (replayRes.statusCode === 200) {
      log('✅ Replay Engine Active');
    } else {
      log(`⚠️ Replay Engine Status: ${replayRes.statusCode} (May not be initialized if queryAPI is missing)`);
    }

    log('Demo Complete. Stopping Server...');
    serverProcess.kill();
    process.exit(0);

  } catch (err) {
    log(`❌ Error running tests: ${err.message}`);
    serverProcess.kill();
    process.exit(1);
  }
}

// Timeout
setTimeout(() => {
  if (!serverRunning) {
    log('❌ Timeout waiting for server start');
    serverProcess.kill();
    process.exit(1);
  }
}, 15000);
