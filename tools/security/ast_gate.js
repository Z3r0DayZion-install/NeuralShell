"use strict";
const fs = require('node:fs');
const path = require('node:path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const FORBIDDEN = ['fs', 'child_process', 'net', 'http', 'https', 'crypto'];
const WHITELIST = ['tools/security/ast_gate.js', 'tools/security/export_proof.js', 'scripts/sign_manifest.js'];

function audit(filePath) {
  const code = fs.readFileSync(filePath, 'utf8');
  let rel = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
  
  if (rel.startsWith('src/kernel/') || WHITELIST.includes(rel)) return;

  const ast = parser.parse(code, { sourceType: 'module', plugins: ['typescript'], errorRecovery: true });
  
  traverse(ast, {
    CallExpression(p) {
      const callee = p.node.callee;
      if (callee.name === 'require' && p.node.arguments[0]?.type === 'StringLiteral') {
        const mod = p.node.arguments[0].value.replace('node:', '');
        if (FORBIDDEN.includes(mod)) { console.error(`❌ Restricted require '${mod}' in ${rel}`); process.exit(1); }
      }
      const func = callee.name || callee.property?.name;
      if (['spawn', 'exec', 'execSync', 'spawnSync'].includes(func)) {
        console.error(`❌ Forbidden execution call '${func}' in ${rel}`); process.exit(1);
      }
      if (callee.property?.name === 'handle') {
        if (p.node.arguments[0].type !== 'StringLiteral') { console.error(`❌ Non-literal IPC channel in ${rel}`); process.exit(1); }
        const channel = p.node.arguments[0].value;
        const schema = path.join('src/kernel/schemas', `${channel.replace(/:/g, '_')}.schema.json`);
        if (!fs.existsSync(schema)) { console.error(`❌ Missing Ajv schema for IPC '${channel}'`); process.exit(1); }
      }
    },
    ImportDeclaration(p) {
      const mod = p.node.source.value.replace('node:', '');
      if (FORBIDDEN.includes(mod)) { console.error(`❌ Restricted import '${mod}' in ${rel}`); process.exit(1); }
    },
    NewExpression(p) {
      if (p.node.callee.name === 'BrowserWindow') {
        const props = p.node.arguments[0]?.properties?.find(pr => pr.key.name === 'webPreferences')?.value.properties;
        const check = (n, v) => props?.find(pr => pr.key.name === n)?.value.value !== v;
        if (check('nodeIntegration', false) || check('contextIsolation', true) || check('sandbox', true)) {
          console.error(`❌ Insecure BrowserWindow in ${rel}`); process.exit(1);
        }
      }
    }
  });
}

function walk(dir) {
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) { if (f !== 'node_modules' && f !== 'dist' && f !== '.git') walk(p); }
    else if (f.endsWith('.js') || f.endsWith('.ts')) audit(p);
  });
}

if (process.argv.includes('--self-test')) {
  const testFile = 'tools/security/violation_test.js';
  fs.writeFileSync(testFile, "require('fs');");
  try { walk('tools/security'); } catch (e) { console.log("✅ Self-test passed."); fs.unlinkSync(testFile); process.exit(0); }
  console.error("❌ Self-test failed."); process.exit(1);
}

walk('.'); console.log("✅ AST Security Gates Passed.");
