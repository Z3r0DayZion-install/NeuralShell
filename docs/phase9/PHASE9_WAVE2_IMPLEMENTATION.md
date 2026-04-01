# Phase 9 Wave 2: Workspace & Session Continuity Implementation Plan

This plan focuses on making workspace attachment materially useful and session continuity feel dependable and obvious.

## Proposed Changes

### UI & State Management (src/renderer.js)

- **Enhance buildIntelBriefModel**:
    - Add logic to derive "Starter Actions" from `appState.workspaceAttachment.signals`.
    - If `signals` contains `node`, add "Audit package.json" and "Verify local dependencies".
    - If `signals` contains `git`, add "Review uncommitted changes".
    - Populate a new `starterActions` array in the returned model.

- **Enhance renderIntelSurface**:
    - Add a new "Starter Actions" section to the Brief tray.
    - These actions will be rendered as buttons that, when clicked, populate the prompt input with a relevant command or question.

- **Enhance renderHeroSpotlight**:
    - Update the summary text to be more workspace-aware.
    - If a workspace is attached, show "Vouching for [Workspace Label]" or similar grounded language.

- **Improve Session Restoration Visibility**:
    - Update `loadInitialState` to show a banner: "System state restored. Workspace [Label] is active."
    - Update `loadSessionTarget` to show a banner: "Session [Name] restored. [X] chat messages grounded."
    - Add a `restored` indicator to `el.statusMeta` or a similar global element to make it obvious that work was recovered.

- **Ground Workspace + Bridge State**:
    - Ensure `reconcileWorkspaceBoundState` is called whenever a session is loaded to verify that the attached workspace still exists and is compatible.

## Verification Scenarios

1. **Attach workspace from cold start**:
    - Launch NeuralShell with no attached workspace.
    - Attach a local root project (e.g., this repository).
    - Verify that the "Intel Brief" updates to show workspace signals.

2. **Workspace meaningfully changes the ready/useful state**:
    - After attachment, confirm that "Starter Actions" appear in the Brief tray.
    - Verify these actions are clickable and populate the prompt.

3. **Save a working session**:
    - Conduct a chat session, generate an artifact, and attach a workspace.
    - Save the session with a name (e.g., "wave2-test") and passphrase.

4. **Reload/restore that session**:
    - Restart NeuralShell.
    - Locate "wave2-test" in the sessions list and load it.
    - Verify the "Session restored" banner is visible.

5. **Verify restored session clearly shows active session + workspace context**:
    - Confirm the chat history, workspace label, and bridge status are correctly restored.
    - Ensure the UI indicates the session is "restored" or "active".

6. **Verify no regressions to Wave 1 connection messaging**:
    - Ensure bridge health checks and connection banners (e.g., "Bridge Online") are still working as expected.
