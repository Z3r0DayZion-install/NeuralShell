# WinGet-Pkgs PR Body (v1.2.1-OMEGA)

Suggested PR title:

`Add NeuralShellTeam.NeuralShell version 1.2.1-OMEGA`

Suggested PR body:

```text
Checklist for Pull Requests
- [ ] Have you signed the Contributor License Agreement?
- [ ] Is there a linked Issue? If so, fill in the Issue number below.
  - No linked issue for this new package submission.

Manifests
- [ ] Have you checked that there aren't other open pull requests for the same manifest update/change?
- [x] This PR only modifies one (1) manifest
- [x] Have you validated your manifest locally with `winget validate --manifest <path>`?
- [x] Have you tested your manifest locally with `winget install --manifest <path>`?
- [x] Does your manifest conform to the 1.12 schema?

Validation path:
manifests/n/NeuralShellTeam/NeuralShell/1.2.1-OMEGA

Validation command used:
winget validate --manifest manifests/n/NeuralShellTeam/NeuralShell/1.2.1-OMEGA --disable-interactivity

Install command used:
winget install --manifest manifests/n/NeuralShellTeam/NeuralShell/1.2.1-OMEGA --disable-interactivity --silent --force --accept-package-agreements --accept-source-agreements

Published installer URL:
https://github.com/Z3r0DayZion-install/NeuralShell/releases/download/v1.2.1-OMEGA/NeuralShell.Setup.1.2.1-OMEGA.exe
```

## Notes

- Local validation is complete.
- The generated manifests live in:
  - `release/winget/manifests/n/NeuralShellTeam/NeuralShell/1.2.1-OMEGA/`
- The staged upstream clone branch is:
  - `submit/neuralshell-1.2.1-omega`
