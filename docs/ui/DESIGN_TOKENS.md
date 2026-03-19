# NeuralShell V2.1 Design Token Map

The V2.1 Stealth Tactical design system uses a two-tier token architecture for maximum consistency and flexibility.

## First Tier: Global Tactical Palette (`--ns-*`)
These tokens define the fundamental mission-critical colors for the entire application.

| Token | Hex | Role |
| :--- | :--- | :--- |
| `--ns-bg-0` | `#151816` | Dark Charcoal (Main background) |
| `--ns-bg-1` | `#1C201D` | Darker Slate (Surfaces/Cards) |
| `--ns-panel-0` | `#354030` | Deep Olive (Active Panels) |
| `--ns-panel-1` | `#2B3327` | Muted Sage (Inactive Panels) |
| `--ns-text-0` | `#E3E7DC` | Pale Stone (Primary Text) |
| `--ns-text-1` | `#AEB6A6` | Muted Stone (Secondary Text) |
| `--ns-amber` | `#D9A441` | Operational Attention / Recovery |
| `--ns-danger` | `#B64C3B` | Failure / Critical Anomaly |
| `--ns-success` | `#6C9B62` | Verified State / Healthy Connection |
| `--ns-border` | `rgba(227,231,220,0.12)` | Universal Tactical Edge |

## Second Tier: Functional Mapping
These tokens map the global tactical palette to functional roles within the UI.

- `--bg-0`: `var(--ns-bg-0)`
- `--panel`: `var(--ns-panel-0)`
- `--text`: `var(--ns-text-0)`
- `--line`: `var(--ns-border)`
- `--attention`: `var(--ns-amber)`
- `--bad`: `var(--ns-danger)`
- `--good`: `var(--ns-success)`

## Typography & Scale
- `--font-ui`: **Inter** (Regular/Semi-Bold)
- `--font-head`: **Outfit** (Bold)
- `--font-mono`: **DM Mono**
- `--radius-sm`: **4px** (Sharp Tactical)
- `--radius-md`: **6px** (Panel Radius)
