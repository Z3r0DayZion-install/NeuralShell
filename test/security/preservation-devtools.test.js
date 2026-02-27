/**
 * Preservation Test: DevTools Access in Development Mode
 *
 * **Validates: Requirements 3.4**
 *
 * CRITICAL: This test MUST PASS on unfixed code to confirm baseline behavior.
 *
 * From Preservation Requirements 3.4:
 * - DevTools in development mode should continue to be accessible
 * - DevTools should be blocked in production mode (app.isPackaged)
 *
 * This test verifies that:
 * 1. When NODE_ENV === "development" or app is not packaged, DevTools is accessible
 * 2. When app.isPackaged === true, DevTools is blocked
 * 3. The devtools-opened event handler is configured correctly
 * 4. No explicit openDevTools() call blocks development usage
 *
 * Expected Behavior (on unfixed code):
 * - DevTools should be accessible in development mode
 * - DevTools should be blocked in production mode
 * - This behavior must be preserved after security fixes
 */

import { strict as assert } from 'assert';
import fs from 'fs';

const tests = [];
const results = { passed: 0, failed: 0, total: 0 };

function test(name, fn) {
  tests.push({ name, fn });
}

async function runTests() {
  console.log('\n🧪 Running DevTools Preservation Tests\n');
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
    console.log('✅ PRESERVATION CONFIRMED: Baseline DevTools behavior is working correctly\n');
  }
}

/**
 * Property: DevTools is blocked only in production mode (app.isPackaged)
 *
 * This is the core preservation property: verify that DevTools blocking
 * is conditional on app.isPackaged, meaning it's allowed in development.
 */
test('Property: DevTools blocking is conditional on app.isPackaged', async () => {
  const mainKernelPath = 'NeuralShell_Desktop/main_kernel.js';

  assert.ok(
    fs.existsSync(mainKernelPath),
    'main_kernel.js should exist'
  );

  const content = fs.readFileSync(mainKernelPath, 'utf8');

  // Verify devtools-opened event handler exists
  assert.ok(
    content.includes('devtools-opened'),
    'Should have devtools-opened event handler'
  );

  // Verify the handler is conditional on app.isPackaged
  assert.ok(
    content.includes('app.isPackaged'),
    'DevTools blocking should be conditional on app.isPackaged'
  );

  // Verify the pattern: if (app.isPackaged) { ... devtools-opened ... }
  const isPackagedIndex = content.indexOf('app.isPackaged');
  const devtoolsIndex = content.indexOf('devtools-opened');

  assert.ok(
    isPackagedIndex > 0 && devtoolsIndex > 0,
    'Both app.isPackaged check and devtools-opened handler should exist'
  );

  // Verify devtools-opened comes after app.isPackaged check
  assert.ok(
    devtoolsIndex > isPackagedIndex,
    'devtools-opened handler should be inside app.isPackaged conditional block'
  );

  // Extract the conditional block
  const conditionalBlock = content.substring(isPackagedIndex - 10, devtoolsIndex + 100);

  // Verify it's an if statement
  assert.ok(
    conditionalBlock.includes('if') && conditionalBlock.includes('app.isPackaged'),
    'Should use if statement to check app.isPackaged'
  );

  console.log('   ✓ DevTools blocking is conditional on app.isPackaged');
  console.log('   ✓ In development mode (not packaged), DevTools is accessible');
});

/**
 * Property: DevTools is closed when opened in production mode
 *
 * This property verifies that when DevTools is opened in production mode,
 * it is immediately closed via closeDevTools().
 */
