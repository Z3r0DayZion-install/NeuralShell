---
inclusion: always
---

# NeuralShell — Repository Structure

## Source Layout

```
src/
  main.js                    # Electron main process — app lifecycle, IPC handlers, daemon management
  preload.js                 # IPC boundary — whitelist of ~100 allowed channels, context bridge
  renderer.html              # DEAD — do not use. App loads dist-renderer/index.html
  renderer.js                # DEAD — do not use
  airgapPolicy.js            # Airgap mode enforcement
  bridgeProviderCatalog.js   # LLM provider definitions (Ollama, OpenAI, OpenRouter, Groq, Together)
  bridgeSettingsModel.js     # Bridge settings schema and defaults
  verificationCatalog.js     # Verification check definitions
  workflowCatalog.js         # Workflow definitions

  core/                      # Main process services (47 modules)
    llmService.js            # LLM provider bridging and streaming
    stateManager.js          # Versioned persistent state with migration
    sessionManager.js        # Encrypted session save/load/index
    secretVault.js           # Hardware-bound secret storage
    identityKernel.js        # Ed25519 identity, hardware fingerprint, peer trust
    ipcValidators.js         # Input validation for all IPC channels
    policyFirewall.js        # Safety policy enforcement
    auditChain.js            # Append-only hash-chained audit log
    executionEngine.js       # Autonomous action runner
    chainPlanner.js          # Multi-step workflow sequencing
    agencyPolicy.js          # Auto-run policy (hot-reloadable)
    actionRegistry.js        # Action definitions and risk classification
    adaptiveIntelligence.js  # Urgency scoring, anomaly detection, failure prediction
    capabilities.js          # Tier-based capability resolution
    config.js                # LLM status constants and connection defaults
    ...

  daemon/                    # WebSocket bridge and model pool
  ipc/                       # Isolated IPC modules (git status, proof execution)
  kernel/                    # Low-level OS/crypto/network capability kernel
  main/                      # Electron window management, integrity, recovery
  plugins/                   # Plugin loader
  runtime/                   # Trust evaluation, profile mobility
  security/                  # Intent firewall

  renderer/src/              # React 18 renderer (Vite-built)
    main.jsx                 # React entry — mounts ShellProvider + App on #root
    App.jsx                  # Root component — layout, modal orchestration, IPC bootstrap
    routes.ts                # Route resolution (app / scratchpad / share)
    state/
      ShellContext.jsx       # Global renderer state (UI / Domain / System slices)
    components/              # ~140 React components
    hooks/                   # Custom React hooks
    config/                  # JSON config (plans, onboarding steps, nodechain rules)
    runtime/                 # Renderer-side runtime (roles, nodechain engine, watchdog, event bus)
    pages/                   # Page-level components
    lib/                     # Shared utilities
    utils/                   # Renderer utilities
    analytics/               # Analytics helpers

billing/
  licenseEngine.js           # HMAC-signed license blob verification and plan resolution

gateway/
  hostedModelProxy.js        # Together.ai proxy server (rate-limited HTTP)
  hostedModelProxy.ts        # DUPLICATE — dead, pending removal

telemetry/
  otelBridge.js              # TCP connectivity probe (not full OTLP)
  otelBridge.ts              # DUPLICATE — dead, pending removal

collab/
  signalServer.cjs           # WebRTC signal relay server
  voice/                     # Voice latency bench and signal normalization (stub)

vendor/
  omega-core/                # Internal AST gate, kernel factory, intent firewall

config/                      # Runtime JSON config (plans.json, tiers.json, onboarding steps)
agencyPolicy.json            # Hot-reloadable agency policy (auto-run rules)
```


## Test Layout

