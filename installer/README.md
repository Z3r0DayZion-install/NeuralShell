# neuralshell-installer

Install the latest NeuralShell founder-beta build in one command:

```bash
npx neuralshell-installer
```

Optional flags:

- `--repo owner/name` (default: `Z3r0DayZion-install/NeuralShell`)
- `--channel latest` (default: latest GitHub release)
- `--install-dir <path>` override install destination
- `--license-key <key>` enables operator mode at install time
- `--dry-run` fetch metadata without writing files

Defaults:

- Windows installs to `%ProgramFiles%/NeuralShell` when writable, otherwise `%USERPROFILE%/Applications/NeuralShell`
- macOS/Linux install to `~/Applications/NeuralShell`
- Without `--license-key`, installer writes `LICENSE_MODE=auditor` runtime override
