# [SUPPORTING] IPC Contract
> [!NOTE]
> This document defines the normative IPC channel surface and security gating.

# IPC Contract Registry — NeuralShell V2.1.29+

> Every IPC channel must be documented here.
> Undocumented channels must not be added to `preload.js` ALLOWED_INVOKE_CHANNELS.

## Contract Version: 1.0.0

## Channel Categories

### Sessions (Stable)
| Channel | Version | Request | Response | Deprecation |
|:---|:---|:---|:---|:---|
| `session:list` | 1.0 | `void` | `Array<{name, preview, metadata}>` | — |
| `session:save` | 1.0 | `{name, payload, passphrase?}` | `{ok: bool}` | — |
| `session:load` | 1.0 | `{name, passphrase?}` | `{payload, metadata}` | — |
| `session:delete` | 1.0 | `{name}` | `{ok: bool}` | — |
| `session:rename` | 1.0 | `{oldName, newName}` | `{ok: bool}` | — |
| `session:search` | 1.0 | `{query}` | `Array<{name, preview, score}>` | — |
| `session:repair-index` | 1.0 | `void` | `{repaired: number}` | — |
| `session:export-peer` | 1.0 | `{name, peerId}` | `{ok: bool}` | — |

### Model/Bridge (Stable)
| Channel | Version | Request | Response | Deprecation |
|:---|:---|:---|:---|:---|
| `llm:ping` | 1.0 | `void` | `bool` | — |
| `llm:chat` | 1.0 | `Array<{role, content}>` | `{response}` | — |
| `llm:stream` | 1.0 | `Array<{role, content}>` | `bool` (stream init) | — |
| `llm:cancelStream` | 1.0 | `void` | `bool` | — |
| `llm:listModels` | 1.0 | `void` | `Array<string>` | — |
| `llm:health` | 1.0 | `void` | `{status, latency}` | — |
| `llm:autoDetect` | 1.0 | `void` | `{found, url}` | — |
| `llm:setPersona` | 1.0 | `string` | `void` | — |
| `model:set` | 1.0 | `string` | `void` | — |

### State Sync (Stable)
| Channel | Version | Request | Response | Deprecation |
|:---|:---|:---|:---|:---|
| `state:get` | 1.0 | `string` (key) | `any` | — |
| `state:set` | 1.0 | `{key, value}` | `void` | — |
| `state:update` | 1.0 | `object` (partial) | `void` | — |
| `state:export` | 1.0 | `void` | `object` (full state) | — |
| `state:import` | 1.0 | `object` | `void` | — |
| `state:calculateProfileFingerprint` | 1.0 | `object` (profile) | `string` (hash) | — |
| `settings:get` | 1.0 | `void` | `object` | — |

### XP/Ritual (Stable)
| Channel | Version | Request | Response | Deprecation |
|:---|:---|:---|:---|:---|
| `xp:status` | 1.0 | `void` | `{xp, tier, nextThreshold}` | — |
| `xp:add` | 1.0 | `number` | `{xp, tier}` | — |
| `ritual:list` | 1.0 | `void` | `Array<{id, name, desc}>` | — |
| `ritual:execute` | 1.0 | `string` (id) | `{ok, result}` | — |
| `ritual:schedule` | 1.0 | `{id, timestamp}` | `void` | — |
| `ritual:setAutoTrigger` | 1.0 | `object` (criteria) | `void` | — |
| `ritual:scheduled` | 1.0 | `void` | `Array<{id, timestamp}>` | — |

### Telemetry (Stable)
| Channel | Version | Request | Response | Deprecation |
|:---|:---|:---|:---|:---|
| `system:stats` | 1.0 | `void` | `{cpuPercent, memoryMb, uptimeSec}` | — |
| `telemetry:log` | 1.0 | `object` (entry) | `void` | — |
| `diagnostics:get-recent` | 1.0 | `void` | `Array<object>` | — |
| `diagnostics:clear` | 1.0 | `void` | `void` | — |

### Identity/Trust (Stable)
| Channel | Version | Request | Response | Deprecation |
|:---|:---|:---|:---|:---|
| `identity:pubkey` | 1.0 | `void` | `string` (PEM) | — |
| `identity:trust-peer` | 1.0 | `string` (peerId) | `void` | — |
| `identity:revoke-peer` | 1.0 | `string` (peerId) | `void` | — |
| `identity:list-peers` | 1.0 | `void` | `Array<string>` | — |
| `identity:rotate` | 1.0 | `void` | `{newFingerprint}` | — |
| `verification:run` | 1.0 | `void` | `{passed, failures}` | — |

### Workspace (Stable)
| Channel | Version | Request | Response | Deprecation |
|:---|:---|:---|:---|:---|
| `workspace:get-all` | 1.0 | `void` | `Array<object>` | — |
| `workspace:get-active` | 1.0 | `void` | `object` | — |
| `workspace:set-active` | 1.0 | `string` (id) | `void` | — |
| `workspace:register` | 1.0 | `object` | `void` | — |

### Event Channels (Listener)
| Channel | Version | Direction | Payload |
|:---|:---|:---|:---|
| `llm-status-change` | 1.0 | main→renderer | `{status, model}` |
| `daemon-status` | 1.0 | main→renderer | `{running, pid}` |
| `transfer-progress` | 1.0 | main→renderer | `{percent, speed}` |
| `xp-update` | 1.0 | main→renderer | `{xp, tier}` |
| `ritual-triggered` | 1.0 | main→renderer | `{id, result}` |
| `state-updated` | 1.0 | main→renderer | `{key, value}` |
| `workspace:changed` | 1.0 | main→renderer | `object` |
| `workspace:list-updated` | 1.0 | main→renderer | `Array<object>` |

## Deprecation Rules

1. Deprecated channels must be marked with a deprecation date and replacement
2. Deprecated channels must continue working for at least 2 minor versions
3. Removal requires a major version bump
4. Tests must cover both the deprecated and replacement channels during the overlap

## Amendment Rules

1. New channels must be documented here before being added to `preload.js`
2. Schema changes to existing channels require a version bump
3. Breaking changes require a new channel name, not a silent change
