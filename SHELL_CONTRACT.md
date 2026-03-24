# Shell Layout Contract — NeuralShell V2.1.29+

> This contract defines the permanent structural zones of the NeuralShell operator shell.
> All future features must comply with these zone responsibilities.
> Violations require explicit approval and contract amendment.

## Zone Map

```
┌──────────────────────────────────────────────────┐
│                  TopStatusBar                    │
│  model · XP/tier · telemetry · palette/settings  │
├──────────┬────────────────────────┬──────────────┤
│          │                        │              │
│ Thread   │   ActiveWorkspace      │  Workbench   │
│  Rail    │                        │    Rail      │
│  (20%)   │       (60%)            │   (20%)      │
│          │                        │              │
│ sessions │  chat · composer ·     │ trust · diag │
│ search   │  thread · rituals      │ artifacts    │
│ filters  │                        │ runtime      │
│          │                        │              │
├──────────┴────────────────────────┴──────────────┤
│              Overlays (z-50+)                    │
│         CommandPalette · SettingsDrawer           │
└──────────────────────────────────────────────────┘
```

## Zone Responsibilities

### TopStatusBar
**Allowed:**
- Shell-level state indicators (model, bridge status)
- XP/tier display (if critical)
- Global action triggers (palette toggle, settings toggle)
- Compact telemetry (CPU, RAM, uptime)

**Not allowed:**
- Dashboard sprawl or analytics panels
- Low-value status controls
- Duplicated body-level actions
- Anything that grows the header beyond one row

---

### ThreadRail (Left, 20%)
**Allowed:**
- Thread/session list and navigation
- Session search and filters
- Compact quick actions (new, rename, delete)
- Pinned/favorite indicators

**Not allowed:**
- Workbench-level tooling
- Large diagnostic or analytics panels
- Expanded settings sections
- Content display (that belongs in ActiveWorkspace)

---

### ActiveWorkspace (Center, 60%)
**Allowed:**
- Active thread content and chat log
- Composer/prompt input
- Signal injection and primary action lane
- Ritual Terminal (when invoked)
- Recovery actions tied to the current thread

**Not allowed:**
- Expanded support tooling or diagnostic panels
- Runtime deep-detail panels
- Persistent toolbars unrelated to the active thread
- Settings or configuration surfaces

---

### WorkbenchRail (Right, 20%)
**Allowed:**
- Runtime/integrity summary (OMEGA trust state)
- System diagnostics (compact)
- Artifact staging and output review
- Patch/review/apply workflows

**Not allowed:**
- Primary compose flow
- Duplicated thread controls
- Full-screen or expanded diagnostic tools
- Settings panels

---

### CommandPalette (Overlay, z-50)
**Allowed:**
- Keyboard-first command search and execution
- Any command density that doesn't need permanent shell space
- Module-contributed commands (via registry)

**Not allowed:**
- Persistent UI elements
- Settings or configuration changes (use SettingsDrawer)
- Multi-step wizards

**Keybinding:** `Ctrl+K` (Windows/Linux) · `⌘+K` (macOS)

---

### SettingsDrawer (Overlay, z-50)
**Allowed:**
- User preferences and profile management
- Connection/bridge configuration
- Guarded defaults and security settings
- Layout preferences

**Not allowed:**
- Operational actions (use CommandPalette)
- Thread-specific controls
- Runtime diagnostics

---

## Component Boundary Map

| Component File | Zone | May Import From | Must Not Import |
|:---|:---|:---|:---|
| `TopStatusBar.jsx` | Header | `Metric`, `ShellBadge` | `ThreadRail`, `WorkspacePanel` |
| `ThreadRail.jsx` | Left rail | `Panel` | `WorkbenchRail`, `RitualTerminal` |
| `WorkspacePanel.jsx` | Center | `RitualTerminal`, `Panel` | `ThreadRail`, `WorkbenchRail` |
| `WorkbenchRail.jsx` | Right rail | `Panel`, `Metric`, `ShellBadge` | `ThreadRail`, `WorkspacePanel` |
| `CommandPalette.jsx` | Overlay | Command registry (future) | Zone-specific components |
| `RitualTerminal.jsx` | Workspace child | `Metric` | Zone wrappers |
| `Panel.jsx` | Utility | None (leaf) | — |
| `Metric.jsx` | Utility | None (leaf) | — |
| `ShellBadge.jsx` | Utility | None (leaf) | — |

## Layout Proportions (Locked)

| Rail | Width | Constraint |
|:---|:---|:---|
| ThreadRail | 260px (20%) | Min: 200px, Max: 320px |
| ActiveWorkspace | flex-1 (60%) | Always dominant |
| WorkbenchRail | 280px (20%) | Min: 220px, Max: 340px |

## Amendment Rules

1. New zones require a contract amendment with explicit justification
2. Moving responsibilities between zones requires a contract amendment
3. New permanent header elements require approval
4. New overlay surfaces must be registered in this contract
5. Layout proportions must not change without operator review
