const { execSync } = require('node:child_process');
const assert = require('node:assert');
const fs = require('node:fs');

function testASTGate() {
  console.log("[Test] Verifying AST Gate Enforcement...");

  const testFile = 'tools/security/violation_test.js';
  
  // 1. Test forbidden import
  fs.writeFileSync(testFile, "require('fs');");
  try {
    execSync('node tools/security/ast_gate.js', { stdio: 'pipe' });
    assert.fail("Gate should have failed on forbidden import");
  } catch (e) {
    assert.ok(e.message.includes("Restricted require"), "Incorrect error message for forbidden import");
  }

  // 2. Test non-literal IPC channel
  fs.writeFileSync(testFile, "ipcMain.handle(someVar, () => {});");
  try {
    execSync('node tools/security/ast_gate.js', { stdio: 'pipe' });
    assert.fail("Gate should have failed on non-literal IPC channel");
  } catch (e) {
    assert.ok(e.message.includes("Non-literal IPC channel"), "Incorrect error message for non-literal IPC");
  }

  fs.unlinkSync(testFile);
  console.log("✅ AST gate enforcement verified.");
}
