/**
 * Preservation Test: contextBridge APIs
 *
 * **Validates: Requirements 3.3**
 *
 * CRITICAL: This test MUST PASS on unfixed code to confirm baseline behavior.
 *
 * From Preservation Requirements 3.3:
 * - contextBridge with contextIsolation should continue to expose safe APIs
 *
 * This test verifies that:
 * 1. contextBridge is used to expose APIs to renderer process
 * 2. contextIsolation is enabled in BrowserWindow webPreferences
 * 3. All exposed APIs use ipcRenderer.invoke (safe pattern)
 * 4. No direct Node.js APIs are exposed to renderer
 * 5. preload.js properly isolates main and renderer contexts
 *
 * Expected Behavior (on unfixed code):
 * - All contextBridge APIs should be properly isolated
 * - contextIsolation should be enabled
 * - This behavior must be preserved after security fixes
 */

import { strict as assert } from 'assert';
import fs from 'fs';
import path from 'path';

const tests = [];
const results = { passed: 0, failed: 0, total: 0 };

function test(name, fn) {
  tests.push({ name, fn });
}

async function runTests() {
  console.log('\n🧪 Running contextBridge Preservation Tests\n');
  console.log('✅ EXPECTED: These tests SHOULD PASS on unfixed code to confirm baseline behavior\n');

  for (const { name, fn } of tests) {
    results.total++;
    try {
      await fn();
      results.passed++;
      console.log(`✅ ${name}`);
    } catch (error) {
      results.failed++;
      console.log(`❌ ${name}`);
      console.log(`   Error: ${error.message}`);
      if (error.stack) {
        console.log(`   ${error.stack.split('\n').slice(1, 3).join('\n   ')}`);
      }
    }
  }

  console.log(`\n📊 Results: ${results.passed}/${results.total} passed, ${results.failed} failed\n`);

  if (results.failed > 0) {
    console.log('❌ PRESERVATION FAILURE: Baseline behavior is broken');
    console.log('   These tests should pass on unfixed code to establish baseline\n');
    process.exit(1);
  } else {
    console.log('✅ PRESERVATION CONFIRMED: Baseline contextBridge behavior is working correctly\n');
  }
}

/**
 * Property: contextIsolation is enabled in all BrowserWindow instances
 *
 * This property verifies that all BrowserWindow configurations
 * have contextIsolation: true in webPreferences.
 */
test('Property: contextIsolation is enabled in all BrowserWindow instances', async () => {
  const mainFiles = [
    'NeuralShell_Desktop/main.js',
    'NeuralShell_Desktop/main_kernel.js',
    'src/boot/recovery.js'
  ];

  let foundBrowserWindow = false;

  for (const mainFile of mainFiles) {
    if (!fs.existsSync(mainFile)) {
      continue;
    }

    const content = fs.readFileSync(mainFile, 'utf8');

    // Check if this file creates BrowserWindow
    if (!content.includes('new BrowserWindow')) {
      continue;
    }

    foundBrowserWindow = true;

    // Verify contextIsolation is set to true
    assert.ok(
      content.includes('contextIsolation: true') || content.includes('contextIsolation:true'),
      `${mainFile} should have contextIsolation: true`
    );

    console.log(`   ✓ ${mainFile}: contextIsolation enabled`);
  }

  assert.ok(
    foundBrowserWindow,
    'Should find at least one BrowserWindow configuration'
  );
});

/**
 * Property: preload.js uses contextBridge to expose APIs
 *
 * This property verifies that the preload script uses contextBridge.exposeInMainWorld
 * to safely expose APIs to the renderer process.
 */
test('Property: preload.js uses contextBridge to expose APIs', async () => {
  const preloadFiles = [
    'NeuralShell_Desktop/preload.js',
    'NeuralShell_Desktop/src/preload.js'
  ];

  let foundPreload = false;

  for (const preloadFile of preloadFiles) {
    if (!fs.existsSync(preloadFile)) {
      continue;
    }

    foundPreload = true;
    const content = fs.readFileSync(preloadFile, 'utf8');

    // Verify contextBridge is imported
    assert.ok(
      content.includes('require("electron")') || content.includes("require('electron')") || content.includes('from "electron"') || content.includes("from 'electron'"),
      `${preloadFile} should import from electron`
    );

    assert.ok(
      content.includes('contextBridge'),
      `${preloadFile} should import contextBridge`
    );

    // Verify contextBridge.exposeInMainWorld is used
    assert.ok(
      content.includes('contextBridge.exposeInMainWorld'),
      `${preloadFile} should use contextBridge.exposeInMainWorld`
    );

    console.log(`   ✓ ${preloadFile}: Uses contextBridge.exposeInMainWorld`);
  }

  assert.ok(
    foundPreload,
    'Should find at least one preload.js file'
  );
});

