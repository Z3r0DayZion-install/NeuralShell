# Design Document: NeuralShell Security Hardening

## Overview

This design document specifies the bug conditions, expected behaviors, and preservation requirements for fixing 10 critical security vulnerabilities in NeuralShell. The fixes transform NeuralShell into a provably secure, zero-trust, microkernel-grade desktop security platform.

## Vulnerability 1: Renderer Zero Network Enforcement

### Fault Condition

```
isBugCondition(request) =
  request.source === "renderer" AND
  request.protocol IN ["http", "https", "ws", "wss", "ftp", "blob", "about", "chrome", "devtools"]
```

**Explanation**: The renderer process can make network requests using protocols that should be blocked, violating zero-trust network isolation.

### Expected Behavior Properties

```
expectedBehavior(response) =
  (request.protocol === "file" AND response.allowed === true) OR
  (request.protocol === "data" AND request.resourceType === "image" AND response.allowed === true) OR
  (request.protocol NOT IN ["file", "data"] AND response.blocked === true AND response.cspViolation === true)
```

**Implementation Requirements**:
- Configure webRequest.onBeforeRequest to block all protocols except file:// and data: (images only)
- Set Content-Security-Policy: default-src 'none'; img-src data: file:; script-src 'none'; style-src 'none'
- Disable allowRunningInsecureContent
- Set webSecurity: true

### Preservation Requirements

```
preservedBehavior(request) =
  request.protocol === "file" AND request.source === "renderer" =>
    response.allowed === true (unchanged from current behavior)
```

**Rationale**: Legitimate file:// protocol access for application resources must continue to work.

---

## Vulnerability 2: SPKI Certificate Pinning

### Fault Condition

```
isBugCondition(request) =
  request.protocol === "https" AND
  request.source === "main" AND
  certificatePinning.enforced === false
```

**Explanation**: HTTPS requests from the main process do not enforce SPKI certificate pinning, allowing potential MITM attacks.

### Expected Behavior Properties

```
expectedBehavior(response) =
  request.hostname IN pinnedHosts =>
    (certificate.spki IN pinnedHosts[request.hostname].pins AND response.allowed === true) OR
    (certificate.spki NOT IN pinnedHosts[request.hostname].pins AND response.rejected === true)
  
  request.hostname NOT IN pinnedHosts =>
    response.rejected === true AND response.error === "UNPINNED_HOST"
```

**Implementation Requirements**:
- Create certificate-pins.json with hostname -> SPKI pin mappings
- Implement app.on('certificate-error') handler that validates SPKI pins
- Reject all unpinned hosts
- Use SHA256 hash of SubjectPublicKeyInfo

### Preservation Requirements

```
preservedBehavior(request) =
  request.protocol === "http" AND request.destination === "localhost" =>
    response.allowed === true (unchanged - local development)
```

**Rationale**: Local HTTP requests for development must continue to work.

---

## Vulnerability 3: Secure Execution Model

### Fault Condition

```
isBugCondition(execution) =
  (execution.method === "spawn" OR execution.method === "exec") AND
  execution.location !== "kernel/taskExecutor.js" AND
  (execution.command.includes("$") OR 
   execution.command.includes("`") OR
   execution.shell === true)
```

**Explanation**: Code uses spawn/exec with shell interpretation or variable interpolation, allowing arbitrary command execution.

### Expected Behavior Properties

```
expectedBehavior(execution) =
  execution.method === "executeTask" AND
  execution.taskId IN registeredTasks AND
  execution.binary.path.isAbsolute === true AND
  execution.binary.hash.algorithm === "SHA256" AND
  execution.binary.hash.verified === true AND
  execution.arguments.fixed === true AND
  execution.shell === false
```

**Implementation Requirements**:
- Create kernel/taskExecutor.js with executeTask(taskId, args) function
- Maintain task registry with absolute binary paths and SHA256 hashes
- Verify binary hash before execution
- Use fixed argument arrays (no string interpolation)
- Set shell: false
- Ban spawn/exec outside kernel via AST gate

### Preservation Requirements

```
preservedBehavior(execution) =
  execution.taskId === "npm" AND execution.context === "development" =>
    execution.allowed === true (unchanged - dev tooling)
```

**Rationale**: Development tooling execution must continue to work in dev mode.

---

## Vulnerability 4: Signed Boot Chain

### Fault Condition

```
isBugCondition(boot) =
  boot.stage === "app.whenReady" AND
  boot.manifestVerified === false AND
  boot.signatureChecked === false
```

**Explanation**: Application boots without verifying the signed manifest, allowing tampered code to execute.

### Expected Behavior Properties

```
expectedBehavior(boot) =
  boot.manifest.exists === true AND
  boot.manifest.signature.algorithm === "RSA-PSS" AND
  boot.manifest.signature.verified === true AND
  boot.manifest.files.all(file => file.hash.verified === true) AND
  boot.browserWindow.created === true
  
  OR
  
  boot.manifest.signature.verified === false AND
  boot.process.exit === true AND
  boot.exitCode === 1
