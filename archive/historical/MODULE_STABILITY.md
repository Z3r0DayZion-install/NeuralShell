# Module Stability Classification — NeuralShell V2.1.29+

> Classifies all shell modules into stability tiers.
> Experimental modules are hidden by default and require feature flags.

## Tier Definitions

| Tier | Meaning | Visibility | Change Rules |
|:---|:---|:---|:---|
| **Core** | Essential shell infrastructure — cannot be disabled | Always visible | Requires contract amendment |
| **Trusted** | Released, tested modules part of the GA surface | Visible by default | Standard review |
| **Experimental** | New/prototype features under development | Hidden by default | Feature-flagged, opt-in only |

## Current Classification

### Core (Cannot be disabled)
| Module | Zone | File |
|:---|:---|:---|
| TopStatusBar | Header | `TopStatusBar.jsx` |
| ThreadRail | Left rail | `ThreadRail.jsx` |
| WorkspacePanel | Center | `WorkspacePanel.jsx` |
| WorkbenchRail | Right rail | `WorkbenchRail.jsx` |
| CommandPalette | Overlay | `CommandPalette.jsx` |
| SettingsDrawer | Overlay | `SettingsDrawer.jsx` |
| ShellContext | State | `state/ShellContext.jsx` |
| useNeuralState | Hook | `hooks/useNeuralState.js` |

### Trusted (Visible by default)
| Module | Zone | File |
|:---|:---|:---|
| RitualTerminal | Workspace child | `RitualTerminal.jsx` |
| Panel | Utility | `Panel.jsx` |
| Metric | Utility | `Metric.jsx` |
| ShellBadge | Utility | `ShellBadge.jsx` |
| Module Registry | State | `state/moduleRegistry.js` |

### Experimental (Hidden by default)
*No experimental modules currently registered.*

## Feature Flag Convention

Experimental modules should check a flag before rendering:
```jsx
// In the experimental module
import { getModulesForSlot } from '../state/moduleRegistry';

// Registration (in moduleRegistry.js or a plugin file)
registerModule({
    id: 'exp-network-graph',
    slot: 'workbench.runtime',
    title: 'Network Graph',
    stability: 'experimental',
    visible: () => localStorage.getItem('ns_exp_network_graph') === 'true',
    component: NetworkGraphPanel,
});
```

## Rules
1. New modules default to **experimental** until promoted through review
2. Experimental modules must not pollute the stable shell by default
3. Promotion from experimental → trusted requires passing all existing tests
4. Core modules cannot be demoted or removed without a contract amendment
