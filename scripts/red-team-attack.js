import http from 'http';

const TARGET_HOST = 'localhost';
const TARGET_PORT = 3002;

function log(msg) {
  console.log(`[RED-TEAM] ${msg}`);
}

async function attack(name, payload, method = 'POST', path = '/prompt') {
  return new Promise((resolve) => {
    const options = {
      hostname: TARGET_HOST,
      port: TARGET_PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'RedTeam/1.0'
      }
    };

    const req = http.request(options, (res) => {
      resolve({ statusCode: res.statusCode });
    });

    req.on('error', (e) => resolve({ error: e.message }));

    if (payload) {
      req.write(JSON.stringify(payload));
    }
    req.end();
  });
}

async function runScenario() {
  log('Starting Red Team Simulation against NeuralShell...');

  // 1. SQL Injection Attempt
  log('Attack 1: SQL Injection Payload');
  const sqlRes = await attack('SQLi', {
    messages: [{ role: 'user', content: "SELECT * FROM users; DROP TABLE logs;" }]
  });
  log(`Result: ${sqlRes.statusCode} (Expected 403/Blocked)`);

  // 2. XSS Attempt
  log('Attack 2: XSS Payload');
  const xssRes = await attack('XSS', {
    messages: [{ role: 'user', content: "<script>alert('pwned')</script>" }]
  });
  log(`Result: ${xssRes.statusCode} (Expected 403/Blocked)`);

  // 3. Rate Limit Burst (DDoS Lite)
  log('Attack 3: Rate Limit Burst (50 requests)');
  let blockedCount = 0;
  const burstSize = 50;
  const promises = [];
  
  for (let i = 0; i < burstSize; i++) {
    promises.push(attack('Burst', { messages: [{ role: 'user', content: 'spam' }] }));
  }
  
  const results = await Promise.all(promises);
  blockedCount = results.filter(r => r.statusCode === 429).length;
  
  log(`Burst Complete. Blocked Requests: ${blockedCount}/${burstSize}`);
  
  if (blockedCount > 0) {
    log('✅ Rate Limiting Active');
  } else {
    log('⚠️ Rate Limiting did not trigger (Threshold might be higher)');
  }
  
  log('Red Team Simulation Complete.');
}

runScenario();
