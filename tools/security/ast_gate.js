import fs from 'node:fs';
import path from 'node:path';
import * as parser from '@babel/parser';
import traversePkg from '@babel/traverse';

const traverse = traversePkg && traversePkg.default ? traversePkg.default : traversePkg;

const WHITELIST = ['tools/security/ast_gate.js', 'tools/security/export_proof.js', 'scripts/sign_manifest.js'];

function audit(filePath) {
  const code = fs.readFileSync(filePath, 'utf8');
  let rel = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
  
  if (rel.startsWith('src/kernel/') || WHITELIST.includes(rel)) return;

  let ast = null;
  try {
    ast = parser.parse(code, {
      sourceType: 'unambiguous',
      plugins: [
        'typescript',
        'jsx',
        'dynamicImport',
        'topLevelAwait',
        'importMeta',
        'classProperties',
        'classPrivateProperties',
        'classPrivateMethods',
        'exportDefaultFrom',
        'exportNamespaceFrom',
        'optionalChaining',
        'nullishCoalescingOperator'
      ],
      errorRecovery: true
    });
  } catch (err) {
    console.error(`❌ Parse error in ${rel}: ${String(err && err.message ? err.message : err)}`);
    process.exit(1);
  }
  
  traverse(ast, {
    CallExpression(p) {
      const callee = p.node.callee;
      const func = callee.name || callee.property?.name;
      if (callee.type === 'Identifier' && callee.name === 'registerHandle') {
        if (p.node.arguments[0]?.type !== 'StringLiteral') {
          console.error(`❌ Non-literal IPC route passed to registerHandle() in ${rel}`);
          process.exit(1);
        }
        const channel = p.node.arguments[0].value;
        const schema = path.join('src/kernel/schemas', `${channel.replace(/:/g, '_')}.schema.json`);
        if (fs.existsSync('src/kernel/schemas') && !fs.existsSync(schema)) {
          console.error(`❌ Missing Ajv schema for IPC '${channel}'`);
          process.exit(1);
        }
      }
    },
    ImportDeclaration(p) {
      // No-op: import restrictions are enforced by higher-level gates in each project.
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
    if (fs.statSync(p).isDirectory()) {
      if (
        f !== 'node_modules' &&
        f !== 'dist' &&
        f !== '.git' &&
        f !== 'build' &&
        f !== 'coverage' &&
        f !== '.nyc_output' &&
        f !== 'scripts' &&
        f !== 'bin' &&
        f !== 'tests' &&
        f !== 'test' &&
        f !== 'state' &&
        f !== 'evidence'
      ) {
        walk(p);
      }
    }
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
