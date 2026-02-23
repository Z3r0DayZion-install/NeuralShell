import fs from 'node:fs';

const checks = [];

function addCheck(name, ok, detail = '') {
  checks.push({ name, ok, detail });
}

addCheck('OPENAI_API_KEY set', Boolean(process.env.OPENAI_API_KEY), 'optional if using only local endpoints');
addCheck('PORT valid', Number(process.env.PORT || 3000) > 0);
addCheck('state dir exists', fs.existsSync('state'), 'state directory recommended');
addCheck('router.js exists', fs.existsSync('router.js'));
addCheck('README exists', fs.existsSync('README.md'));

for (const c of checks) {
  const prefix = c.ok ? 'OK' : 'WARN';
  console.log(`${prefix} ${c.name}${c.detail ? ` - ${c.detail}` : ''}`);
}

const failedHard = checks.filter((c) => !c.ok && c.name === 'router.js exists').length > 0;
process.exit(failedHard ? 1 : 0);
