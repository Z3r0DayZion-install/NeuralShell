# Design Token System — NeuralShell V2.1.29+

> All new UI components must use these tokens.
> Ad-hoc values (`text-[9px]`, `bg-[#040c16]`, etc.) are legacy — do not add new ones.

## Token Reference

### Typography Scale
| Token | Size | Usage |
|:---|:---|:---|
| `text-shell-micro` | 8px | Badge metadata, version tags |
| `text-shell-label` | 9px | Zone headers, section labels |
| `text-shell-caption` | 10px | Controls, button text, hints |
| `text-shell-body` | 11px | Metric values, list items, badge text |
| `text-shell-title` | 13px | Panel titles, model names |
| `text-shell-input` | 14px | Chat bubbles |
| `text-shell-compose` | 15px | Composer textarea |

### Color Roles
| Role | Color | Usage |
|:---|:---|:---|
| Primary/Active | `cyan-400` (#22d3ee) | Active states, live indicators, interactive borders |
| Trust/Authority | `amber-300` (#fcd34d) | Proof badges, trust lane, gold accents |
| Success/Healthy | `emerald-400/500` | Node online, trust verified, healthy status |
| Warning/Degraded | `orange-400` | Degraded states, attention needed |
| Destructive | `red-400/500` | Critical errors, destructive actions |
| Surface: Canvas | `shell-canvas` (#020812) | Deepest background |
| Surface: Rail | `shell-surface` (#040c16) | Rail and header backgrounds |
| Surface: Panel | `shell-panel` (#071423) | Card and panel backgrounds |
| Surface: Overlay | `shell-overlay` (#0b1726) | Palette and overlay backgrounds |

### Spacing
| Token | Value | Usage |
|:---|:---|:---|
| `shell-xs` | 4px | Tight gaps, icon padding |
| `shell-sm` | 8px | Small gaps, inline spacing |
| `shell-md` | 12px | Module internal padding |
| `shell-lg` | 16px | Section spacing |
| `shell-xl` | 24px | Panel padding |
| `shell-2xl` | 32px | Large section padding |

### Border Radius
| Token | Value | Usage |
|:---|:---|:---|
| `rounded-shell` | 30px | Main shell container |
| `rounded-panel` | 24px | Panel cards |
| `rounded-control` | 12px | Buttons, inputs |
| `rounded-badge` | 9999px | Pills, status badges |

### Shadows
| Token | Usage |
|:---|:---|
| `shadow-shell-ambient` | Default panel depth |
| `shadow-shell-overlay` | Palette and overlay elevation |
| `shadow-shell-drawer` | Settings drawer left shadow |
| `shadow-shell-glow-cyan` | Subtle cyan hover glow |
| `shadow-shell-glow-node` | Node online pulse glow |
| `shadow-shell-glow-cmd` | Command palette button glow |

### Letter Spacing
| Token | Value | Usage |
|:---|:---|:---|
| `tracking-shell-tight` | 0.1em | Compact labels |
| `tracking-shell-normal` | 0.2em | Standard zone headers |
| `tracking-shell-wide` | 0.3em | Emphasized labels |
| `tracking-shell-ultra` | 0.4em | Section titles |
| `tracking-shell-max` | 0.6em | Watermark text |

## Rules
1. New components **must** use token classes, not ad-hoc `text-[Xpx]` or `bg-[#hex]`
2. New accent colors require explicit approval and addition to this system
3. New shadow/blur levels require justification
4. Existing inline values in legacy components are grandfathered but should be migrated over time
