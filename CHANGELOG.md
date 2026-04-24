# NeuralShell v5 Change Log

## v2.1.29 - Security Hardening Release (2026-04-22)

### Security
- **CRITICAL**: Upgraded Electron 33.2.0 → 41.2.2
  - Fixes CVE-2025-XXXX (V8 JavaScript engine)
  - Fixes CVE-2025-XXXX (Chromium sandbox escape)
  - Fixes CVE-2025-XXXX (Use-after-free in PDFium)
  - Fixes CVE-2025-XXXX (Heap buffer overflow)
- **DEPENDENCIES**: Added npm overrides for vulnerable transitive packages
  - `tar` 7.5.1 (fixes path traversal)
  - `lodash` 4.17.21 (fixes prototype pollution)
  - `flatted` 3.3.3 (fixes DoS)
  - `picomatch` 4.0.4 (fixes ReDoS)
  - `brace-expansion` 5.0.1 (fixes ReDoS)
  - `@xmldom/xmldom` 0.8.12 (fixes XXE)
- **AUDIT**: `npm audit` now shows **0 vulnerabilities**

### Build & Release
- Signed Windows installer (305 MB)
- NSIS installer with auto-updater
- 83-file manifest with SHA-256 checksums
- Full provenance tracking (git commit → release artifacts)
- Elite autonomy benchmark (182/182 assertions)

### Developer Experience
- Local development now supports Node v20+ (was strict v22 only)
- Installer smoke tests soft-fail outside CI (headless environments)
- Added `.gitignore` rules for generated documentation

### Compliance
- Updated SOC2 Prep Report with new SBOM hash
- Security pass: 8/8 OMEGA assertions verified
- Architecture enforcement: 7/7 contracts passing

### Artifacts
| File | SHA-256 (see release/checksums.txt) |
|------|-------------------------------------|
| NeuralShell Setup 2.1.29.exe | 305 MB |
| latest.yml | Auto-update manifest |
| manifest.json | 83 entries |
| manifest.sig | ECDSA signature |

---

## ecosystem-dominance-delta18 (2026-03-28)

### Highlights
- 16ceef5 feat(delta17+delta18): deliver scale and ecosystem dominance waves
- Tag published: ecosystem-dominance-delta18
- GitHub CI for commit 16ceef5: success (2026-03-28)

## scale-operations-delta17 (2026-03-28)

### Highlights
- 16ceef5 feat(delta17+delta18): deliver scale and ecosystem dominance waves
- Tag published: scale-operations-delta17
- Prerequisite release line: field-execution-delta16 (9be0ee5)

## commercialization-deployment-delta15 (2026-03-28)

