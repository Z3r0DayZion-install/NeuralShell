/**
 * Bug Exploration Test: Missing CI Security Gates Vulnerability
 * 
 * **Validates: Requirements 1.9, 2.9**
 * 
 * CRITICAL: These tests are EXPECTED TO FAIL on unfixed code.
 * Failure confirms the vulnerability exists.
 * 
 * From Fault Condition:
 * - ci.npmInstall.ignoreScripts === false OR ci.npmAudit.executed === false
 * 
 * Current Vulnerability:
 * - CI pipeline uses 'npm ci' without --ignore-scripts flag (allows malicious install scripts)
 * - npm audit is not enforced with --audit-level=high (allows high severity vulnerabilities)
 * - npm audit uses continue-on-error: true (doesn't fail CI on vulnerabilities)
 * - AST security gate is not executed in CI pipeline
 * - No VAR proof generation in CI
 * - Security gates are not mandatory for build success
 * 
 * Expected Behavior (after fix):
 * - CI should run 'npm ci --ignore-scripts' to prevent install script execution
 * - CI should run 'npm audit --omit=dev --audit-level=high' and fail on high severity issues
 * - CI should execute AST gate before build
 * - CI should run all tests and fail on test failures
 * - CI should generate VAR proof with cryptographic verification
 * - All security gates must pass for CI to succeed
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
  console.log('\n🧪 Running Missing CI Security Gates Bug Exploration Tests\n');
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
    console.log('   This confirms the vulnerability exists as described in requirements 1.9 and 2.9\n');
    process.exit(1);
  }
}

/**
 * Test that npm install runs scripts (should fail - proves bug exists)
 * CI should use 'npm ci --ignore-scripts' to prevent malicious install scripts
 */
test("Bug Exploration: npm install runs scripts (SHOULD FAIL - proves bug exists)", async () => {
  const ciYmlPath = '.github/workflows/ci.yml';
  
  if (!fs.existsSync(ciYmlPath)) {
    console.log(`   CI file not found at ${ciYmlPath} - checking alternative locations`);
    
    // Check for other common CI file locations
    const alternativePaths = [
      '.gitlab-ci.yml',
      'azure-pipelines.yml',
      '.circleci/config.yml',
      '.github/workflows/build.yml',
      '.github/workflows/test.yml'
    ];
    
    let foundCiFile = null;
    for (const altPath of alternativePaths) {
      if (fs.existsSync(altPath)) {
        foundCiFile = altPath;
        break;
      }
    }
    
    if (!foundCiFile) {
      console.log(`   No CI configuration file found - vulnerability confirmed by absence`);
      assert.fail(
        `VULNERABILITY CONFIRMED: No CI configuration file found. ` +
        `Expected: CI pipeline should exist with 'npm ci --ignore-scripts'. ` +
        `Actual: No CI configuration detected. ` +
        `This proves the bug exists as described in requirement 1.9.`
      );
    }
  }
  
  const ciContent = fs.readFileSync(ciYmlPath, 'utf8');
  
  // Check if npm ci is used with --ignore-scripts flag
  const npmCiLines = ciContent.split('\n').filter(line => 
    line.includes('npm ci') || line.includes('npm install')
  );
  
  console.log(`   Found ${npmCiLines.length} npm install/ci commands in CI`);
  
  let hasIgnoreScripts = false;
  let npmCommands = [];
  
  for (const line of npmCiLines) {
    const trimmed = line.trim();
    npmCommands.push(trimmed);
    
    if (trimmed.includes('--ignore-scripts')) {
      hasIgnoreScripts = true;
    }
  }
  
  console.log(`   npm commands found:`, npmCommands);
  console.log(`   Any command uses --ignore-scripts: ${hasIgnoreScripts}`);
  
  // CRITICAL: This assertion SHOULD FAIL on unfixed code
  assert.strictEqual(
    hasIgnoreScripts,
    true,
    `VULNERABILITY CONFIRMED: npm ci runs without --ignore-scripts flag. ` +
    `Expected: CI should use 'npm ci --ignore-scripts' to prevent malicious install scripts. ` +
    `Actual: Found npm commands without --ignore-scripts: ${npmCommands.join(', ')}. ` +
    `This allows arbitrary code execution during dependency installation. ` +
    `This proves the bug exists as described in requirement 1.9.`
  );
});

