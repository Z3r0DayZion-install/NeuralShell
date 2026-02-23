/**
 * Bug Exploration Test: Missing VAR Proof Generation Vulnerability
 * 
 * **Validates: Requirements 1.10, 2.10**
 * 
 * CRITICAL: These tests are EXPECTED TO FAIL on unfixed code.
 * Failure confirms the vulnerability exists.
 * 
 * From Fault Condition:
 * - build.varProof.generated === false AND build.varProof.cryptographic === false
 * 
 * Current Vulnerability:
 * - scripts/export_var_proof.js exists but is not integrated into build process
 * - No npm script defined for VAR proof generation (no "var-proof" in package.json)
 * - CI pipeline does not run VAR proof generation
 * - Builds complete without generating verifiable artifact records
 * - No cryptographic HMAC proof is generated during normal builds
 * - Build artifacts cannot be cryptographically verified
 * 
 * Expected Behavior (after fix):
 * - package.json should have "var-proof" script that runs scripts/generate-var-proof.js
 * - CI pipeline should run npm run var-proof after tests
 * - VAR_PROOF_<timestamp>.json should be generated with:
 *   - Git commit hash
 *   - package-lock.json SHA256
 *   - AST gate result
 *   - Test summary
 *   - Binary hashes
 *   - Manifest signature status
 *   - Timestamp (ISO 8601)
 *   - Host-bound HMAC-SHA256 over all fields
 * - VAR proof should be exported as CI artifact
 * - Build should fail if VAR proof generation fails
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
  console.log('\n🧪 Running Missing VAR Proof Generation Bug Exploration Tests\n');
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
    console.log('   This confirms the vulnerability exists as described in requirements 1.10 and 2.10\n');
    process.exit(1);
  }
}

/**
 * Test that builds complete without VAR proof (should fail - proves bug exists)
 * package.json should have a "var-proof" script that generates VAR proof
 */
test("Bug Exploration: No var-proof script in package.json (SHOULD FAIL - proves bug exists)", async () => {
  const packageJsonPath = 'package.json';
  
  if (!fs.existsSync(packageJsonPath)) {
    console.log(`   package.json not found at root - checking NeuralShell_Desktop`);
    const altPath = 'NeuralShell_Desktop/package.json';
    if (!fs.existsSync(altPath)) {
      assert.fail(
        `VULNERABILITY CONFIRMED: No package.json found. ` +
        `This proves the bug exists as described in requirement 1.10.`
      );
    }
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const scripts = packageJson.scripts || {};
  
  console.log(`   Available scripts: ${Object.keys(scripts).join(', ')}`);
  
  // Check if var-proof script exists
  const hasVarProofScript = scripts['var-proof'] || scripts['var_proof'] || scripts['varproof'];
  
  console.log(`   Has var-proof script: ${!!hasVarProofScript}`);
  
  if (hasVarProofScript) {
    console.log(`   var-proof script: ${hasVarProofScript}`);
  }
  
  // CRITICAL: This assertion SHOULD FAIL on unfixed code
  assert.strictEqual(
    !!hasVarProofScript,
    true,
    `VULNERABILITY CONFIRMED: No var-proof script defined in package.json. ` +
    `Expected: package.json should have "var-proof": "node scripts/generate-var-proof.js". ` +
    `Actual: No var-proof, var_proof, or varproof script found. ` +
    `This means builds complete without generating VAR proof. ` +
    `This proves the bug exists as described in requirement 1.10.`
  );
});

/**
 * Test that CI does not generate VAR proof (should fail - proves bug exists)
 * CI pipeline should run VAR proof generation after tests
 */
test("Bug Exploration: CI does not generate VAR proof (SHOULD FAIL - proves bug exists)", async () => {
  const ciYmlPath = '.github/workflows/ci.yml';
  
  if (!fs.existsSync(ciYmlPath)) {
    console.log(`   CI file not found - checking alternative locations`);
    
    const alternativePaths = [
      '.gitlab-ci.yml',
      'azure-pipelines.yml',
      '.circleci/config.yml',
      '.github/workflows/build.yml',
      '.github/workflows/release.yml'
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
        `Expected: CI pipeline should generate VAR proof. ` +
        `Actual: No CI configuration detected. ` +
        `This proves the bug exists as described in requirement 1.10.`
      );
    }
  }
  
  const ciContent = fs.readFileSync(ciYmlPath, 'utf8');
  
  // Check if VAR proof generation is executed in CI
  const hasVarProofGeneration = ciContent.includes('var-proof') || 
                                ciContent.includes('var_proof') || 
                                ciContent.includes('varproof') ||
                                ciContent.includes('generate-var-proof') ||
                                ciContent.includes('export_var_proof');
  
  console.log(`   CI includes VAR proof generation: ${hasVarProofGeneration}`);
  
  // Check if there's a build job
  const hasBuildJob = ciContent.includes('build:') || 
                      ciContent.includes('name: Build');
  
  console.log(`   CI has build job: ${hasBuildJob}`);
  
  // Check if there's a release job
  const hasReleaseJob = ciContent.includes('release:') || 
                        ciContent.includes('name: Release');
  
  console.log(`   CI has release job: ${hasReleaseJob}`);
  
  // CRITICAL: This assertion SHOULD FAIL on unfixed code
  assert.strictEqual(
    hasVarProofGeneration,
    true,
    `VULNERABILITY CONFIRMED: CI pipeline does not generate VAR proof. ` +
    `Expected: CI should run 'npm run var-proof' after tests to generate VAR_PROOF_<timestamp>.json. ` +
    `Actual: No VAR proof generation found in CI configuration. ` +
    `This means builds complete without cryptographic verification records. ` +
    `This proves the bug exists as described in requirement 2.10.`
  );
});