```
tear/                        # Main test suite (~70 files, custom runner)
  smoke-test.js              # React architecture validation (required for CI)
  unit-tests.js              # IPC validators, bridge models, workspace actions
  ipc-surface-test.js        # IPC channel surface validation
  session-manager.test.js    # Session encryption and index
  state-manager.test.js      # State versioning and migration
  identity-kernel.test.js    # Ed25519 and hardware binding
  policy-firewall.test.js    # Safety policy enforcement
  audit-chain.test.js        # Audit log integrity
  security-guards.test.js    # Security boundary validation
  security-abuse.test.js     # Abuse simulation
  release-gate.js            # Full release gate (smoke + packaged + installer)
  release-manifest.test.js   # Artifact manifest validation
  release-checksums.test.js  # Checksum verification
  ...

e2e/                         # Playwright E2E tests (~82 specs, requires built app)
  react-core.spec.js         # Core UI flows (session, chat, commands)
  onboardingFlow.spec.js     # First-boot wizard
  billingActivation.spec.js  # License activation
  sessionPersistence.spec.js # Session save/load
  ...
```

## Scripts Layout

```
scripts/                     # Build, release, and tooling scripts

Release pipeline (product infrastructure):
  ship.js                    # Release orchestration entry point
  release-manifest.js        # SHA-256 manifest generation
  release-checksums.js       # Checksum file generation
  release-notes.js           # Release notes generation
  sign-release.js            # Artifact signing
  verify-release-signature.js
  release-upgrade-validation.js
  canary-gate.js             # Canary deployment validation
  security-pass.js           # Security audit gate
  verify-clean-worktree.js   # Git state verification
  generate-sbom.js           # SBOM generation
  generate-attestation.js    # Build provenance

Internal GTM tooling (not product code):
  gen_*.cjs                  # ~40 go-to-market document generators
                             # These are internal sales/ops tools, not product infrastructure
                             # Candidates for extraction to a separate internal tools repo

Beta ops (internal):
  send_beta_*.py
  fetch_gmail_*.py
  triage_beta_*.py
  run_beta_*.py
```

## Key Config Files

| File | Purpose |
|---|---|
| `package.json` | Dependencies, scripts, electron-builder config |
| `.nvmrc` | Node version pin (22.12.x) |
| `agencyPolicy.json` | Hot-reloadable auto-run policy |
| `config/plans.json` | License plan definitions |
| `config/tiers.json` | Capability tier definitions |
| `ARCHITECTURE_RULES.md` | Hard and soft architecture rules |
| `IPC_CONTRACT.md` | IPC channel schemas (must be kept current) |
| `.github/workflows/` | CI/CD — 20+ workflows |

## What Belongs Where

- New main process services → `src/core/`
- New IPC handlers → `src/main.js` + schema in `IPC_CONTRACT.md` + validator in `src/core/ipcValidators.js`
- New renderer components → `src/renderer/src/components/`
- New renderer hooks → `src/renderer/src/hooks/`
- New renderer-side runtime logic → `src/renderer/src/runtime/`
- New test files → `tear/` (unit/contract/smoke) or `e2e/` (Playwright)
- New release scripts → `scripts/` (clearly named, not `gen_*.cjs`)
- GTM/sales tooling → separate internal repo or `scripts/` with clear `# internal` comment

## Naming Conventions

- Components: PascalCase, descriptive noun phrases (`WorkspacePanel`, `ThreadRail`, `ProviderSweep`)
- IPC channels: `domain:verb` (`session:save`, `llm:chat`, `vault:unlock`)
- Core modules: camelCase, single responsibility (`sessionManager`, `auditChain`, `policyFirewall`)
- Test files: `<subject>.test.js` for unit/contract, `<flow>.spec.js` for E2E
- Config keys: camelCase, no abbreviations (`allowRemoteBridge`, not `allowRB`)

## Do Not Add

- New components that render placeholder/demo UI without a real backend
- New IPC channels without validators and schema documentation
- New `gen_*.cjs` scripts in the main repo for GTM purposes
- Duplicate `.ts` stubs alongside `.js` implementations
- Machine-local paths in any committed file
- Hardcoded secrets or signing keys
