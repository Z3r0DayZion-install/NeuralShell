# Phase 7 Wave 1: Environment Isolation & Hook Hardening

## Overview
This wave implements a clean separation between the active development workspace and release-staged artifacts to eliminate pre-push friction while preserving the integrity of the archived baseline.

## Problem Statement
Previously, the `npm run release:worktree` check (part of the pre-push gate) was too aggressive. It flagged untracked release folders and distribution-ready artifacts as "worktree problems," forcing developers to use `NEURAL_SKIP_PREPUSH=1` even for legitimate source changes.

## Changes Implemented

### 1. Environment Isolation
- **.gitignore**: Added wildcards for `NeuralShell_*_GoldMaster_Release/` and `NeuralShell_Distribution_Ready/`. This prevents these folders from being seen as "untracked" by Git porcelain commands.
- **.release-local-drift**: Added glob patterns (`**`) for these folders. This ensures that even if files within these folders are accidentally tracked, they are treated as "allowed drift" and do not block pushes.

### 2. Pre-push Hook Hardening
- **verify-clean-worktree.js**: Refactored the reporting logic to explicitly call out "Environment Isolation." The script now logs every ignored entry, providing transparency to the operator while still allowing the push to proceed if no source files are modified.

## What the Hook Now Blocks
- Any modified or untracked files in the core `src/`, `scripts/`, or `tear/` directories.
- Modifications to core config files like `package.json` (unless intentionally allowlisted).

## What the Hook Now Allows
- Untracked or modified files within the designated release isolation zones (`NeuralShell_*_GoldMaster_Release/` and `NeuralShell_Distribution_Ready/`).

## Operational Guidance
The `NEURAL_SKIP_PREPUSH=1` override still exists for emergency scenarios or complex worktree states, but it should no longer be required for normal release operations.