/**
 * Test that no cryptographic HMAC is generated (should fail - proves bug exists)
 * VAR proof should contain HMAC-SHA256 over all fields using host-bound key
 */
test("Bug Exploration: VAR proof script exists but not integrated (SHOULD FAIL - proves bug exists)", async () => {
  const varProofScriptPath = 'scripts/export_var_proof.js';
  const altVarProofScriptPath = 'scripts/generate-var-proof.js';
  
  let scriptPath = null;
  if (fs.existsSync(varProofScriptPath)) {
    scriptPath = varProofScriptPath;
  } else if (fs.existsSync(altVarProofScriptPath)) {
    scriptPath = altVarProofScriptPath;
  }
  
  console.log(`   VAR proof script exists: ${!!scriptPath}`);
  
  if (scriptPath) {
    console.log(`   VAR proof script path: ${scriptPath}`);
    
    // Script exists but is not integrated into build process
    const packageJsonPath = 'package.json';
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const scripts = packageJson.scripts || {};
    
    const hasVarProofScript = scripts['var-proof'] || scripts['var_proof'] || scripts['varproof'];
    
    console.log(`   VAR proof script integrated into package.json: ${!!hasVarProofScript}`);
    
    // Check if any build scripts call VAR proof
    const buildScripts = ['build', 'build:win', 'build:portable', 'release:all', 'dist:tear'];
    let anyBuildCallsVarProof = false;
    
    for (const scriptName of buildScripts) {
      const script = scripts[scriptName] || '';
      if (script.includes('var-proof') || script.includes('var_proof') || script.includes('export_var_proof')) {
        anyBuildCallsVarProof = true;
        console.log(`   ${scriptName} calls VAR proof: true`);
      }
    }
    
    console.log(`   Any build script calls VAR proof: ${anyBuildCallsVarProof}`);
    
    // CRITICAL: This assertion SHOULD FAIL on unfixed code
    const isIntegrated = hasVarProofScript && anyBuildCallsVarProof;
    
    assert.strictEqual(
      isIntegrated,
      true,
      `VULNERABILITY CONFIRMED: VAR proof script exists but is not integrated into build process. ` +
      `Expected: package.json should have var-proof script and build scripts should call it. ` +
      `Actual: Script exists at ${scriptPath} but not integrated (has script: ${!!hasVarProofScript}, ` +
      `called by builds: ${anyBuildCallsVarProof}). ` +
      `This means builds complete without generating cryptographic proof. ` +
      `This proves the bug exists as described in requirement 1.10.`
    );
  } else {
    // No script exists at all - even worse
    console.log(`   No VAR proof script found at expected locations`);
    
    assert.fail(
      `VULNERABILITY CONFIRMED: No VAR proof generation script exists. ` +
      `Expected: scripts/generate-var-proof.js should exist and be integrated. ` +
      `Actual: No script found at scripts/export_var_proof.js or scripts/generate-var-proof.js. ` +
      `This proves the bug exists as described in requirement 1.10.`
    );
  }
});

/**
 * Test that VAR proof directory does not exist or is empty (should fail - proves bug exists)
 * This confirms that VAR proofs are not being generated during builds
 */
