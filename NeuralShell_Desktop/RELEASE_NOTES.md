# NeuralShell Desktop v0.2.0-rc1

Date: 2026-02-16  
Tag: `v0.2.0-rc1`  
Head: `f3e37a2`

## Highlights
- Security hardening for auth and sensitive IPC routes.
- First-run PIN setup flow with lockout after repeated failed attempts.
- Local PIN recovery flow requiring explicit `RESET PIN` confirmation and desktop confirmation.
- Auth audit logging for setup/login/lockout/recovery/logout events.
- Executable IPC authorization integration tests.
- Release pipeline now generates checksums automatically.

## Verification
- `npm run release:all` completed successfully.
- Test suite: `14/14` passing.

## Artifacts (SHA-256)
- `NeuralShell-TEAR-Setup-0.2.0.exe`  
  `650822dc3f75eb1a52a7c4dd5d186277f42037b6b6b95c6691aad3dc582e6a00`
- `NeuralShell-TEAR-Portable-0.2.0.exe`  
  `5c6dd1773fcf1a70f1a31bb3cbfcc11634eb8ba3ea21185a59486db2628ce737`

## Recent Commits
- `f3e37a2` checksum-autodiscovery
- `b723a92` release-all-checksums
- `ec15149` checksum-tooling
- `7ba3be2` Merge branch 'main' of https://github.com/Z3r0DayZion-install/NeuralShell

