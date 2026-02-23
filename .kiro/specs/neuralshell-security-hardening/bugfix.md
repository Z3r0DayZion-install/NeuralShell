# Bugfix Requirements Document: NeuralShell Security Hardening

## Introduction

NeuralShell currently contains critical security vulnerabilities that prevent it from being a provable, zero-trust, microkernel-grade desktop security platform. The application uses insecure execution patterns (spawn/exec), lacks network isolation for the renderer process, has no SPKI certificate pinning, missing boot chain verification, no AST security gate enforcement, insecure memory handling for secrets, and lacks comprehensive security testing and proof generation.

These vulnerabilities violate the core security principle of "fail closed" and expose the system to:
- Arbitrary code execution through uncontrolled shell commands
- Network-based attacks through renderer process
- Man-in-the-middle attacks due to missing certificate pinning
- Boot integrity compromise without signed manifest verification
- Build-time security violations without AST gate enforcement
- Memory-based secret extraction due to improper handling
- Unverifiable builds without VAR proof generation

This bugfix implements comprehensive security hardening to transform NeuralShell into a provably secure platform with zero-trust architecture.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the renderer process attempts to make network requests THEN the system allows http, https, ws, wss, ftp, blob, about, chrome, and devtools protocols without restriction

1.2 WHEN the main process makes HTTPS requests THEN the system does not enforce SPKI certificate pinning for any hostname

1.3 WHEN code uses spawn() or exec() patterns THEN the system executes arbitrary shell commands with inherited environment variables

1.4 WHEN the application boots THEN the system does not verify a signed boot chain with manifest verification

1.5 WHEN code is built THEN the system does not run AST security gate to enforce forbidden imports, spawn/exec usage, or IPC channel validation

1.6 WHEN the network broker handles requests THEN the system allows redirects, unlimited response sizes, arbitrary headers, and all HTTP methods

1.7 WHEN the application is installed THEN the system does not verify installation path security or ACL permissions

1.8 WHEN secrets are stored in memory THEN the system uses plain strings instead of Buffers with secure clearing

1.9 WHEN CI pipeline runs THEN the system does not enforce security gates for audit, AST validation, or test execution

1.10 WHEN builds complete THEN the system does not generate verifiable artifact records (VAR) with cryptographic proof

### Expected Behavior (Correct)

2.1 WHEN the renderer process attempts to make network requests THEN the system SHALL block all protocols except file:// and data: (images only) with strict CSP enforcement

2.2 WHEN the main process makes HTTPS requests through the network broker THEN the system SHALL enforce mandatory SPKI certificate pinning per hostname and reject unpinned hosts

2.3 WHEN task execution is required THEN the system SHALL use executeTask(taskId) with absolute binary paths, fixed arguments, and SHA256 hash verification

2.4 WHEN the application boots THEN the system SHALL verify seal.manifest.json signature using RSA-PSS before creating BrowserWindow

2.5 WHEN code is built THEN the system SHALL run AST security gate that fails on forbidden requires/imports, spawn/exec usage outside kernel, non-literal IPC channels, and missing schemas

2.6 WHEN the network broker handles requests THEN the system SHALL reject redirects, enforce MAX_RESPONSE_BYTES cap, allow only Accept/Content-Type/User-Agent headers, and permit only GET/POST methods

2.7 WHEN the application is installed THEN the system SHALL verify installation under protected directory with no world-writable permissions

2.8 WHEN secrets are stored in memory THEN the system SHALL use Buffers with secureClear() after use and null references after scrub

2.9 WHEN CI pipeline runs THEN the system SHALL execute npm ci --ignore-scripts, npm audit --omit=dev --audit-level=high, AST gate, tests, and VAR proof export, failing on any error

2.10 WHEN builds complete THEN the system SHALL generate VAR_PROOF_<timestamp>.json containing git commit, lockfile SHA256, AST gate result, test summary, binary hashes, manifest signature status, timestamp, and host-bound HMAC

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the application uses IPC for legitimate kernel operations THEN the system SHALL CONTINUE TO support validated IPC channels with Ajv strict mode schema validation

3.2 WHEN the application loads local files through file:// protocol THEN the system SHALL CONTINUE TO allow file:// access for application resources

3.3 WHEN the application uses contextBridge for renderer communication THEN the system SHALL CONTINUE TO expose safe APIs through contextBridge with contextIsolation enabled

3.4 WHEN the application runs in development mode THEN the system SHALL CONTINUE TO allow DevTools access (but block in production)

3.5 WHEN the application handles user authentication THEN the system SHALL CONTINUE TO support PIN-based authentication with role management

3.6 WHEN the application manages permissions THEN the system SHALL CONTINUE TO enforce permission checks for sensitive operations

3.7 WHEN the application uses path guards THEN the system SHALL CONTINUE TO validate file system access against allowed roots

3.8 WHEN the application runs automated tests THEN the system SHALL CONTINUE TO execute test suites with proper assertions

3.9 WHEN the application packages for distribution THEN the system SHALL CONTINUE TO use electron-builder for packaging

3.10 WHEN the application handles telemetry THEN the system SHALL CONTINUE TO collect and report system metrics