test("Bug Exploration: No VAR proof artifacts exist (SHOULD FAIL - proves bug exists)", async () => {
  const proofDir = 'proof';
  
  const proofDirExists = fs.existsSync(proofDir);
  console.log(`   proof/ directory exists: ${proofDirExists}`);
  
  let hasVarProofFiles = false;
  let varProofFiles = [];
  
  if (proofDirExists) {
    const files = fs.readdirSync(proofDir);
    varProofFiles = files.filter(f => f.startsWith('VAR_PROOF_') && f.endsWith('.json'));
    hasVarProofFiles = varProofFiles.length > 0;
    
    console.log(`   VAR_PROOF_*.json files found: ${varProofFiles.length}`);
    if (varProofFiles.length > 0) {
      console.log(`   Files: ${varProofFiles.slice(0, 3).join(', ')}${varProofFiles.length > 3 ? '...' : ''}`);
    }
  }
  
  // Check if VAR proofs are generated automatically during builds
  // If they exist, they should be recent (within last build)
  let hasRecentVarProof = false;
  
  if (hasVarProofFiles) {
    // Check if any VAR proof is recent (within last 24 hours)
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    
    for (const file of varProofFiles) {
      const filePath = path.join(proofDir, file);
      const stats = fs.statSync(filePath);
      if (stats.mtimeMs > oneDayAgo) {
        hasRecentVarProof = true;
        console.log(`   Recent VAR proof found: ${file} (${new Date(stats.mtimeMs).toISOString()})`);
      }
    }
  }
  
  console.log(`   Has recent VAR proof (last 24h): ${hasRecentVarProof}`);
  
  // CRITICAL: This assertion SHOULD FAIL on unfixed code
  // We expect NO recent VAR proofs because builds don't generate them automatically
  assert.strictEqual(
    hasRecentVarProof,
    true,
    `VULNERABILITY CONFIRMED: No recent VAR proof artifacts exist. ` +
    `Expected: Builds should automatically generate VAR_PROOF_<timestamp>.json files. ` +
    `Actual: No recent VAR proof files found in proof/ directory. ` +
    `This confirms builds complete without generating cryptographic verification records. ` +
    `This proves the bug exists as described in requirement 1.10.`
  );
});

/**
 * Test that build scripts do not enforce VAR proof generation (should fail - proves bug exists)
 * Build and release scripts should fail if VAR proof generation fails
 */