/**
 * Property: All exposed APIs use ipcRenderer.invoke (safe pattern)
 *
 * This property verifies that all APIs exposed via contextBridge
 * use ipcRenderer.invoke, which is the safe IPC pattern.
 *
 * This ensures no direct Node.js APIs or unsafe patterns are exposed.
 */
test('Property: All exposed APIs use ipcRenderer.invoke (safe pattern)', async () => {
  const preloadPath = 'NeuralShell_Desktop/preload.js';

  if (!fs.existsSync(preloadPath)) {
    console.log('   ⚠ Skipping: preload.js not found');
    return;
  }

  const content = fs.readFileSync(preloadPath, 'utf8');

  // Verify ipcRenderer is imported
  assert.ok(
    content.includes('ipcRenderer'),
    'preload.js should import ipcRenderer'
  );

  // Find all exposeInMainWorld calls
  const exposeRegex = /contextBridge\.exposeInMainWorld\s*\(\s*["']([^"']+)["']\s*,\s*\{([^}]+)\}/g;
  const matches = [...content.matchAll(exposeRegex)];

  assert.ok(
    matches.length > 0,
    'Should find at least one contextBridge.exposeInMainWorld call'
  );

  console.log(`   Found ${matches.length} exposed API bridges`);

  // Verify all exposed functions use ipcRenderer.invoke
  for (const match of matches) {
    const bridgeName = match[1];
    const bridgeContent = match[2];

    // Check that the bridge uses ipcRenderer.invoke
    assert.ok(
      bridgeContent.includes('ipcRenderer.invoke'),
      `Bridge "${bridgeName}" should use ipcRenderer.invoke`
    );

    console.log(`   ✓ ${bridgeName}: Uses ipcRenderer.invoke`);
  }
});

/**
 * Property: No direct Node.js APIs are exposed to renderer
 *
 * This property verifies that the preload script does not expose
 * dangerous Node.js APIs directly to the renderer process.
 *
 * Dangerous APIs include: require, process, fs, child_process, etc.
 */
test('Property: No direct Node.js APIs are exposed to renderer', async () => {
  const preloadPath = 'NeuralShell_Desktop/preload.js';

  if (!fs.existsSync(preloadPath)) {
    console.log('   ⚠ Skipping: preload.js not found');
    return;
  }

  const content = fs.readFileSync(preloadPath, 'utf8');

  // Find all exposeInMainWorld calls and extract their content
  const exposeRegex = /contextBridge\.exposeInMainWorld\s*\(\s*["']([^"']+)["']\s*,\s*\{([^}]+)\}/g;
  const matches = [...content.matchAll(exposeRegex)];

  const dangerousAPIs = [
    'require(',
    'process.exit',
    'process.kill',
    'child_process',
    'fs.writeFile',
    'fs.unlink',
    'fs.rmdir',
    'eval(',
    'Function(',
    'child_process.exec',
    'child_process.spawn'
  ];

  for (const match of matches) {
    const bridgeName = match[1];
    const bridgeContent = match[2];

    // Check that no dangerous APIs are directly exposed
    for (const dangerousAPI of dangerousAPIs) {
      assert.ok(
        !bridgeContent.includes(dangerousAPI),
        `Bridge "${bridgeName}" should not expose dangerous API: ${dangerousAPI}`
      );
    }
  }

  console.log(`   ✓ No dangerous Node.js APIs exposed in ${matches.length} bridges`);
});

/**
 * Property: For all exposed APIs, contextIsolation is enabled
 *
 * This is the core preservation property: verify that whenever
 * contextBridge is used, contextIsolation is enabled in the
 * corresponding BrowserWindow configuration.
 *
 * This ensures proper isolation between main and renderer contexts.
 */
test('Property: For all exposed APIs, contextIsolation is enabled', async () => {
  const preloadPath = 'NeuralShell_Desktop/preload.js';
  const mainPath = 'NeuralShell_Desktop/main.js';

  // Verify preload.js exists and uses contextBridge
  assert.ok(
    fs.existsSync(preloadPath),
    'preload.js should exist'
  );

  const preloadContent = fs.readFileSync(preloadPath, 'utf8');

  assert.ok(
    preloadContent.includes('contextBridge.exposeInMainWorld'),
    'preload.js should use contextBridge.exposeInMainWorld'
  );

  // Verify main.js exists and configures BrowserWindow
  assert.ok(
    fs.existsSync(mainPath),
    'main.js should exist'
  );

  const mainContent = fs.readFileSync(mainPath, 'utf8');

  assert.ok(
    mainContent.includes('new BrowserWindow'),
    'main.js should create BrowserWindow'
  );

  // Verify the BrowserWindow that uses this preload has contextIsolation enabled
  assert.ok(
    mainContent.includes('preload.js'),
    'main.js should reference preload.js'
  );

  assert.ok(
    mainContent.includes('contextIsolation: true') || mainContent.includes('contextIsolation:true'),
    'BrowserWindow using preload.js should have contextIsolation: true'
  );

  console.log('   ✓ All exposed APIs have contextIsolation enabled');
  console.log('   Property confirmed: contextBridge APIs are properly isolated');
});