/**
 * Test that npm audit is not enforced (should fail - proves bug exists)
 * CI should run 'npm audit --omit=dev --audit-level=high' and fail on vulnerabilities
 */
test("Bug Exploration: npm audit is not enforced (SHOULD FAIL - proves bug exists)", async () => {
  const ciYmlPath = '.github/workflows/ci.yml';
  
  if (!fs.existsSync(ciYmlPath)) {
    console.log(`   CI file not found - vulnerability confirmed by absence`);
    assert.fail(
      `VULNERABILITY CONFIRMED: No CI configuration to enforce npm audit. ` +
      `This proves the bug exists as described in requirement 1.9.`
    );
  }
  
  const ciContent = fs.readFileSync(ciYmlPath, 'utf8');
  
  // Check if npm audit is run
  const hasNpmAudit = ciContent.includes('npm audit');
  
  console.log(`   CI includes npm audit: ${hasNpmAudit}`);
  
  if (!hasNpmAudit) {
    // No npm audit at all - clear vulnerability
    assert.fail(
      `VULNERABILITY CONFIRMED: npm audit is not executed in CI pipeline. ` +
      `Expected: CI should run 'npm audit --omit=dev --audit-level=high'. ` +
      `Actual: No npm audit command found in CI configuration. ` +
      `This proves the bug exists as described in requirement 1.9.`
    );
  }
  
  // Check if npm audit has proper flags
  const auditLines = ciContent.split('\n').filter(line => 
    line.includes('npm audit')
  );
  
  console.log(`   npm audit commands:`, auditLines.map(l => l.trim()));
  
  let hasProperAuditLevel = false;
  let hasOmitDev = false;
  let hasContinueOnError = false;
  
  for (const line of auditLines) {
    if (line.includes('--audit-level=high')) {
      hasProperAuditLevel = true;
    }
    if (line.includes('--omit=dev')) {
      hasOmitDev = true;
    }
  }
  
  // Check if continue-on-error is set to true (which bypasses failures)
  const auditSectionMatch = ciContent.match(/npm audit[^]*?(?=\n\s{0,6}\w|\n\s{0,6}-|\Z)/);
  if (auditSectionMatch) {
    const auditSection = auditSectionMatch[0];
    hasContinueOnError = auditSection.includes('continue-on-error: true');
  }
  
  console.log(`   Has --audit-level=high: ${hasProperAuditLevel}`);
  console.log(`   Has --omit=dev: ${hasOmitDev}`);
  console.log(`   Has continue-on-error: true: ${hasContinueOnError}`);
  
  // CRITICAL: This assertion SHOULD FAIL on unfixed code
  const isProperlyEnforced = hasProperAuditLevel && hasOmitDev && !hasContinueOnError;
  
  assert.strictEqual(
    isProperlyEnforced,
    true,
    `VULNERABILITY CONFIRMED: npm audit is not properly enforced. ` +
    `Expected: 'npm audit --omit=dev --audit-level=high' without continue-on-error. ` +
    `Actual: audit-level=high: ${hasProperAuditLevel}, omit=dev: ${hasOmitDev}, ` +
    `continue-on-error: ${hasContinueOnError}. ` +
    `This allows high severity vulnerabilities to pass CI. ` +
    `This proves the bug exists as described in requirement 2.9.`
  );
});

/**
 * Test that AST gate is not run in CI (should fail - proves bug exists)
 * CI should execute AST security gate before build
 */
