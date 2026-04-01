# NeuralShell E2E Test Fix — Handover Document

**Date:** 2026-03-21  
**Branch:** `docs/phase29-seal-corrections`  
**Goal:** Fix E2E test failures in `e2e/ui-founder-flows.spec.js`

---

## Current State

| Metric | HEAD (before changes) | After changes |
|---|---|---|
| Tests passed | 16 | 17 |
| Tests failed | 15 | 14 |
| Total tests | 31 | 31 |

The E2E test suite runs via `npx playwright test e2e/ui-founder-flows.spec.js`.

---

## Files Changed (from HEAD)

### 1. `src/renderer.html` — Added 94 missing DOM element stubs

**Problem:** The `renderer.js` IDS array (lines 1–106) lists ~400 element IDs it expects to find in the DOM via `document.getElementById()`. At HEAD, **94 of those IDs were completely missing** from `renderer.html`, causing `el.someElement` to be `null` and crashing or silently failing throughout the app.

**What was done:** Added all 94 missing elements as stub elements at the bottom of `<main>` (just before the closing `</main>` tag, around line 1320+). They're grouped as:

- **Header chrome:** `heroProviderBadge`, `heroWorkflowSummaryText`, `heroFocusSummaryText`, `globalNextActionText`, `bridgeAutoDetectBtn`, `toggleRightPaneBtn`, `resetPaneLayoutBtn`, `modelSummary`, `sessionSummary`, `commandSummary`, `tokenSummary`, `offlineModeSummaryText`, `operatorRail`
- **Workflow/Mission Control:** `workflowQuickActions`, `workflowTitleText`, `workflowDescriptionText`, `workflowFollowupActions`, `threadTaskFocusText`, `threadTaskCapabilityText`, `threadTaskActionText`, `missionControlGrid`, `outputModeSelect`, `workflowSeedPromptBtn`
- **Intelligence Panel:** `intelligencePanel`, `intelFocusText`, `intelCapabilityText`, `intelNextActionText`, `intelCapabilityTrayBtn`, `intelCapabilityTray`, `capabilityGraph`, `intelModeText`, `intelBridgeText`, `intelSessionText`
- **Onboarding Wizard Steps:** `onboardingStepHome`, `onboardingStepProvider`, `onboardingStepEndpoint`, `onboardingStepModel`, `onboardingStepVerify`, `onboardingStepSummary`, `onboardingStepOffline`, `onboardingStepRepair` (plus all child inputs/selects/buttons within each step)
- **Trust Report:** `trustReportOverlay`, `trustReportContent`, `trustReportCloseBtn`, `trustReportExportJsonBtn`, `trustReportExportMdBtn`
- **Active Profile Bar (Phase 20):** `activeProfileBar`, `apbProfileName`, `apbProvider`, `apbModel`, `apbTrustBadge`, `apbReconnectPolicy`, `apbLastVerified`, `apbVerifyBtn`, `apbRepairBtn`, `apbSwitchBtn`, `apbOfflineBtn`, `apbDisconnectBtn`
- **Profile Switch Overlay (Phase 21):** `profileSwitchOverlay`, `profileSwitchList`, `profileSwitchCloseBtn`
- **Secret Recovery:** `onboardingRecoveryGroup`, `onboardingRecoverySecretInput`, `onboardingRecoverySubmitBtn`, `onboardingRecoveryCancelBtn`, `onboardingRecoveryClearBtn`

> **IMPORTANT:** These stubs are functional but positioned outside the main layout grid. They exist so `renderer.js` can populate and manage them, but they're not integrated into the correct visual layout positions. This is a known limitation — some tests expect these elements to be **visibly positioned** within specific layout columns.

**Verification:** `node tmp/find-missing-ids.js` now reports **0 missing IDs** (was 94).

---

### 2. `src/renderer.js` — Multiple targeted fixes

#### a) IDS Array Expansion (lines 1–106)
Added all 94 missing IDs to the IDS array so `el[id]` references resolve correctly. New IDs include onboarding wizard steps, trust report, active profile bar, profile switch overlay, intelligence panel, etc.

#### b) appState Defaults (lines ~114–210)
- `model: "llama3"` → `model: null` (no default model assumption)
- Added `setupState: "unconfigured"` (new state tracking)
- Added `onboardingDraft: null` and `onboardingCompleted: false`
- Added `groupFilter: "all"` to `verificationRunHistoryFilters`
- `llmStatus: "booting"` → `llmStatus: "unconfigured"`

#### c) System Surface ID Normalization (line ~9037)
- `"runtime"` now normalizes to `"performance"`
- `"release"` now normalizes to `"shipping"`
- `activateWorkflow()` and `setPerformanceTray()` now use the correct surface names