```

**Implementation Requirements**:
- Create seal.manifest.json with file hashes and RSA-PSS signature
- Implement verifyBootChain() function in main.js
- Verify signature using public key before creating BrowserWindow
- Exit with code 1 if verification fails
- Hash all critical files (main.js, preload.js, kernel/*, router/*)

### Preservation Requirements

```
preservedBehavior(boot) =
  boot.mode === "development" AND boot.env.NODE_ENV === "development" =>
    boot.manifestVerification.skipped === true (unchanged - dev mode)
```

**Rationale**: Development mode should skip manifest verification for faster iteration.

---

## Vulnerability 5: AST Security Gate

### Fault Condition

```
isBugCondition(build) =
  build.stage === "pre-build" AND
  (
    code.contains("require('child_process')") OR
    code.contains("import { spawn } from 'child_process'") OR
    code.contains("require('fs').writeFile") OR
    code.contains(".spawn(") OR
    code.contains(".exec(") OR
    ipc.channel.isLiteral === false OR
    ipc.schema.validated === false
  ) AND
  build.astGate.executed === false
```

**Explanation**: Build process does not run AST security gate to detect forbidden patterns, allowing insecure code to be built.

### Expected Behavior Properties

```
expectedBehavior(build) =
  build.astGate.executed === true AND
  (
    (build.astGate.violations.length === 0 AND build.allowed === true) OR
    (build.astGate.violations.length > 0 AND build.failed === true AND build.exitCode === 1)
  ) AND
  build.astGate.checks.includes("forbidden-requires") AND
  build.astGate.checks.includes("spawn-exec-usage") AND
  build.astGate.checks.includes("ipc-channel-literals") AND
  build.astGate.checks.includes("schema-validation")
```

**Implementation Requirements**:
- Create scripts/ast-security-gate.js
- Parse all .js files with @babel/parser
- Check for forbidden requires: child_process, fs (writeFile/unlink), net, http, https
- Check for spawn/exec usage outside kernel/taskExecutor.js
- Check for non-literal IPC channel names
- Check for missing Ajv schema validation on IPC handlers
- Fail build if violations found

### Preservation Requirements

```
preservedBehavior(build) =
  build.file === "kernel/taskExecutor.js" AND build.contains("spawn") =>
    build.astGate.allowed === true (unchanged - kernel exception)
```

**Rationale**: Kernel taskExecutor is the only allowed location for spawn/exec usage.

---

## Vulnerability 6: Network Broker Hardening

### Fault Condition

```
isBugCondition(request) =
  request.broker === "networkBroker" AND
  (
    request.followRedirects === true OR
    request.maxResponseSize === Infinity OR
    request.headers.arbitrary === true OR
    request.method IN ["PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"]
  )
```

**Explanation**: Network broker allows insecure request patterns that could be exploited.

### Expected Behavior Properties

```
expectedBehavior(request) =
  request.followRedirects === false AND
  request.maxResponseSize <= MAX_RESPONSE_BYTES AND
  request.headers.all(h => h IN ["Accept", "Content-Type", "User-Agent"]) AND
  request.method IN ["GET", "POST"] AND
  request.certificatePinning.enforced === true
```

**Implementation Requirements**:
- Set followRedirects: false in axios config
- Implement MAX_RESPONSE_BYTES = 10MB limit
- Whitelist only Accept, Content-Type, User-Agent headers
- Allow only GET and POST methods
- Integrate SPKI certificate pinning
- Reject requests that violate constraints

### Preservation Requirements

```
preservedBehavior(request) =
  request.method === "POST" AND request.contentType === "application/json" =>
    request.allowed === true (unchanged - API calls)
```

**Rationale**: Legitimate POST requests for API calls must continue to work.

---

## Vulnerability 7: ACL & Installation Trust

### Fault Condition

```
isBugCondition(installation) =
  installation.path.worldWritable === true OR
  installation.path.userWritable === true OR
  installation.path NOT IN protectedDirectories OR
  installation.acl.verified === false
```

**Explanation**: Application can be installed in insecure locations with improper permissions.

### Expected Behavior Properties

```
expectedBehavior(installation) =
  installation.path IN ["/usr/local/bin", "C:\\Program Files", "/Applications"] AND
  installation.acl.worldWritable === false AND
  installation.acl.groupWritable === false AND
  installation.acl.ownerWritable === true AND
  installation.verification.passed === true
  
  OR
  
  installation.verification.passed === false AND
  installation.aborted === true AND
  installation.error === "INSECURE_INSTALLATION_PATH"
```

**Implementation Requirements**:
- Create scripts/verify-installation.js
- Check installation path is under protected directory
- Verify ACL permissions (no world-writable, no group-writable)
- Run verification in postinstall script
- Abort installation if verification fails

### Preservation Requirements

```
preservedBehavior(installation) =
  installation.mode === "development" AND installation.path === "./node_modules" =>
    installation.verification.skipped === true (unchanged - dev mode)
```

**Rationale**: Development installations in node_modules should skip ACL verification.

---

## Vulnerability 8: Secure Memory Handling

### Fault Condition

```
isBugCondition(secret) =
  secret.type === "string" AND
  secret.category IN ["password", "token", "key", "pin"] AND
  secret.cleared === false
