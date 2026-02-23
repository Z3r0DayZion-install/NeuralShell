# Implementation Plan: NeuralShell Security Hardening

## Phase 1: Bug Condition Exploration Tests (BEFORE Fix)

- [ ] 1. Write bug condition exploration tests for all 10 vulnerabilities
  - **Property 1: Fault Condition** - Security Vulnerabilities Exploration
  - **CRITICAL**: These tests MUST FAIL on unfixed code - failure confirms the bugs exist
  - **DO NOT attempt to fix the tests or the code when they fail**
  - **NOTE**: These tests encode the expected behavior - they will validate the fixes when they pass after implementation
  - **GOAL**: Surface counterexamples that demonstrate each vulnerability exists
  - **Scoped PBT Approach**: For deterministic vulnerabilities, scope properties to concrete failing cases

  - [x] 1.1 Test renderer network access (Vulnerability 1)
    - Test that renderer can make https:// requests (should fail - proves bug exists)
    - Test that renderer can make ws:// requests (should fail - proves bug exists)
    - Test that CSP does not block network protocols (should fail - proves bug exists)
    - From Fault Condition: request.source === "renderer" AND request.protocol IN ["http", "https", "ws", "wss", "ftp"]
    - Expected behavior: All non-file/data protocols should be blocked
    - _Requirements: 1.1, 2.1_

  - [x] 1.2 Test missing SPKI certificate pinning (Vulnerability 2)
    - Test that HTTPS requests succeed without certificate pinning (should fail - proves bug exists)
    - Test that unpinned hosts are allowed (should fail - proves bug exists)
    - From Fault Condition: request.protocol === "https" AND certificatePinning.enforced === false
    - Expected behavior: Unpinned hosts should be rejected
    - _Requirements: 1.2, 2.2_

  - [x] 1.3 Test insecure spawn/exec usage (Vulnerability 3)
    - Test that spawn() with shell: true is allowed outside kernel (should fail - proves bug exists)
    - Test that exec() with variable interpolation is allowed (should fail - proves bug exists)
    - From Fault Condition: execution.method IN ["spawn", "exec"] AND execution.location !== "kernel/taskExecutor.js"
    - Expected behavior: Only executeTask() with verified binaries should be allowed
    - _Requirements: 1.3, 2.3_

  - [x] 1.4 Test missing boot chain verification (Vulnerability 4)
    - Test that application boots without manifest verification (should fail - proves bug exists)
    - Test that BrowserWindow is created without signature check (should fail - proves bug exists)
    - From Fault Condition: boot.stage === "app.whenReady" AND boot.manifestVerified === false
    - Expected behavior: Boot should fail without valid manifest signature
    - _Requirements: 1.4, 2.4_

  - [x] 1.5 Test missing AST security gate (Vulnerability 5)
    - Test that build succeeds with forbidden requires (should fail - proves bug exists)
    - Test that spawn/exec outside kernel is not detected (should fail - proves bug exists)
    - Test that non-literal IPC channels are not detected (should fail - proves bug exists)
    - From Fault Condition: build.astGate.executed === false AND code.contains("require('child_process')")
    - Expected behavior: Build should fail on AST gate violations
    - _Requirements: 1.5, 2.5_

  - [x] 1.6 Test network broker insecure patterns (Vulnerability 6)
    - Test that redirects are followed (should fail - proves bug exists)
    - Test that unlimited response sizes are allowed (should fail - proves bug exists)
    - Test that arbitrary headers are allowed (should fail - proves bug exists)
    - Test that PUT/DELETE methods are allowed (should fail - proves bug exists)
    - From Fault Condition: request.followRedirects === true OR request.maxResponseSize === Infinity
    - Expected behavior: Insecure patterns should be rejected
    - _Requirements: 1.6, 2.6_

  - [x] 1.7 Test insecure installation paths (Vulnerability 7)
    - Test that world-writable paths are allowed (should fail - proves bug exists)
    - Test that unprotected directories are allowed (should fail - proves bug exists)
    - From Fault Condition: installation.path.worldWritable === true OR installation.path NOT IN protectedDirectories
    - Expected behavior: Installation should fail for insecure paths
    - _Requirements: 1.7, 2.7_

  - [x] 1.8 Test insecure memory handling (Vulnerability 8)
    - Test that secrets are stored as strings (should fail - proves bug exists)
    - Test that secrets are not cleared after use (should fail - proves bug exists)
    - From Fault Condition: secret.type === "string" AND secret.category IN ["password", "token", "key"]
    - Expected behavior: Secrets should be Buffers with secureClear()
    - _Requirements: 1.8, 2.8_

  - [x] 1.9 Test missing CI security gates (Vulnerability 9)
    - Test that npm install runs scripts (should fail - proves bug exists)
    - Test that npm audit is not enforced (should fail - proves bug exists)
    - Test that AST gate is not run in CI (should fail - proves bug exists)
    - From Fault Condition: ci.npmInstall.ignoreScripts === false OR ci.npmAudit.executed === false
    - Expected behavior: CI should enforce all security gates
    - _Requirements: 1.9, 2.9_

  - [x] 1.10 Test missing VAR proof generation (Vulnerability 10)
    - Test that builds complete without VAR proof (should fail - proves bug exists)
    - Test that no cryptographic HMAC is generated (should fail - proves bug exists)
    - From Fault Condition: build.varProof.generated === false AND build.varProof.cryptographic === false
    - Expected behavior: VAR proof with HMAC should be generated
    - _Requirements: 1.10, 2.10_

  - **EXPECTED OUTCOME**: All tests FAIL (this is correct - it proves the bugs exist)
  - Document counterexamples found to understand root causes
  - Mark task complete when tests are written, run, and failures are documented