#### d) showBanner() — Onboarding Suppression (line ~8484)
Added guard to suppress "bad" tone banners during onboarding when `onboardingCompleted` is false and `setupState !== "ready"`.

#### e) Text Fixes
- **Line ~10696:** `"Session restored:"` → `"Session loaded:"` (Test #15 assertion mismatch)
- **Line ~946:** `"context - pack"` → `"context-pack"` (removed spaces around hyphens — Test #8 assertion mismatch)
- **Line ~954:** Same hyphen spacing fix for second context-pack message
- **Line ~8573:** `"Hosted providers are blocked"` → `"Hosted profiles are blocked"` (consistency)

#### f) Memory Leak Fix — WorkspaceSwitcher (line ~3309)
In `renderIntelSurface()`, added logic to preserve the `WorkspaceSwitcher` mount element when clearing `intelActionHints.innerHTML`, preventing the switcher from being destroyed and re-created on every render cycle (which was triggering `MaxListenersExceededWarning`).

#### g) Onboarding System Expansion (lines ~12824+)
Massive expansion of the onboarding wizard from a simple 2-screen flow to a multi-step wizard with provider selection, endpoint configuration, model selection, verification, summary, offline mode, and repair steps. `setOnboardingOpen()` now accepts a `state` parameter.

---

## Currently Failing Tests (14)

| Line | Test Name | Likely Issue |
|---|---|---|
| 246 | offline mode quick switch | `#offlineModeInput` uncheck fails — element visibility issue in header |
| 287 | workspace panes resize/collapse | Layout persistence — pane elements may not be wired |
| 361 | intel trays staging | `#intelCapabilityTrayBtn` needs proper layout positioning |
| 388 | context pack profiles build/reload | Workflow/context elements need layout integration |
| 579 | command palette toggles theme | Palette/theme switching may need additional wiring |
| 606 | command palette routes context actions | Context action routing through palette |
| 728 | profile editor/settings persist | Profile editor fields or settings wiring |
| 798 | provider presets/env profiles import | Provider preset and env profile integration |
| 859 | thread rail encrypted sessions | Session list rendering in thread rail |
| 914 | workflow/workspace/evidence/apply | Multi-surface coordination |
| 1028 | release cockpit verification checks | Shipping cockpit staging |
| 1285 | patch plans preview/apply/persist | Patch plan file handling |
| 1566 | verification run plans stage/execute | Verification run plan rendering |
| 1832 | session load/workspace edits | Surface reset on session load |

---

## Root Cause Analysis

The HEAD `renderer.html` was a **stripped-down version** with only ~1335 lines, missing ~94 element IDs that `renderer.js` (15,337 lines) expects to find. The JS code has evolved far ahead of the HTML template. Many features (onboarding wizard, intelligence panel, trust reports, profile management, etc.) have JS logic but no corresponding HTML elements.

**The core fix needed:** Each of the 94 stub elements needs to be moved from the bottom-of-file stubs into its **correct visual position** within the layout grid. The stubs guarantee `el[id] !== null` but tests that check visibility, click actions, or text content inside layout-specific positions will still fail.

---

## Key Architecture Notes

- **`renderer.js` lines 1–106:** The `IDS` array maps every element ID to `el[id]` via `document.getElementById()`. If ANY id is missing from HTML, `el[id]` is `null`.
- **`renderer.js` line 108:** `const el = {}; for (const id of IDS) { el[id] = document.getElementById(id); }` — this runs once at load.
- **Three-column layout:** `workspace-topology` → left column (inbox/sessions), center column (chat thread), right column (system surfaces). The right column has system surfaces: workbench, performance, shipping, context.
- **Onboarding overlay:** `#onboardingOverlay` covers the entire app until dismissed. Tests use `closeOnboardingViaSkip()` which clicks Skip then removes the overlay element.
- **The test helper** `closeOnboardingViaSkip(page)` is defined near the top of `e2e/ui-founder-flows.spec.js`.

---

## Recommended Next Steps

1. **Move stubs into correct positions:** Take each stub element from the bottom of `renderer.html` and integrate it into the proper section of the three-column layout (header, left pane, center column, right column surfaces, etc.)
2. **Run tests incrementally:** After moving each group of elements, run the specific failing test to verify: `npx playwright test e2e/ui-founder-flows.spec.js -g "test name substring"`
3. **Tackle the easiest tests first:** The "offline mode" test just needs `#offlineModeSummaryText` to be next to `#offlineModeInput` in the header. The intelligence tests need `#intelligencePanel` in the right column.

---

## Utility Script

A helper script exists at `tmp/find-missing-ids.js` that cross-references `renderer.js` IDS array against `renderer.html` and reports any missing element IDs. Run with `node tmp/find-missing-ids.js`.