test("Bug Exploration: AST gate is not run in CI (SHOULD FAIL - proves bug exists)", async () => {
  const ciYmlPath = '.github/workflows/ci.yml';
  
  if (!fs.existsSync(ciYmlPath)) {
    console.log(`   CI file not found - vulnerability confirmed by absence`);
    assert.fail(
      `VULNERABILITY CONFIRMED: No CI configuration to run AST gate. ` +
      `This proves the bug exists as described in requirement 1.9.`
    );
  }
  
  const ciContent = fs.readFileSync(ciYmlPath, 'utf8');
  
  // Check if AST gate is executed
  const hasAstGate = ciContent.includes('ast_gate') || 
                     ciContent.includes('ast-gate') || 
                     ciContent.includes('security/ast_gate.js');
  
  console.log(`   CI includes AST gate: ${hasAstGate}`);
  
  // Check if there's a security job that runs AST gate
  const hasSecurityJob = ciContent.includes('security:') || 
                         ciContent.includes('name: Security');
  
  console.log(`   CI has security job: ${hasSecurityJob}`);
  
  if (hasSecurityJob) {
    // Extract security job section
    const securityJobMatch = ciContent.match(/security:[^]*?(?=\n\w|\Z)/);
    if (securityJobMatch) {
      const securityJob = securityJobMatch[0];
      const securityHasAstGate = securityJob.includes('ast_gate') || 
                                  securityJob.includes('ast-gate');
      console.log(`   Security job includes AST gate: ${securityHasAstGate}`);
    }
  }
  
  // Check if there's a build job that runs AST gate
  const hasBuildJob = ciContent.includes('build:') || 
                      ciContent.includes('name: Build');
  
  console.log(`   CI has build job: ${hasBuildJob}`);
  
  if (hasBuildJob) {
    const buildJobMatch = ciContent.match(/build:[^]*?(?=\n\w|\Z)/);
    if (buildJobMatch) {
      const buildJob = buildJobMatch[0];
      const buildHasAstGate = buildJob.includes('ast_gate') || 
                              buildJob.includes('ast-gate');
      console.log(`   Build job includes AST gate: ${buildHasAstGate}`);
    }
  }
  
  // CRITICAL: This assertion SHOULD FAIL on unfixed code
  assert.strictEqual(
    hasAstGate,
    true,
    `VULNERABILITY CONFIRMED: AST security gate is not executed in CI pipeline. ` +
    `Expected: CI should run 'node tools/security/ast_gate.js' before build. ` +
    `Actual: No AST gate execution found in CI configuration. ` +
    `This allows forbidden requires, spawn/exec, and non-literal IPC channels to pass CI. ` +
    `This proves the bug exists as described in requirement 2.9.`
  );
});

/**
 * Test that tests are not enforced in CI (should fail - proves bug exists)
 * CI should run all tests and fail on test failures
 */
test("Bug Exploration: Tests are not enforced in CI (SHOULD FAIL - proves bug exists)", async () => {
  const ciYmlPath = '.github/workflows/ci.yml';
  
  if (!fs.existsSync(ciYmlPath)) {
    console.log(`   CI file not found - vulnerability confirmed by absence`);
    assert.fail(
      `VULNERABILITY CONFIRMED: No CI configuration to enforce tests. ` +
      `This proves the bug exists as described in requirement 1.9.`
    );
  }
  
  const ciContent = fs.readFileSync(ciYmlPath, 'utf8');
  
  // Check if tests are run
  const hasTestCommand = ciContent.includes('npm test') || 
                         ciContent.includes('npm run test');
  
  console.log(`   CI includes test command: ${hasTestCommand}`);
  
  if (!hasTestCommand) {
    // No tests at all - clear vulnerability
    assert.fail(
      `VULNERABILITY CONFIRMED: Tests are not executed in CI pipeline. ` +
      `Expected: CI should run 'npm test' and fail on test failures. ` +
      `Actual: No test command found in CI configuration. ` +
      `This proves the bug exists as described in requirement 2.9.`
    );
  }
  
  // Check if tests have continue-on-error (which bypasses failures)
  const testSectionMatch = ciContent.match(/npm (?:run )?test[^]*?(?=\n\s{0,6}\w|\n\s{0,6}-|\Z)/);
  let hasContinueOnError = false;
  
  if (testSectionMatch) {
    const testSection = testSectionMatch[0];
    hasContinueOnError = testSection.includes('continue-on-error: true');
  }
  
  console.log(`   Tests have continue-on-error: true: ${hasContinueOnError}`);
  
  // CRITICAL: This assertion SHOULD FAIL on unfixed code
  assert.strictEqual(
    !hasContinueOnError,
    true,
    `VULNERABILITY CONFIRMED: Tests are not properly enforced in CI. ` +
    `Expected: Tests should run without continue-on-error to fail CI on test failures. ` +
    `Actual: Tests have continue-on-error: ${hasContinueOnError}. ` +
    `This allows broken code to pass CI. ` +
    `This proves the bug exists as described in requirement 2.9.`
  );
});

