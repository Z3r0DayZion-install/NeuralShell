# Hotfix and Rollback Runbook

## Hotfix Process

1. Branch from `master`:

```powershell
git checkout master
git pull
git checkout -b hotfix/<issue>
```

2. Implement fix and run gates:

```powershell
npm test
npm run ship:strict
```

3. Merge into `master` after `CI`, `Merge Gate`, `Release Contract`, and `Security Gate` pass.

4. Tag hotfix release:

```powershell
git tag v1.1.1-OMEGA
git push origin v1.1.1-OMEGA
```

## Emergency Rollback

1. Identify last known good tag from GitHub Releases.
2. Re-point update host to prior stable metadata/artifacts.
3. Mark bad release as superseded in release notes.
4. Open incident note with:
- impact window
- affected version(s)
- rollback timestamp
- remediation PR/tag

## Verification After Rollback

- Run packaged smoke on rolled-back installer.
- Confirm clients resolve updater metadata to rollback version.
- Schedule root-cause fix and follow-up hotfix release.
