const path = require('path');
const { runAstGate } = require('@neural/omega-core/ci/ast_gate');

const SOURCE_ROOT = path.join(__dirname, '../../src');

const success = runAstGate({
  sourceRoot: SOURCE_ROOT,
  logger: (msg) => console.log(`[AST GATE] ${msg}`),
  whitelistedPaths: [
    'kernel', 
    'main.js', 
    'core', 
    'plugins', 
    'main/', 
    'router', 
    'intelligence', 
    'swarm', 
    'hive', 
    'economy', 
    'forge'
  ]
});

if (!success) {
  console.log('[AST GATE FAILURE]');
  process.exit(1);
}

console.log('FINISH: 0 ERRORS');
