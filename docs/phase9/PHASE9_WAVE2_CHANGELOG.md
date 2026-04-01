# Phase 9 Wave 2 Changelog

## Status
Completed.

## What shipped

### Workspace Utility
- Added dynamic starter actions driven by detected workspace signals.
- `buildIntelBriefModel` now reads `appState.workspaceAttachment.signals`.
- Intel Briefing surfaces actionable buttons for grounded workflows such as:
  - Audit package.json
  - Verify local build
  - Review uncommitted

### Project Grounding
- Updated the Hero/Spotlight experience to reflect a vouched workspace-attached project state.
- Hero summary now communicates grounded project awareness instead of decorative copy.

### Session Continuity
- Added explicit restoration feedback when prior state is recovered.
- Introduced restoration banners such as:
  - `Session restored: [Name]`
  - `System state restored. Workspace [Label] is active.`
- Added `(Restored)` header status to make recovered sessions obvious.

## Verification
- Workspace attachment correctly detected `node`, `git`, and `electron` signals.
- Starter action buttons rendered and functioned correctly.
- Saved session restore flow showed banner feedback and updated the header state.
- No regressions were detected in Wave 1 connection logic.

## Files
- `src/renderer.js`
- `walkthrough.md`

## Outcome
Workspace usefulness is now visible, and session continuity is dependable.