## Phase 2: Preservation Property Tests (BEFORE Fix)

- [x] 2. Write preservation property tests for non-buggy behavior
  - **Property 2: Preservation** - Preserve Legitimate Functionality
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-buggy inputs
  - Write property-based tests capturing observed behavior patterns
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)

  - [x] 2.1 Test legitimate IPC operations are preserved
    - Observe: IPC with validated channels and Ajv schemas works on unfixed code
    - Write property: for all validated IPC channels, schema validation succeeds
    - Verify test passes on UNFIXED code
    - From Preservation Requirements 3.1: validated IPC channels with Ajv strict mode
    - _Requirements: 3.1_

  - [x] 2.2 Test file:// protocol access is preserved
    - Observe: file:// protocol loads application resources on unfixed code
    - Write property: for all file:// URLs under app path, loading succeeds
    - Verify test passes on UNFIXED code
    - From Preservation Requirements 3.2: file:// access for application resources
    - _Requirements: 3.2_

  - [x] 2.3 Test contextBridge APIs are preserved
    - Observe: contextBridge exposes safe APIs on unfixed code
    - Write property: for all exposed APIs, contextIsolation is enabled
    - Verify test passes on UNFIXED code
    - From Preservation Requirements 3.3: contextBridge with contextIsolation
    - _Requirements: 3.3_

  - [x] 2.4 Test DevTools access in development mode is preserved
    - Observe: DevTools opens in development mode on unfixed code
    - Write property: when NODE_ENV === "development", DevTools is accessible
    - Verify test passes on UNFIXED code
    - From Preservation Requirements 3.4: DevTools in development mode
    - _Requirements: 3.4_

  - [x] 2.5 Test PIN authentication is preserved
    - Observe: PIN-based authentication with role management works on unfixed code
    - Write property: for all valid PINs, authentication succeeds with correct role
    - Verify test passes on UNFIXED code
    - From Preservation Requirements 3.5: PIN-based authentication with role management
    - _Requirements: 3.5_

  - [x] 2.6 Test permission checks are preserved
    - Observe: Permission checks for sensitive operations work on unfixed code
    - Write property: for all sensitive operations, permission check is enforced
    - Verify test passes on UNFIXED code
    - From Preservation Requirements 3.6: permission checks for sensitive operations
    - _Requirements: 3.6_

  - [x] 2.7 Test path guards are preserved
    - Observe: Path guards validate file system access on unfixed code
    - Write property: for all file operations, path is validated against allowed roots
    - Verify test passes on UNFIXED code
    - From Preservation Requirements 3.7: path guards validate against allowed roots
    - _Requirements: 3.7_

  - [x] 2.8 Test automated tests are preserved
    - Observe: Test suites execute with proper assertions on unfixed code
    - Write property: for all test files, assertions are evaluated
    - Verify test passes on UNFIXED code
    - From Preservation Requirements 3.8: test suites with proper assertions
    - _Requirements: 3.8_

  - [x] 2.9 Test electron-builder packaging is preserved
    - Observe: electron-builder packages application on unfixed code
    - Write property: for all platforms, packaging succeeds
    - Verify test passes on UNFIXED code
    - From Preservation Requirements 3.9: electron-builder for packaging
    - _Requirements: 3.9_

  - [x] 2.10 Test telemetry collection is preserved
    - Observe: Telemetry collects and reports metrics on unfixed code
    - Write property: for all telemetry events, metrics are collected
    - Verify test passes on UNFIXED code
    - From Preservation Requirements 3.10: telemetry collection and reporting
    - _Requirements: 3.10_

  - Mark task complete when tests are written, run, and passing on unfixed code

