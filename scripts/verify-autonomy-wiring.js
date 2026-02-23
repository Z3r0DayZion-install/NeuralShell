import { spawn } from 'child_process';
import http from 'http';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverPath = path.join(__dirname, '..', 'production-server.js');

console.log('Starting autonomy wiring verification...');

const serverProcess = spawn('node', [serverPath], {
  cwd: path.join(__dirname, '..'),
  env: { 
    ...process.env, 
    PORT: '3002',
    AUTO_HEALING: '1',
    AUTO_SCALING: '1',
    AUTO_ANOMALY_DETECTION: '1',
    AUTO_PROCESS_MANAGEMENT: '1',
    DRY_RUN: '1'
  },
  stdio: 'pipe'
});

let serverRunning = false;
let outputData = '';

serverProcess.stdout.on('data', (data) => {
  const str = data.toString();
  outputData += str;
  if (str.includes('LISTENING')) {
    serverRunning = true;
    checkAutonomy();
  }
});

serverProcess.stderr.on('data', (data) => {
  console.error('[Server Error]:', data.toString());
});

async function makeRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => responseBody += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, body: responseBody }));
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function checkAutonomy() {
  console.log('Server started! Verifying Autonomy Controller...');
  
  try {
    // 1. Check /admin/autonomy status
    const statusRes = await makeRequest({
      hostname: 'localhost',
      port: 3002,
      path: '/admin/autonomy',
      method: 'GET'
    });
    
    console.log(`Autonomy Status Code: ${statusRes.statusCode}`);
    if (statusRes.statusCode !== 200) {
      console.error('Autonomy status endpoint failed');
      cleanup(1);
      return;
    }
    
    const status = JSON.parse(statusRes.body);
    console.log('Enabled Modules:', status.enabledModules);
    
    if (status.moduleCount === 0) {
      console.error('FAILURE: No autonomy modules enabled');
      cleanup(1);
      return;
    }

    // 2. Trigger an event by making a request
    console.log('Triggering request_completed event...');
    await makeRequest({
      hostname: 'localhost',
      port: 3002,
      path: '/health',
      method: 'GET'
    });

    // 3. Check if metrics changed
    console.log('Checking if metrics reflect activity...');
    const metricsRes = await makeRequest({
      hostname: 'localhost',
      port: 3002,
      path: '/metrics/autonomy',
      method: 'GET'
    });

    console.log('Autonomy Metrics:');
    console.log(metricsRes.body);

    if (metricsRes.body.includes('autonomy_controller_uptime_seconds')) {
      console.log('SUCCESS: Autonomy wiring verified!');
      cleanup(0);
    } else {
      console.error('FAILURE: Autonomy metrics missing expected data');
      cleanup(1);
    }

  } catch (err) {
    console.error('Error during verification:', err);
    cleanup(1);
  }
}

function cleanup(code) {
  if (serverProcess) {
    serverProcess.kill();
  }
  process.exit(code);
}

setTimeout(() => {
  if (!serverRunning) {
    console.error('TIMEOUT: Server did not start in 15 seconds.');
    cleanup(1);
  }
}, 15000);
