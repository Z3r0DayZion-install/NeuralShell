# Architecture Rules — NeuralShell V2.1.29+

> These rules prevent entropy. Violations must be justified and reviewed.

## Hard Rules

1. **No permanent header clutter** — TopStatusBar stays one row. New indicators require contract amendment.

2. **No preload bypass** — No renderer component may use `require('electron')`, `nodeIntegration`, or any mechanism that bypasses the preload/IPC boundary.

3. **No unversioned persisted state** — New persisted fields must increment `STATE_VERSION` and include a migrator in `stateManager.js`.

4. **No unregistered palette commands** — All commands must go through `moduleRegistry.registerModule()`. No hardcoded commands in `CommandPalette.jsx`.

5. **No workbench panel without modes** — New workbench panels must support compact/default/drill-down rendering.

6. **No duplicated actions** — A new surface must not duplicate an action already available in another zone without justification.

7. **No machine-local paths** — No hardcoded `C:\Users\...` or `/home/...` paths. Use `path.join`, `process.cwd()`, or `app.getPath()`.

8. **No new IPC channel without schema** — Every new channel must be documented in `IPC_CONTRACT.md` with version, request/response schemas.

## Soft Rules (Should Be Followed)

9. **Prefer design tokens** — Use `text-shell-*`, `bg-shell-*`, etc. from `tailwind.config.js`. Avoid new `text-[Xpx]` or `bg-[#hex]` values.

10. **State categorization** — New state must be classified as UI/Domain/System/Transient per `ShellContext.jsx` patterns.

11. **Experimental isolation** — New features should start as `stability: 'experimental'` in the module registry and be feature-flagged.

## Enforcement

| Rule | Enforcement Method | Status |
|:---|:---|:---|
| No preload bypass | `ast_gate.js` + ESLint | ✅ Active |
| No machine-local paths | `grep` in CI + portability scrub | ✅ Active |
| No unregistered commands | Code review | 🟡 Manual |
| No unversioned state | Code review | 🟡 Manual |
| Design tokens | Code review | 🟡 Manual |
| No header clutter | `SHELL_CONTRACT.md` review | 🟡 Manual |