```

**Explanation**: Secrets stored as strings remain in memory and can be extracted via memory dumps.

### Expected Behavior Properties

```
expectedBehavior(secret) =
  secret.type === "Buffer" AND
  secret.cleared === true AND
  secret.reference === null AND
  secret.clearMethod === "secureClear"
  
secureClear(buffer) =
  buffer.fill(0) AND
  buffer.reference = null
```

**Implementation Requirements**:
- Convert all secret strings to Buffers
- Implement secureClear(buffer) utility function
- Call secureClear() after secret use
- Set references to null after clearing
- Apply to: PIN codes, auth tokens, encryption keys, API keys

### Preservation Requirements

```
preservedBehavior(secret) =
  secret.usage === "comparison" AND secret.timing === "constant-time" =>
    secret.comparison.method === "crypto.timingSafeEqual" (unchanged)
```

**Rationale**: Constant-time comparison for secrets must continue to prevent timing attacks.

---

## Vulnerability 9: CI Security Enforcement

### Fault Condition

```
isBugCondition(ci) =
  ci.stage === "build" AND
  (
    ci.npmInstall.ignoreScripts === false OR
    ci.npmAudit.executed === false OR
    ci.astGate.executed === false OR
    ci.tests.executed === false OR
    ci.varProof.generated === false
  )
```

**Explanation**: CI pipeline does not enforce security gates, allowing vulnerable or insecure code to be deployed.

### Expected Behavior Properties

```
expectedBehavior(ci) =
  ci.npmInstall.command === "npm ci --ignore-scripts" AND
  ci.npmAudit.command === "npm audit --omit=dev --audit-level=high" AND
  ci.npmAudit.exitCode === 0 AND
  ci.astGate.executed === true AND
  ci.astGate.exitCode === 0 AND
  ci.tests.executed === true AND
  ci.tests.exitCode === 0 AND
  ci.varProof.generated === true AND
  ci.varProof.exported === true
  
  OR
  
  (ci.npmAudit.exitCode !== 0 OR ci.astGate.exitCode !== 0 OR ci.tests.exitCode !== 0) AND
  ci.build.failed === true
```

**Implementation Requirements**:
- Update .github/workflows/ci.yml
- Run npm ci --ignore-scripts
- Run npm audit --omit=dev --audit-level=high (fail on high/critical)
- Run npm run ast-gate (fail on violations)
- Run npm test (fail on test failures)
- Run npm run var-proof (generate VAR)
- Export VAR as artifact
- Fail pipeline if any step fails

### Preservation Requirements

```
preservedBehavior(ci) =
  ci.stage === "test" AND ci.coverage.enabled === true =>
    ci.coverage.report.generated === true (unchanged)
```

**Rationale**: Test coverage reporting must continue to work.

---

## Vulnerability 10: VAR Proof Generation

### Fault Condition

```
isBugCondition(build) =
  build.stage === "post-build" AND
  build.varProof.generated === false AND
  build.varProof.cryptographic === false
```

**Explanation**: Builds do not generate verifiable artifact records with cryptographic proof, making builds unverifiable.

### Expected Behavior Properties

```
expectedBehavior(build) =
  build.varProof.exists === true AND
  build.varProof.contains("gitCommit") AND
  build.varProof.contains("lockfileHash") AND
  build.varProof.contains("astGateResult") AND
  build.varProof.contains("testSummary") AND
  build.varProof.contains("binaryHashes") AND
  build.varProof.contains("manifestSignature") AND
  build.varProof.contains("timestamp") AND
  build.varProof.contains("hmac") AND
  build.varProof.hmac.algorithm === "SHA256" AND
  build.varProof.hmac.hostBound === true
```

**Implementation Requirements**:
- Create scripts/generate-var-proof.js
- Collect: git commit hash, package-lock.json SHA256, AST gate result, test summary, binary hashes, manifest signature status
- Generate timestamp (ISO 8601)
- Compute HMAC-SHA256 over all fields using host-bound key
- Export as VAR_PROOF_<timestamp>.json
- Add npm script: "var-proof": "node scripts/generate-var-proof.js"

### Preservation Requirements

```
preservedBehavior(build) =
  build.artifacts.includes("dist/") AND build.artifacts.includes("package.json") =>
    build.artifacts.preserved === true (unchanged)
```

**Rationale**: Existing build artifacts must continue to be generated.

---

## Summary

This design document specifies the bug conditions, expected behaviors, and preservation requirements for all 10 security vulnerabilities. The implementation will transform NeuralShell into a provably secure, zero-trust platform with:

- Zero network access from renderer
- Mandatory SPKI certificate pinning
- Secure task execution model
- Signed boot chain verification
- AST security gate enforcement
- Hardened network broker
- ACL and installation trust verification
- Secure memory handling for secrets
- CI security enforcement
- Verifiable artifact records with cryptographic proof

Each vulnerability has clear fault conditions for exploration testing, expected behavior properties for fix validation, and preservation requirements to prevent regressions.
