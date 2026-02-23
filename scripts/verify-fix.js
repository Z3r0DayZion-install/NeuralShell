import { spawn } from 'child_process';
import http from 'http';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverPath = path.join(__dirname, '..', 'production-server.js');

console.log('Starting server verification...');
console.log(`Server path: ${serverPath}`);

const serverProcess = spawn('node', [serverPath], {
  cwd: path.join(__dirname, '..'),
  env: { ...process.env, PORT: '3001' }, // Use different port to avoid conflicts
  stdio: 'pipe'
});

let serverRunning = false;
let outputData = '';

serverProcess.stdout.on('data', (data) => {
  const str = data.toString();
  outputData += str;
  // console.log('[Server]:', str.trim());
  if (str.includes('LISTENING')) {
    serverRunning = true;
    checkEndpoints();
  }
});

serverProcess.stderr.on('data', (data) => {
  console.error('[Server Error]:', data.toString());
});

function checkEndpoints() {
  console.log('Server started! Checking endpoints...');
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/metrics/prometheus',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log(`Metrics Endpoint Status: ${res.statusCode}`);
    
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
      if (res.statusCode === 200 && body.includes('neuralshell')) {
        console.log('SUCCESS: Metrics endpoint is active and returning data.');
        console.log('Fix Verified!');
        cleanup(0);
      } else {
        console.error('FAILURE: Metrics endpoint returned unexpected response.');
        cleanup(1);
      }
    });
  });

  req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
    cleanup(1);
  });

  req.end();
}

function cleanup(code) {
  if (serverProcess) {
    serverProcess.kill();
  }
  console.log(`Exiting with code ${code}`);
  process.exit(code);
}

// Timeout
setTimeout(() => {
  if (!serverRunning) {
    console.error('TIMEOUT: Server did not start in 10 seconds.');
    console.error('Output so far:', outputData);
    cleanup(1);
  }
}, 10000);