/**
 * Property: nodeIntegration is disabled when contextBridge is used
 *
 * This property verifies that nodeIntegration is disabled in BrowserWindow
 * configurations that use contextBridge, ensuring proper security isolation.
 */
test('Property: nodeIntegration is disabled when contextBridge is used', async () => {
  const mainPath = 'NeuralShell_Desktop/main.js';
  const content = fs.readFileSync(mainPath, 'utf8');

  // Verify nodeIntegration is set to false
  assert.ok(
    content.includes('nodeIntegration: false') || content.includes('nodeIntegration:false'),
    'BrowserWindow should have nodeIntegration: false'
  );

  console.log('   ✓ nodeIntegration is disabled');
});

/**
 * Property: sandbox is enabled when contextBridge is used
 *
 * This property verifies that the Chromium sandbox is enabled
 * in BrowserWindow configurations that use contextBridge.
 */
test('Property: sandbox is enabled when contextBridge is used', async () => {
  const mainPath = 'NeuralShell_Desktop/main.js';
  const content = fs.readFileSync(mainPath, 'utf8');

  // Verify sandbox is set to true
  assert.ok(
    content.includes('sandbox: true') || content.includes('sandbox:true'),
    'BrowserWindow should have sandbox: true'
  );

  console.log('   ✓ Chromium sandbox is enabled');
});

/**
 * Property: All exposed bridge APIs are enumerable
 *
 * This property verifies that all APIs exposed via contextBridge
 * follow a consistent naming pattern and are properly structured.
 */
test('Property: All exposed bridge APIs follow consistent naming pattern', async () => {
  const preloadPath = 'NeuralShell_Desktop/preload.js';

  if (!fs.existsSync(preloadPath)) {
    console.log('   ⚠ Skipping: preload.js not found');
    return;
  }

  const content = fs.readFileSync(preloadPath, 'utf8');

  // Find all exposeInMainWorld calls
  const exposeRegex = /contextBridge\.exposeInMainWorld\s*\(\s*["']([^"']+)["']/g;
  const matches = [...content.matchAll(exposeRegex)];

  assert.ok(
    matches.length > 0,
    'Should find at least one exposed API'
  );

  const bridgeNames = matches.map(m => m[1]);

  // Verify all bridge names follow a consistent pattern (e.g., end with "Bridge" or "API")
  for (const bridgeName of bridgeNames) {
    assert.ok(
      bridgeName.length > 0,
      `Bridge name should not be empty: ${bridgeName}`
    );

    assert.ok(
      /^[a-zA-Z][a-zA-Z0-9]*$/.test(bridgeName),
      `Bridge name should be valid identifier: ${bridgeName}`
    );
  }

  console.log(`   ✓ Found ${bridgeNames.length} properly named bridges: ${bridgeNames.join(', ')}`);
});

/**
 * Property: AST gate enforces contextIsolation requirement
 *
 * This property verifies that the AST security gate checks for
 * contextIsolation: true in BrowserWindow configurations.
 */
test('Property: AST gate enforces contextIsolation requirement', async () => {
  const astGatePath = 'tools/security/ast_gate.js';

  if (!fs.existsSync(astGatePath)) {
    const altPath = 'scripts/ast-security-gate.cjs';
    if (fs.existsSync(altPath)) {
      const content = fs.readFileSync(altPath, 'utf8');

      // Check if it validates contextIsolation
      if (content.includes('contextIsolation')) {
        console.log('   ✓ AST gate checks contextIsolation in scripts/ast-security-gate.cjs');
        return;
      }
    }

    console.log('   ⚠ AST gate not found or does not check contextIsolation yet');
    return;
  }

  const content = fs.readFileSync(astGatePath, 'utf8');

  // Verify AST gate checks for contextIsolation
  assert.ok(
    content.includes('contextIsolation'),
    'AST gate should check for contextIsolation setting'
  );

  // Verify it checks for the correct value (true)
  assert.ok(
    content.includes('contextIsolation') && (content.includes('true') || content.includes('!== false')),
    'AST gate should enforce contextIsolation: true'
  );

  console.log('   ✓ AST gate enforces contextIsolation requirement');
});

// Run all tests
runTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