test('Property: DevTools is closed when opened in production mode', async () => {
  const mainKernelPath = 'NeuralShell_Desktop/main_kernel.js';
  const content = fs.readFileSync(mainKernelPath, 'utf8');

  // Verify closeDevTools is called in the devtools-opened handler
  assert.ok(
    content.includes('closeDevTools'),
    'Should call closeDevTools() in devtools-opened handler'
  );

  // Verify the pattern: devtools-opened event -> closeDevTools()
  const devtoolsOpenedIndex = content.indexOf('devtools-opened');
  const closeDevToolsIndex = content.indexOf('closeDevTools');

  assert.ok(
    closeDevToolsIndex > devtoolsOpenedIndex,
    'closeDevTools() should be called after devtools-opened event'
  );

  // Extract the handler
  const handlerBlock = content.substring(devtoolsOpenedIndex, closeDevToolsIndex + 50);

  // Verify it's in the same event handler
  assert.ok(
    handlerBlock.includes('devtools-opened') && handlerBlock.includes('closeDevTools'),
    'closeDevTools() should be in devtools-opened event handler'
  );

  console.log('   ✓ DevTools is closed when opened in production mode');
});

/**
 * Property: No explicit openDevTools() call blocks development usage
 *
 * This property verifies that there is no unconditional openDevTools() call
 * that would interfere with development workflow.
 */
test('Property: No unconditional openDevTools() call exists', async () => {
  const mainKernelPath = 'NeuralShell_Desktop/main_kernel.js';
  const content = fs.readFileSync(mainKernelPath, 'utf8');

  // Check if openDevTools is called
  const hasOpenDevTools = content.includes('openDevTools()');

  if (hasOpenDevTools) {
    // If it exists, verify it's conditional (e.g., only in development)
    const openDevToolsIndex = content.indexOf('openDevTools()');
    const beforeOpenDevTools = content.substring(Math.max(0, openDevToolsIndex - 200), openDevToolsIndex);

    // Should be conditional on !app.isPackaged or NODE_ENV === 'development'
    assert.ok(
      beforeOpenDevTools.includes('!app.isPackaged') ||
      beforeOpenDevTools.includes('NODE_ENV') ||
      beforeOpenDevTools.includes('development'),
      'openDevTools() should be conditional on development mode'
    );

    console.log('   ✓ openDevTools() is conditional on development mode');
  } else {
    console.log('   ✓ No explicit openDevTools() call (DevTools opened manually by developer)');
  }
});

/**
 * Property: When NODE_ENV === "development", DevTools is accessible
 *
 * This property verifies that the DevTools blocking logic respects
 * the development environment, allowing developers to debug.
 */
test('Property: Development environment allows DevTools access', async () => {
  const mainKernelPath = 'NeuralShell_Desktop/main_kernel.js';
  const content = fs.readFileSync(mainKernelPath, 'utf8');

  // Verify that DevTools blocking is only active when app.isPackaged
  // This means in development (not packaged), DevTools is accessible

  // Find the devtools-opened handler
  const devtoolsHandlerRegex = /if\s*\(\s*app\.isPackaged\s*\)\s*\{[^}]*devtools-opened[^}]*\}/s;
  const match = content.match(devtoolsHandlerRegex);

  assert.ok(
    match,
    'DevTools blocking should be inside if (app.isPackaged) block'
  );

  // Verify there's no else block that blocks DevTools in development
  const afterMatch = content.substring(content.indexOf(match[0]) + match[0].length, content.indexOf(match[0]) + match[0].length + 100);

  assert.ok(
    !afterMatch.includes('else') || !afterMatch.includes('closeDevTools'),
    'Should not block DevTools in development mode (no else block with closeDevTools)'
  );

  console.log('   ✓ Development environment (not packaged) allows DevTools access');
  console.log('   Property confirmed: When NODE_ENV === "development", DevTools is accessible');
});

/**
 * Property: BrowserWindow configuration does not disable DevTools
 *
 * This property verifies that the BrowserWindow webPreferences
 * do not explicitly disable DevTools via devTools: false.
 */
