/**
 * Bug Exploration Test: Insecure spawn/exec Usage Vulnerability
 * 
 * **Validates: Requirements 1.3, 2.3**
 * 
 * CRITICAL: These tests are EXPECTED TO FAIL on unfixed code.
 * Failure confirms the vulnerability exists.
 * 
 * From Fault Condition:
 * - execution.method IN ["spawn", "exec"] AND execution.location !== "kernel/taskExecutor.js"
 * 
 * Current Vulnerability in main.js:
 * - main.js imports exec from child_process
 * - llm-exec handler uses exec() with user-provided commands
 * - exec() allows shell: true by default, enabling command injection
 * - Commands inherit full environment variables
 * - No binary hash verification
 * - No task registry with fixed arguments
 * 
 * Expected Behavior (after fix):
 * - Only executeTask() from kernel/taskExecutor.js should be allowed
 * - All spawn/exec outside kernel should be banned via AST gate
 * - Task execution should use absolute binary paths with SHA256 verification
 * - Arguments should be fixed arrays (no string interpolation)
 * - shell: false should be enforced
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
  console.log('\n🧪 Running Insecure spawn/exec Usage Bug Exploration Tests\n');
  console.log('⚠️  CRITICAL: These tests SHOULD FAIL on unfixed code to prove the bug exists\n');
  
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
    console.log('⚠️  EXPECTED BEHAVIOR: Tests should fail on unfixed code');
    console.log('   This confirms the vulnerability exists as described in requirements 1.3 and 2.3\n');
    process.exit(1);
  }
}

/**
 * Test that main.js imports exec from child_process
 * This is the primary vulnerability - exec should not be used outside kernel
 */
