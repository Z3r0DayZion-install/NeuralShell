# NeuralShell Audit VM (Vagrant)

This VM gives auditors a reproducible Ubuntu 22.04 environment with NeuralShell proof artifacts preloaded.

## Quick start

```bash
vagrant up
vagrant ssh
```

Inside VM:

- Read-only source snapshot: `/vagrant`
- Proof artifact lane: `/opt/neuralshell-audit/proof`
- Starter doc: `/opt/neuralshell-audit/README.txt`

## Box packaging

On tagged release, CI runs the Vagrant box workflow and publishes:

- `neuralshell-audit.box`

Download links are attached to release assets for tagged builds.