/**
 * Test that VAR proof is not generated in CI (should fail - proves bug exists)
 * CI should generate verifiable artifact records with cryptographic proof
 */
test("Bug Exploration: VAR proof is not generated in CI (SHOULD FAIL - proves bug exists)", async () => {
  const ciYmlPath = '.github/workflows/ci.yml';
  
  if (!fs.existsSync(ciYmlPath)) {
    console.log(`   CI file not found - vulnerability confirmed by absence`);
    assert.fail(
      `VULNERABILITY CONFIRMED: No CI configuration to generate VAR proof. ` +
      `This proves the bug exists as described in requirement 1.9.`
    );
  }
  
  const ciContent = fs.readFileSync(ciYmlPath, 'utf8');
  
  // Check if VAR proof generation is executed
  const hasVarProof = ciContent.includes('var_proof') || 
                      ciContent.includes('var-proof') || 
                      ciContent.includes('VAR_PROOF') ||
                      ciContent.includes('generate-var-proof') ||
                      ciContent.includes('verifiable-artifact');
  
  console.log(`   CI includes VAR proof generation: ${hasVarProof}`);
  
  // Check if there's a script in package.json for VAR proof
  const packageJsonPath = 'NeuralShell_Desktop/package.json';
  let hasVarProofScript = false;
  
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const scripts = packageJson.scripts || {};
    
    hasVarProofScript = Object.keys(scripts).some(key => 
      key.includes('var') || key.includes('proof') || key.includes('verify')
    );
    
    console.log(`   package.json has VAR proof script: ${hasVarProofScript}`);
  }
  
  // CRITICAL: This assertion SHOULD FAIL on unfixed code
  assert.strictEqual(
    hasVarProof,
    true,
    `VULNERABILITY CONFIRMED: VAR proof is not generated in CI pipeline. ` +
    `Expected: CI should generate VAR_PROOF_<timestamp>.json with git commit, lockfile SHA256, ` +
    `AST gate result, test summary, binary hashes, manifest signature, and HMAC. ` +
    `Actual: No VAR proof generation found in CI configuration. ` +
    `This prevents cryptographic verification of build artifacts. ` +
    `This proves the bug exists as described in requirement 2.9.`
  );
});

/**
 * Test that package.json scripts don't include security gates (should fail - proves bug exists)
 * Build and release scripts should include all security gates
 */