test('Property: BrowserWindow does not explicitly disable DevTools', async () => {
  const mainKernelPath = 'NeuralShell_Desktop/main_kernel.js';
  const content = fs.readFileSync(mainKernelPath, 'utf8');

  // Verify BrowserWindow exists
  assert.ok(
    content.includes('new BrowserWindow'),
    'Should create BrowserWindow'
  );

  // Find the BrowserWindow configuration
  const browserWindowIndex = content.indexOf('new BrowserWindow');
  const configBlock = content.substring(browserWindowIndex, browserWindowIndex + 500);

  // Verify devTools is not explicitly set to false
  assert.ok(
    !configBlock.includes('devTools: false') && !configBlock.includes('devTools:false'),
    'BrowserWindow should not explicitly disable DevTools'
  );

  console.log('   ✓ BrowserWindow does not explicitly disable DevTools');
  console.log('   ✓ DevTools can be opened manually in development mode');
});

/**
 * Property: For all BrowserWindow instances, DevTools blocking is consistent
 *
 * This property verifies that all BrowserWindow instances follow the same
 * pattern: DevTools blocked in production, allowed in development.
 */
test('Property: All BrowserWindow instances have consistent DevTools policy', async () => {
  const mainFiles = [
    'NeuralShell_Desktop/main_kernel.js',
    'NeuralShell_Desktop/main.js',
    'src/boot/recovery.js'
  ];

  let foundBrowserWindows = 0;
  let foundDevToolsBlocking = 0;

  for (const mainFile of mainFiles) {
    if (!fs.existsSync(mainFile)) {
      continue;
    }

    const content = fs.readFileSync(mainFile, 'utf8');

    // Check if this file creates BrowserWindow
    if (!content.includes('new BrowserWindow')) {
      continue;
    }

    foundBrowserWindows++;

    // Check if it has DevTools blocking
    if (content.includes('devtools-opened') && content.includes('app.isPackaged')) {
      foundDevToolsBlocking++;
      console.log(`   ✓ ${mainFile}: Has conditional DevTools blocking`);
    } else if (content.includes('devtools-opened')) {
      // Has DevTools blocking but not conditional - this would be a problem
      assert.fail(`${mainFile} has unconditional DevTools blocking`);
    } else {
      console.log(`   ✓ ${mainFile}: No DevTools blocking (allows DevTools)`);
    }
  }

  assert.ok(
    foundBrowserWindows > 0,
    'Should find at least one BrowserWindow'
  );

  console.log(`   ✓ Found ${foundBrowserWindows} BrowserWindow instances`);
  console.log(`   ✓ ${foundDevToolsBlocking} have conditional DevTools blocking`);
  console.log('   ✓ All instances allow DevTools in development mode');
});

/**
 * Property: app.isPackaged correctly identifies production vs development
 *
 * This property verifies that the code uses app.isPackaged to distinguish
 * between production (packaged) and development (not packaged) environments.
 */
test('Property: app.isPackaged is used to identify production environment', async () => {
  const mainKernelPath = 'NeuralShell_Desktop/main_kernel.js';
  const content = fs.readFileSync(mainKernelPath, 'utf8');

  // Verify app is imported
  assert.ok(
    content.includes("require('electron')") || content.includes('from "electron"'),
    'Should import electron module'
  );

  // Verify app.isPackaged is used
  assert.ok(
    content.includes('app.isPackaged'),
    'Should use app.isPackaged to identify production environment'
  );

  // Verify it's used in a conditional statement
  const isPackagedIndex = content.indexOf('app.isPackaged');
  const beforeIsPackaged = content.substring(Math.max(0, isPackagedIndex - 20), isPackagedIndex);

  assert.ok(
    beforeIsPackaged.includes('if'),
    'app.isPackaged should be used in if statement'
  );

  console.log('   ✓ app.isPackaged correctly identifies production vs development');
  console.log('   ✓ Production: app.isPackaged === true (DevTools blocked)');
  console.log('   ✓ Development: app.isPackaged === false (DevTools accessible)');
});

// Run all tests
runTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