## Phase 3: Implementation

- [ ] 3. Implement security hardening fixes

  - [x] 3.1 Fix Vulnerability 1: Renderer Zero Network Enforcement
    - Configure webRequest.onBeforeRequest to block all protocols except file:// and data: (images only)
    - Set Content-Security-Policy: default-src 'none'; img-src data: file:; script-src 'none'; style-src 'none'
    - Disable allowRunningInsecureContent
    - Set webSecurity: true in BrowserWindow
    - _Bug_Condition: request.source === "renderer" AND request.protocol IN ["http", "https", "ws", "wss", "ftp"]_
    - _Expected_Behavior: expectedBehavior from design - block all non-file/data protocols_
    - _Preservation: file:// protocol access for application resources (3.2)_
    - _Requirements: 1.1, 2.1, 3.2_

  - [x] 3.2 Fix Vulnerability 2: SPKI Certificate Pinning
    - Create certificate-pins.json with hostname -> SPKI pin mappings
    - Implement app.on('certificate-error') handler that validates SPKI pins
    - Reject all unpinned hosts
    - Use SHA256 hash of SubjectPublicKeyInfo
    - _Bug_Condition: request.protocol === "https" AND certificatePinning.enforced === false_
    - _Expected_Behavior: expectedBehavior from design - enforce SPKI pinning_
    - _Preservation: Local HTTP requests for development (Preservation Requirements)_
    - _Requirements: 1.2, 2.2_

  - [x] 3.3 Fix Vulnerability 3: Secure Execution Model
    - Create kernel/taskExecutor.js with executeTask(taskId, args) function
    - Maintain task registry with absolute binary paths and SHA256 hashes
    - Verify binary hash before execution
    - Use fixed argument arrays (no string interpolation)
    - Set shell: false
    - Ban spawn/exec outside kernel via AST gate
    - _Bug_Condition: execution.method IN ["spawn", "exec"] AND execution.location !== "kernel/taskExecutor.js"_
    - _Expected_Behavior: expectedBehavior from design - only executeTask with verified binaries_
    - _Preservation: Development tooling execution in dev mode (Preservation Requirements)_
    - _Requirements: 1.3, 2.3_

  - [x] 3.4 Fix Vulnerability 4: Signed Boot Chain
    - Create seal.manifest.json with file hashes and RSA-PSS signature
    - Implement verifyBootChain() function in main.js
    - Verify signature using public key before creating BrowserWindow
    - Exit with code 1 if verification fails
    - Hash all critical files (main.js, preload.js, kernel/*, router/*)
    - _Bug_Condition: boot.stage === "app.whenReady" AND boot.manifestVerified === false_
    - _Expected_Behavior: expectedBehavior from design - verify manifest before boot_
    - _Preservation: Skip verification in development mode (Preservation Requirements)_
    - _Requirements: 1.4, 2.4_

  - [x] 3.5 Fix Vulnerability 5: AST Security Gate
    - Create scripts/ast-security-gate.js
    - Parse all .js files with @babel/parser
    - Check for forbidden requires: child_process, fs (writeFile/unlink), net, http, https
    - Check for spawn/exec usage outside kernel/taskExecutor.js
    - Check for non-literal IPC channel names
    - Check for missing Ajv schema validation on IPC handlers
    - Fail build if violations found
    - Add npm script: "ast-gate": "node scripts/ast-security-gate.js"
    - _Bug_Condition: build.astGate.executed === false AND code.contains("require('child_process')")_
    - _Expected_Behavior: expectedBehavior from design - fail build on violations_
    - _Preservation: Allow spawn in kernel/taskExecutor.js (Preservation Requirements)_
    - _Requirements: 1.5, 2.5_

  - [x] 3.6 Fix Vulnerability 6: Network Broker Hardening
    - Set followRedirects: false in axios config
    - Implement MAX_RESPONSE_BYTES = 10MB limit
    - Whitelist only Accept, Content-Type, User-Agent headers
    - Allow only GET and POST methods
    - Integrate SPKI certificate pinning
    - Reject requests that violate constraints
    - _Bug_Condition: request.followRedirects === true OR request.maxResponseSize === Infinity_
    - _Expected_Behavior: expectedBehavior from design - enforce secure patterns_
    - _Preservation: POST requests for API calls (Preservation Requirements)_
    - _Requirements: 1.6, 2.6_

  - [-] 3.7 Fix Vulnerability 7: ACL & Installation Trust
    - Create scripts/verify-installation.js
    - Check installation path is under protected directory
    - Verify ACL permissions (no world-writable, no group-writable)
    - Run verification in postinstall script
    - Abort installation if verification fails
    - _Bug_Condition: installation.path.worldWritable === true OR installation.path NOT IN protectedDirectories_
    - _Expected_Behavior: expectedBehavior from design - verify secure installation_
    - _Preservation: Skip verification for dev installations (Preservation Requirements)_
    - _Requirements: 1.7, 2.7_

  - [ ] 3.8 Fix Vulnerability 8: Secure Memory Handling
    - Convert all secret strings to Buffers
    - Implement secureClear(buffer) utility function
    - Call secureClear() after secret use
    - Set references to null after clearing
    - Apply to: PIN codes, auth tokens, encryption keys, API keys
    - _Bug_Condition: secret.type === "string" AND secret.category IN ["password", "token", "key"]_
    - _Expected_Behavior: expectedBehavior from design - use Buffers with secureClear_
    - _Preservation: Constant-time comparison for secrets (Preservation Requirements)_
    - _Requirements: 1.8, 2.8_

  - [ ] 3.9 Fix Vulnerability 9: CI Security Enforcement
    - Update .github/workflows/ci.yml
    - Run npm ci --ignore-scripts
    - Run npm audit --omit=dev --audit-level=high (fail on high/critical)
    - Run npm run ast-gate (fail on violations)
    - Run npm test (fail on test failures)
    - Run npm run var-proof (generate VAR)
    - Export VAR as artifact
    - Fail pipeline if any step fails
    - _Bug_Condition: ci.npmInstall.ignoreScripts === false OR ci.npmAudit.executed === false_
    - _Expected_Behavior: expectedBehavior from design - enforce all security gates_
    - _Preservation: Test coverage reporting (Preservation Requirements)_
    - _Requirements: 1.9, 2.9_

  - [ ] 3.10 Fix Vulnerability 10: VAR Proof Generation
    - Create scripts/generate-var-proof.js
    - Collect: git commit hash, package-lock.json SHA256, AST gate result, test summary, binary hashes, manifest signature status
    - Generate timestamp (ISO 8601)
    - Compute HMAC-SHA256 over all fields using host-bound key
    - Export as VAR_PROOF_<timestamp>.json
    - Add npm script: "var-proof": "node scripts/generate-var-proof.js"
    - _Bug_Condition: build.varProof.generated === false AND build.varProof.cryptographic === false_
    - _Expected_Behavior: expectedBehavior from design - generate VAR with HMAC_
    - _Preservation: Existing build artifacts (Preservation Requirements)_
    - _Requirements: 1.10, 2.10_

  - [ ] 3.11 Verify bug condition exploration tests now pass
    - **Property 1: Expected Behavior** - Security Vulnerabilities Fixed
    - **IMPORTANT**: Re-run the SAME tests from task 1 - do NOT write new tests
    - The tests from task 1 encode the expected behavior
    - When these tests pass, it confirms the expected behavior is satisfied
    - Run all exploration tests from Phase 1
    - **EXPECTED OUTCOME**: All tests PASS (confirms bugs are fixed)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10_

  - [ ] 3.12 Verify preservation tests still pass
    - **Property 2: Preservation** - Legitimate Functionality Preserved
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run all preservation tests from Phase 2
    - **EXPECTED OUTCOME**: All tests PASS (confirms no regressions)
    - Confirm all tests still pass after fixes (no regressions)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10_

## Phase 4: Checkpoint

- [ ] 4. Final validation and documentation
  - Ensure all exploration tests pass (bugs fixed)
  - Ensure all preservation tests pass (no regressions)
  - Run full test suite
  - Generate VAR proof
  - Update SECURITY.md with hardening details
  - Ask user if questions arise

---

## Task Execution Notes

1. **Phase 1 (Exploration)**: Tests MUST FAIL - this proves bugs exist
2. **Phase 2 (Preservation)**: Tests MUST PASS on unfixed code - this captures baseline behavior
3. **Phase 3 (Implementation)**: Apply all 10 fixes
4. **Phase 3.11 (Fix Checking)**: Re-run Phase 1 tests - they MUST PASS now
5. **Phase 3.12 (Preservation Checking)**: Re-run Phase 2 tests - they MUST still PASS
6. **Phase 4 (Checkpoint)**: Final validation

This workflow ensures systematic validation through exploration, preservation, implementation, and verification.
