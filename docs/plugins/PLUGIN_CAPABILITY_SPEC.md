# Plugin Capability Manifest Specification

Example:
{
  "name": "swarm-consensus",
  "version": "1.0.0",
  "capabilities": [
    "network.fetch",
    "ledger.sync"
  ],
  "entry": "plugins/swarm-consensus.js",
  "hash": "<sha256>",
  "signature": "<ed25519 signature>"
}

Enforcement rule:
The kernel must reject any plugin action outside the declared capability list.