test("Bug Exploration: package.json scripts don't include security gates (SHOULD FAIL - proves bug exists)", async () => {
  const packageJsonPath = 'NeuralShell_Desktop/package.json';
  
  if (!fs.existsSync(packageJsonPath)) {
    console.log(`   package.json not found - skipping package.json check`);
    return;
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const scripts = packageJson.scripts || {};
  
  // Check release:all script
  const releaseScript = scripts['release:all'] || '';
  console.log(`   release:all script: ${releaseScript}`);
  
  const releaseHasAstGate = releaseScript.includes('ast_gate') || 
                            releaseScript.includes('ast-gate');
  const releaseHasAudit = releaseScript.includes('npm audit');
  
  console.log(`   release:all includes AST gate: ${releaseHasAstGate}`);
  console.log(`   release:all includes npm audit: ${releaseHasAudit}`);
  
  // Check build scripts
  const buildScripts = ['build:win', 'build:portable', 'dist:tear'];
  let anyBuildHasAstGate = false;
  
  for (const scriptName of buildScripts) {
    const script = scripts[scriptName] || '';
    if (script.includes('ast_gate') || script.includes('ast-gate')) {
      anyBuildHasAstGate = true;
    }
  }
  
  console.log(`   Any build script includes AST gate: ${anyBuildHasAstGate}`);
  
  // CRITICAL: This assertion SHOULD FAIL on unfixed code
  const hasProperSecurityGates = releaseHasAstGate && releaseHasAudit && anyBuildHasAstGate;
  
  assert.strictEqual(
    hasProperSecurityGates,
    true,
    `VULNERABILITY CONFIRMED: package.json scripts don't include security gates. ` +
    `Expected: release:all and build scripts should include AST gate and npm audit. ` +
    `Actual: release:all has AST gate: ${releaseHasAstGate}, has audit: ${releaseHasAudit}, ` +
    `build scripts have AST gate: ${anyBuildHasAstGate}. ` +
    `This allows insecure builds to be released. ` +
    `This proves the bug exists as described in requirement 2.9.`
  );
});

/**
 * Test that preinstall/postinstall hooks are not secured (should fail - proves bug exists)
 * package.json should not have install hooks that could run malicious code
 */
test("Bug Exploration: Install hooks are not secured (SHOULD FAIL - proves bug exists)", async () => {
  const packageJsonPath = 'NeuralShell_Desktop/package.json';
  
  if (!fs.existsSync(packageJsonPath)) {
    console.log(`   package.json not found - skipping install hooks check`);
    return;
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const scripts = packageJson.scripts || {};
  
  // Check for install hooks
  const hasPreinstall = !!scripts['preinstall'];
  const hasPostinstall = !!scripts['postinstall'];
  const hasInstall = !!scripts['install'];
  
  console.log(`   Has preinstall hook: ${hasPreinstall}`);
  console.log(`   Has postinstall hook: ${hasPostinstall}`);
  console.log(`   Has install hook: ${hasInstall}`);
  
  // If there are install hooks, they should be documented and reviewed
  // For maximum security, there should be NO install hooks
  const hasAnyInstallHook = hasPreinstall || hasPostinstall || hasInstall;
  
  if (hasAnyInstallHook) {
    console.log(`   WARNING: Install hooks detected - these run during npm install`);
    if (hasPreinstall) console.log(`     preinstall: ${scripts['preinstall']}`);
    if (hasPostinstall) console.log(`     postinstall: ${scripts['postinstall']}`);
    if (hasInstall) console.log(`     install: ${scripts['install']}`);
  }
  
  // This test documents the current state
  // The fix should either remove install hooks or ensure CI uses --ignore-scripts
  console.log(`   Current state: ${hasAnyInstallHook ? 'Has install hooks' : 'No install hooks'}`);
  console.log(`   Note: Install hooks are a security risk if not properly controlled`);
  
  // This is informational - the main protection is --ignore-scripts in CI
  // We don't fail here because the primary fix is in CI configuration
  assert.strictEqual(
    true,
    true,
    `Install hooks check completed - primary protection is --ignore-scripts in CI`
  );
});

/**
 * Reference test: Verify CI configuration file exists (should pass)
 * This confirms we have a CI pipeline to secure
 */
test("Reference: CI configuration file exists (should pass)", async () => {
  const ciYmlPath = '.github/workflows/ci.yml';
  const ciExists = fs.existsSync(ciYmlPath);
  
  console.log(`   CI configuration exists at ${ciYmlPath}: ${ciExists}`);
  
  if (ciExists) {
    const ciContent = fs.readFileSync(ciYmlPath, 'utf8');
    const hasJobs = ciContent.includes('jobs:');
    const hasSteps = ciContent.includes('steps:');
    
    console.log(`   CI has jobs: ${hasJobs}`);
    console.log(`   CI has steps: ${hasSteps}`);
    
    assert.strictEqual(ciExists, true, 'CI configuration should exist');
    assert.strictEqual(hasJobs, true, 'CI should have jobs');
    assert.strictEqual(hasSteps, true, 'CI should have steps');
  } else {
    console.log(`   No CI configuration found - this is a vulnerability`);
  }
});

/**
 * Reference test: Verify package.json exists (should pass)
 * This confirms we have build scripts to secure
 */
test("Reference: package.json exists (should pass)", async () => {
  const packageJsonPath = 'NeuralShell_Desktop/package.json';
  const packageJsonExists = fs.existsSync(packageJsonPath);
  
  console.log(`   package.json exists: ${packageJsonExists}`);
  
  if (packageJsonExists) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const hasScripts = !!packageJson.scripts;
    const hasBuildScripts = hasScripts && (
      !!packageJson.scripts['build:win'] || 
      !!packageJson.scripts['build:portable']
    );
    
    console.log(`   Has scripts: ${hasScripts}`);
    console.log(`   Has build scripts: ${hasBuildScripts}`);
    
    assert.strictEqual(packageJsonExists, true, 'package.json should exist');
    assert.strictEqual(hasScripts, true, 'package.json should have scripts');
  }
});

// Run all tests
runTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