test("Bug Exploration: main.js imports exec from child_process (SHOULD FAIL - proves bug exists)", async () => {
  const mainJsContent = fs.readFileSync('NeuralShell_Desktop/main.js', 'utf8');
  
  // Check if exec is imported from child_process
  const hasExecImport = mainJsContent.includes('require("child_process")') || 
                        mainJsContent.includes("require('child_process')");
  
  const importsExec = mainJsContent.match(/const\s*{\s*exec\s*}\s*=\s*require\s*\(\s*['"]child_process['"]\s*\)/);
  
  console.log(`   Has child_process require: ${hasExecImport}`);
  console.log(`   Imports exec: ${!!importsExec}`);
  
  // CRITICAL: This assertion SHOULD FAIL on unfixed code
  assert.strictEqual(
    importsExec,
    null,
    `VULNERABILITY CONFIRMED: main.js imports exec from child_process. ` +
    `Expected: Only kernel/taskExecutor.js should use spawn (not exec). ` +
    `Actual: Found exec import in main.js: ${importsExec ? importsExec[0] : 'N/A'}. ` +
    `This proves the bug exists as described in requirement 1.3.`
  );
});

/**
 * Test that main.js has llm-exec handler using exec()
 * This handler allows arbitrary command execution
 */
test("Bug Exploration: main.js has llm-exec handler with exec() (SHOULD FAIL - proves bug exists)", async () => {
  const mainJsContent = fs.readFileSync('NeuralShell_Desktop/main.js', 'utf8');
  
  // Check for llm-exec handler
  const hasLlmExecHandler = mainJsContent.includes('registerHandle("llm-exec"') || 
                            mainJsContent.includes("registerHandle('llm-exec'");
  
  // Check if it uses exec()
  const execUsageMatch = mainJsContent.match(/exec\s*\(\s*command/);
  
  console.log(`   Has llm-exec handler: ${hasLlmExecHandler}`);
  console.log(`   Uses exec() with command variable: ${!!execUsageMatch}`);
  
  // CRITICAL: This assertion SHOULD FAIL on unfixed code
  // On unfixed code: hasLlmExecHandler=true, execUsageMatch=<match>, so assertion fails
  // On fixed code: hasLlmExecHandler=true, execUsageMatch=null, so assertion passes
  assert.strictEqual(
    !!execUsageMatch,
    false,
    `VULNERABILITY CONFIRMED: main.js has llm-exec handler that uses exec() with user commands. ` +
    `Expected: Command execution should use executeTask() from kernel/taskExecutor.js. ` +
    `Actual: Found llm-exec handler using exec(command, ...). ` +
    `This proves the bug exists as described in requirement 1.3.`
  );
});

/**
 * Test that exec() is called with shell enabled (default behavior)
 * exec() enables shell by default, allowing command injection
 */
test("Bug Exploration: exec() allows shell command injection (SHOULD FAIL - proves bug exists)", async () => {
  const mainJsContent = fs.readFileSync('NeuralShell_Desktop/main.js', 'utf8');
  
  // Find exec() calls
  const execCalls = mainJsContent.match(/exec\s*\([^)]+\)/g);
  
  if (!execCalls || execCalls.length === 0) {
    console.log(`   No exec() calls found - test not applicable`);
    return;
  }
  
  console.log(`   Number of exec() calls: ${execCalls.length}`);
  
  // Check if any exec call explicitly sets shell: false
  const hasShellFalse = mainJsContent.includes('shell: false') && 
                        mainJsContent.indexOf('shell: false') > mainJsContent.indexOf('exec(');
  
  console.log(`   Has shell: false in exec options: ${hasShellFalse}`);
  
  // CRITICAL: This assertion SHOULD FAIL on unfixed code
  // exec() enables shell by default, which is a security vulnerability
  assert.strictEqual(
    execCalls.length === 0 || hasShellFalse,
    true,
    `VULNERABILITY CONFIRMED: exec() is used without shell: false, enabling command injection. ` +
    `Expected: spawn() with shell: false should be used, or better yet, executeTask(). ` +
    `Actual: Found ${execCalls.length} exec() call(s) without shell: false. ` +
    `This proves the bug exists as described in requirement 1.3.`
  );
});

/**
 * Test that commands use variable interpolation instead of fixed arguments
 * Variable interpolation allows command injection
 */
test("Bug Exploration: Commands use variable interpolation (SHOULD FAIL - proves bug exists)", async () => {
  const mainJsContent = fs.readFileSync('NeuralShell_Desktop/main.js', 'utf8');
  
  // Look for exec with command variable
  const hasCommandVariable = mainJsContent.match(/exec\s*\(\s*command\s*,/);
  
  console.log(`   Uses command variable in exec(): ${!!hasCommandVariable}`);
  
  // CRITICAL: This assertion SHOULD FAIL on unfixed code
  assert.strictEqual(
    hasCommandVariable,
    null,
    `VULNERABILITY CONFIRMED: exec() uses variable interpolation (command parameter). ` +
    `Expected: Fixed argument arrays should be used (no string interpolation). ` +
    `Actual: Found exec(command, ...) allowing arbitrary command execution. ` +
    `This proves the bug exists as described in requirement 2.3.`
  );
});

/**
 * Test that no task registry with verified binaries exists
 * Without a task registry, there's no control over what can be executed
 */
test("Bug Exploration: No task registry with binary verification (SHOULD FAIL - proves bug exists)", async () => {
  const mainJsContent = fs.readFileSync('NeuralShell_Desktop/main.js', 'utf8');
  
  // Check for task registry
  const hasTaskRegistry = mainJsContent.includes('TASK_REGISTRY') || 
                          mainJsContent.includes('taskRegistry');
  
  // Check for binary hash verification
  const hasBinaryVerification = mainJsContent.includes('verifyBinaryHash') || 
                                mainJsContent.includes('SHA256') ||
                                (mainJsContent.includes('hash') && mainJsContent.includes('binary'));
  
  console.log(`   Has task registry: ${hasTaskRegistry}`);
  console.log(`   Has binary hash verification: ${hasBinaryVerification}`);
  
  // CRITICAL: This assertion SHOULD FAIL on unfixed code
  assert.strictEqual(
    hasTaskRegistry && hasBinaryVerification,
    true,
    `VULNERABILITY CONFIRMED: main.js lacks task registry with binary hash verification. ` +
    `Expected: Task registry with absolute paths and SHA256 verification (like kernel/execution.js). ` +
    `Actual: No task registry or binary verification found in main.js. ` +
    `This proves the bug exists as described in requirement 2.3.`
  );
});

/**
 * Test that environment variables are inherited (not restricted)
 * Full environment inheritance exposes sensitive data
 */
test("Bug Exploration: Commands inherit full environment (SHOULD FAIL - proves bug exists)", async () => {
  const mainJsContent = fs.readFileSync('NeuralShell_Desktop/main.js', 'utf8');
  
  // Look for exec call and check if it restricts environment
  const execMatch = mainJsContent.match(/exec\s*\([^)]+\)/);
  
  if (!execMatch) {
    console.log(`   No exec() call found - test not applicable`);
    return;
  }
  
  // Check if IMMUTABLE_ENV or restricted env is used
  const hasRestrictedEnv = mainJsContent.includes('IMMUTABLE_ENV') || 
                           (mainJsContent.includes('env:') && mainJsContent.includes('freeze'));
  
  console.log(`   Has restricted environment: ${hasRestrictedEnv}`);
  
  // CRITICAL: This assertion SHOULD FAIL on unfixed code
  assert.strictEqual(
    hasRestrictedEnv,
    true,
    `VULNERABILITY CONFIRMED: exec() inherits full environment variables. ` +
    `Expected: Restricted environment like IMMUTABLE_ENV (see kernel/execution.js). ` +
    `Actual: No environment restriction found in exec() call. ` +
    `This proves the bug exists as described in requirement 2.3.`
  );
});

/**
 * Test that bin/ollama-start.js also uses exec (additional vulnerability)
 * This file is outside the kernel and uses exec
 */
test("Bug Exploration: bin/ollama-start.js uses exec outside kernel (SHOULD FAIL - proves bug exists)", async () => {
  const ollamaStartPath = 'NeuralShell_Desktop/bin/ollama-start.js';
  
  if (!fs.existsSync(ollamaStartPath)) {
    console.log(`   ${ollamaStartPath} not found - skipping test`);
    return;
  }
  
  const ollamaContent = fs.readFileSync(ollamaStartPath, 'utf8');
  
  // Check if it uses exec
  const hasExecImport = ollamaContent.includes('require("child_process")') || 
                        ollamaContent.includes("require('child_process')");
  
  const usesExec = ollamaContent.match(/exec\s*\(/);
  
  console.log(`   bin/ollama-start.js imports child_process: ${hasExecImport}`);
  console.log(`   bin/ollama-start.js uses exec(): ${!!usesExec}`);
  
  // CRITICAL: This assertion SHOULD FAIL on unfixed code
  assert.strictEqual(
    usesExec,
    null,
    `VULNERABILITY CONFIRMED: bin/ollama-start.js uses exec() outside kernel. ` +
    `Expected: Only kernel/taskExecutor.js should use spawn (not exec). ` +
    `Actual: Found exec() usage in bin/ollama-start.js. ` +
    `This proves the bug exists as described in requirement 1.3.`
  );
});

/**
 * Test that kernel/execution.js has the correct implementation (reference check)
 * This verifies what the correct pattern should look like
 */
test("Reference: kernel/execution.js uses spawn with shell: false (should pass)", async () => {
  const kernelPath = 'src/kernel/execution.js';
  
  if (!fs.existsSync(kernelPath)) {
    console.log(`   ${kernelPath} not found - skipping reference check`);
    return;
  }
  
  const kernelContent = fs.readFileSync(kernelPath, 'utf8');
  
  // Check for spawn (not exec)
  const usesSpawn = kernelContent.includes('spawn(');
  const usesExec = kernelContent.includes('exec(');
  
  // Check for shell: false
  const hasShellFalse = kernelContent.includes('shell: false');
  
  // Check for task registry
  const hasTaskRegistry = kernelContent.includes('TASK_REGISTRY');
  
  // Check for binary verification
  const hasBinaryVerification = kernelContent.includes('verifyBinaryHash');
  
  console.log(`   kernel/execution.js uses spawn: ${usesSpawn}`);
  console.log(`   kernel/execution.js uses exec: ${usesExec}`);
  console.log(`   kernel/execution.js has shell: false: ${hasShellFalse}`);
  console.log(`   kernel/execution.js has TASK_REGISTRY: ${hasTaskRegistry}`);
  console.log(`   kernel/execution.js has verifyBinaryHash: ${hasBinaryVerification}`);
  
  // This should pass - kernel/execution.js is the reference implementation
  assert.strictEqual(usesSpawn, true, 'kernel/execution.js should use spawn');
  assert.strictEqual(usesExec, false, 'kernel/execution.js should not use exec');
  assert.strictEqual(hasShellFalse, true, 'kernel/execution.js should have shell: false');
  assert.strictEqual(hasTaskRegistry, true, 'kernel/execution.js should have TASK_REGISTRY');
  assert.strictEqual(hasBinaryVerification, true, 'kernel/execution.js should verify binary hashes');
});

/**
 * Test that executeTask() is exported from kernel/execution.js (reference check)
 */
test("Reference: kernel/execution.js exports executeTask (should pass)", async () => {
  const kernelPath = 'src/kernel/execution.js';
  
  if (!fs.existsSync(kernelPath)) {
    console.log(`   ${kernelPath} not found - skipping reference check`);
    return;
  }
  
  const kernelContent = fs.readFileSync(kernelPath, 'utf8');
  
  // Check for executeTask export
  const exportsExecuteTask = kernelContent.includes('executeTask') && 
                             (kernelContent.includes('module.exports') || kernelContent.includes('export'));
  
  console.log(`   kernel/execution.js exports executeTask: ${exportsExecuteTask}`);
  
  // This should pass
  assert.strictEqual(
    exportsExecuteTask,
    true,
    'kernel/execution.js should export executeTask function'
  );
});

/**
 * Test that main.js does NOT import executeTask from kernel (proves it's not using secure execution)
 */
test("Bug Exploration: main.js does not use executeTask from kernel (SHOULD FAIL - proves bug exists)", async () => {
  const mainJsContent = fs.readFileSync('NeuralShell_Desktop/main.js', 'utf8');
  
  // Check if main.js imports executeTask from kernel
  const importsExecuteTask = mainJsContent.includes('executeTask') && 
                             (mainJsContent.includes('kernel/execution') || 
                              mainJsContent.includes('kernel/taskExecutor'));
  
  console.log(`   main.js imports executeTask from kernel: ${importsExecuteTask}`);
  
  // CRITICAL: This assertion SHOULD FAIL on unfixed code
  assert.strictEqual(
    importsExecuteTask,
    true,
    `VULNERABILITY CONFIRMED: main.js does not use executeTask from kernel. ` +
    `Expected: main.js should import and use executeTask() from kernel/execution.js. ` +
    `Actual: No import of executeTask found in main.js. ` +
    `This proves the bug exists as described in requirement 2.3.`
  );
});

// Run all tests
runTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