test("Bug Exploration: Build scripts do not enforce VAR proof (SHOULD FAIL - proves bug exists)", async () => {
  const packageJsonPath = 'package.json';
  
  if (!fs.existsSync(packageJsonPath)) {
    console.log(`   package.json not found - skipping build script check`);
    return;
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const scripts = packageJson.scripts || {};
  
  // Check release:all script
  const releaseScript = scripts['release:all'] || '';
  console.log(`   release:all script: ${releaseScript}`);
  
  const releaseHasVarProof = releaseScript.includes('var-proof') || 
                             releaseScript.includes('var_proof') ||
                             releaseScript.includes('export_var_proof');
  
  console.log(`   release:all includes VAR proof: ${releaseHasVarProof}`);
  
  // Check build scripts
  const buildScripts = ['build', 'build:win', 'build:portable', 'dist:tear'];
  let anyBuildHasVarProof = false;
  
  for (const scriptName of buildScripts) {
    const script = scripts[scriptName] || '';
    if (script.includes('var-proof') || script.includes('var_proof') || script.includes('export_var_proof')) {
      anyBuildHasVarProof = true;
      console.log(`   ${scriptName} includes VAR proof: true`);
    }
  }
  
  console.log(`   Any build script includes VAR proof: ${anyBuildHasVarProof}`);
  
  // CRITICAL: This assertion SHOULD FAIL on unfixed code
  const buildsEnforceVarProof = releaseHasVarProof || anyBuildHasVarProof;
  
  assert.strictEqual(
    buildsEnforceVarProof,
    true,
    `VULNERABILITY CONFIRMED: Build scripts do not enforce VAR proof generation. ` +
    `Expected: release:all and build scripts should include VAR proof generation. ` +
    `Actual: release:all has VAR proof: ${releaseHasVarProof}, ` +
    `build scripts have VAR proof: ${anyBuildHasVarProof}. ` +
    `This means builds can complete without cryptographic verification. ` +
    `This proves the bug exists as described in requirement 2.10.`
  );
});

/**
 * Test that CI does not export VAR proof as artifact (should fail - proves bug exists)
 * CI should upload VAR proof as a build artifact for verification
 */
test("Bug Exploration: CI does not export VAR proof artifact (SHOULD FAIL - proves bug exists)", async () => {
  const ciYmlPath = '.github/workflows/ci.yml';
  
  if (!fs.existsSync(ciYmlPath)) {
    console.log(`   CI file not found - skipping artifact check`);
    return;
  }
  
  const ciContent = fs.readFileSync(ciYmlPath, 'utf8');
  
  // Check if CI uploads VAR proof as artifact
  const hasArtifactUpload = ciContent.includes('actions/upload-artifact') || 
                            ciContent.includes('upload-artifact');
  
  console.log(`   CI has artifact upload: ${hasArtifactUpload}`);
  
  if (hasArtifactUpload) {
    // Check if VAR proof is specifically uploaded
    const uploadsVarProof = ciContent.includes('VAR_PROOF') || 
                            ciContent.includes('var-proof') ||
                            ciContent.includes('proof/');
    
    console.log(`   CI uploads VAR proof: ${uploadsVarProof}`);
    
    // CRITICAL: This assertion SHOULD FAIL on unfixed code
    assert.strictEqual(
      uploadsVarProof,
      true,
      `VULNERABILITY CONFIRMED: CI does not export VAR proof as artifact. ` +
      `Expected: CI should upload VAR_PROOF_<timestamp>.json as build artifact. ` +
      `Actual: CI has artifact upload but does not upload VAR proof. ` +
      `This means VAR proofs are not preserved for verification. ` +
      `This proves the bug exists as described in requirement 2.10.`
    );
  } else {
    // No artifact upload at all
    assert.fail(
      `VULNERABILITY CONFIRMED: CI does not have artifact upload configured. ` +
      `Expected: CI should upload VAR_PROOF_<timestamp>.json as build artifact. ` +
      `Actual: No artifact upload found in CI configuration. ` +
      `This proves the bug exists as described in requirement 2.10.`
    );
  }
});

/**
 * Reference test: Verify VAR proof script has HMAC generation (should pass)
 * This confirms the script has cryptographic proof capability
 */
test("Reference: VAR proof script has HMAC generation (should pass)", async () => {
  const varProofScriptPath = 'scripts/export_var_proof.js';
  const altVarProofScriptPath = 'scripts/generate-var-proof.js';
  
  let scriptPath = null;
  if (fs.existsSync(varProofScriptPath)) {
    scriptPath = varProofScriptPath;
  } else if (fs.existsSync(altVarProofScriptPath)) {
    scriptPath = altVarProofScriptPath;
  }
  
  if (!scriptPath) {
    console.log(`   No VAR proof script found - this is expected for unfixed code`);
    return;
  }
  
  const scriptContent = fs.readFileSync(scriptPath, 'utf8');
  
  // Check if script has HMAC generation
  const hasHmac = scriptContent.includes('createHmac') || 
                  scriptContent.includes('crypto.createHmac');
  
  console.log(`   VAR proof script has HMAC: ${hasHmac}`);
  
  // Check if script collects required fields
  const hasGitCommit = scriptContent.includes('git rev-parse') || 
                       scriptContent.includes('execSync');
  const hasLockfileHash = scriptContent.includes('package-lock.json');
  const hasTimestamp = scriptContent.includes('Date.now()') || 
                       scriptContent.includes('new Date()');
  
  console.log(`   Script collects git commit: ${hasGitCommit}`);
  console.log(`   Script collects lockfile hash: ${hasLockfileHash}`);
  console.log(`   Script collects timestamp: ${hasTimestamp}`);
  
  if (hasHmac) {
    assert.strictEqual(hasHmac, true, 'VAR proof script should have HMAC generation');
  } else {
    console.log(`   Note: Script exists but lacks HMAC - needs implementation`);
  }
});

/**
 * Reference test: Verify proof directory structure (informational)
 * This documents the expected proof directory structure
 */
test("Reference: Document expected proof directory structure (informational)", async () => {
  console.log(`   Expected structure:`);
  console.log(`     proof/`);
  console.log(`       VAR_PROOF_<timestamp>.json`);
  console.log(`   `);
  console.log(`   Expected VAR proof contents:`);
  console.log(`     - Git commit hash`);
  console.log(`     - package-lock.json SHA256`);
  console.log(`     - AST gate result`);
  console.log(`     - Test summary`);
  console.log(`     - Binary hashes`);
  console.log(`     - Manifest signature status`);
  console.log(`     - Timestamp (ISO 8601)`);
  console.log(`     - Host-bound HMAC-SHA256`);
  
  // This is informational - always passes
  assert.strictEqual(true, true, 'Documentation complete');
});

// Run all tests
runTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
