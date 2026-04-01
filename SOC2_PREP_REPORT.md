# SOC2 Prep Report

- Framework: **SOC2-Prep-v1**
- Generated: **2026-03-27T06:50:14.846Z**
- Controls Passing: **3/3**
- Result: **PASS**

## CC6.1 - Logical access and identity controls
Status: **PASS**

| File | Exists | SHA-256 |
|---|---|---|
| `src/core/identityKernel.js` | yes | b4a55f4535b8aa754e21aff3f4c5e702e8dd14e706556d9562fbbdaf630ba63b |
| `src/core/secretVault.js` | yes | f76291014b8982dd5b48938cdc18458503e29e9d94825896a2edd11c55bafc77 |
| `src/main.js` | yes | 3425cb60c13ac9981e1eae207d33cf3f2433172db0367802cd552fb50320a6f9 |

## CC7.2 - Monitoring and anomaly evidence
Status: **PASS**

| File | Exists | SHA-256 |
|---|---|---|
| `release/proof-bundle-summary.json` | yes | 8e4d4343457de3ea7e0164dbffe37e1591a953bdc574e5db3f8e793a87c70414 |
| `artifacts/sbom/latest.json` | yes | 3d57b7255bbca4b586c10dc8ca3af9c7ef605e700d33d14c71ed37b72c8ac32d |
| `release/llm-sweep-report.json` | yes | 92719f173aca95cefd210be79bbab3f3fb05796ce0ef8560316ae97d3c36b3dd |

## CC8.1 - Change management and integrity
Status: **PASS**

| File | Exists | SHA-256 |
|---|---|---|
| `.github/workflows/ci.yml` | yes | 6c142656aa0d7f69e3ecbbdc0082abaa27c101d591a84c5e866a05e311caf76f |
| `.github/workflows/security-gate.yml` | yes | 83ab2549b5cb59caa3b0738781f5a7d9059e374a59db4a231565339689827a7f |
| `scripts/release-verify.js` | yes | 2e77e60f7048932bf0f573627a93476a335a6e2cdb84e1337891873fbd835f45 |

