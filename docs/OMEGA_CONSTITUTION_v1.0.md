# OMEGA CONSTITUTION v1.0
**Status:** Supreme Law of the Neural Empire
**Scope:** Universal Enforcement Policy

## 1. THE MICROKERNEL LAW
No application or module shall directly access privileged OS resources (`fs`, `child_process`, `net`, `crypto`). All access MUST be brokered via the `KernelBroker` using Symbol-based capability tokens.

## 2. THE AST BOUNDARY
The build pipeline MUST statically verify that no forbidden modules are imported and no dynamic execution (`eval`, `Function`, dynamic `import`) occurs outside the Trusted Computing Base (TCB).

## 3. THE EXECUTION CONTRACT
No binary may be executed unless its absolute path is resolved via `realpathSync` and its SHA-256 hash matches an immutable entry in the signed Task Registry.

## 4. THE NETWORK ISOLATION
The Renderer process is physically disconnected from the network. Outbound traffic must be proxied by the Kernel Network Broker and strictly enforce SPKI certificate pinning.

## 5. THE DETERMINISM MANDATE
Builds must be bit-for-bit reproducible across any compliant machine. This requires normalized line endings (LF), sorted file ordering, and deterministic JSON serialization.

## 6. THE PROOF OF WORK
Every release MUST produce a `VAR_PROOF` bundle signed by the Pinned Root Ed25519 key. This bundle constitutes the mathematical evidence of sovereignty.

## 7. THE GOVERNANCE ANCHOR
The ecosystem is governed by a signed Compliance Registry. Admission is mechanical and binary. No exceptions, no whitelists, no overrides.

## 8. THE FAIL-CLOSED POLICY
Any violation of these laws detected at runtime or during verification must result in the immediate termination of the process (Exit Code 42).
