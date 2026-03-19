# Phase 9 Wave 2: Workspace & Session Continuity Verification Plan

This document outlines the verification scenarios required to confirm that workspace attachment is materially useful and session continuity is dependable.

## Required Verification Scenarios

### 1. Attach workspace from cold start
- **Steps**:
    1. Start NeuralShell.
    2. Click the "Attach Workspace" button in the Intel surface.
    3. Select a local directory (e.g., the NeuralShell repository root).
- **Expected Result**: The workspace is attached, and the label reflects the selected directory.

### 2. Confirm workspace meaningfully changes the ready/useful state
- **Steps**:
    1. Once the workspace is attached, observe the "Intel Brief" tray.
    2. Look for "Starter Actions" (e.g., "Audit package.json", "Review uncommitted changes").
    3. Click a starter action button.
- **Expected Result**: Starter actions are visible and relevant to the workspace signals. Clicking an action populates the prompt input.

### 3. Save a working session
- **Steps**:
    1. Send at least 2-3 prompts to the bridge.
    2. Generate an artifact (e.g., use a workflow that produces a markdown file).
    3. Click "Save Session", enter a name ("wave2-session-test") and a passphrase.
- **Expected Result**: A success banner "Session saved: wave2-session-test" appears.

### 4. Reload/restore that session
- **Steps**:
    1. Close and restart NeuralShell (or use the "New Chat" button to clear state).
    2. Open the "Sessions" tray, find "wave2-session-test".
    3. Enter the passphrase and click "Load Session".
- **Expected Result**:
    - The chat history is restored.
    - The workspace is re-attached.
    - The "Session restored" banner is visible.

### 5. Verify restored session clearly shows active session + workspace context
- **Steps**:
    1. Observe the header and status meta.
    2. Observe the Intel Brief.
- **Expected Result**: The UI clearly indicates that "wave2-session-test" is active and the workspace context is grounded.

### 6. Verify no regressions to Wave 1 connection messaging and banners
- **Steps**:
    1. Trigger a bridge health check.
    2. Observe the connection banners (e.g., "Bridge Online").
- **Expected Result**: All connection feedback from Wave 1 remains functional and accurate.
