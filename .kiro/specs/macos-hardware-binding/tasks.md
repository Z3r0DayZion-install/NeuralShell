# Implementation Plan: macOS Hardware Identity Backend

## Overview

This implementation extends the existing `identityKernel.js` module with macOS-specific hardware enumeration logic. The implementation extracts stable hardware identifiers from macOS systems using IOKit registry queries (via `ioreg`) and system profiler commands, combines them into a composite identifier, and produces a SHA-256 hash that conforms to the existing 64-character hex identity contract.

The implementation follows a fallback chain architecture: ioreg (primary) → system_profiler (fallback) → degraded mode (partial identifiers) → hard failure (no identifiers). All commands execute through the OMEGA execution broker, and all events are logged to the audit chain.

## Tasks

- [x] 1. Add macOS command support to execution broker
  - Extend `src/kernel/execution.js` to allow `ioreg` and `system_profiler` commands on macOS
  - Add command validation to ensure commands only execute on `darwin` platform
  - Enforce 3000ms timeout for all hardware enumeration commands
  - _Requirements: 10.1, 10.2, 10.5_

- [x] 2. Implement parsing utilities for macOS hardware identifiers
  - [x] 2.1 Add `parseIOPlatformSerialNumber()` function to `identityKernel.js`
    - Parse IOPlatformSerialNumber from ioreg output using regex
    - Return trimmed value or empty string if not found
    - _Requirements: 2.2, 2.5_
  
  - [x] 2.2 Add `parseIOPlatformUUID()` function to `identityKernel.js`
    - Parse IOPlatformUUID from ioreg output using regex
    - Return trimmed value or empty string if not found
    - _Requirements: 3.2, 3.5_
  
  - [x] 2.3 Add `parseSystemProfilerSerial()` function to `identityKernel.js`
    - Parse Serial Number from system_profiler output using regex
    - Return trimmed value or empty string if not found
    - _Requirements: 4.2, 4.5_
  
  - [x]* 2.4 Write unit tests for parsing functions
    - **Test file:** `tear/identity-kernel-macos-parsing.test.js`
    - Test valid extraction, empty strings, missing keys, malformed output, whitespace trimming
    - _Requirements: 2.2, 2.5, 3.2, 3.5, 4.2, 4.5_

- [x] 3. Implement macOS hardware extraction with fallback chain
  - [x] 3.1 Add `getMacOSHardwareId()` function to `identityKernel.js`
    - Extract IOPlatformSerialNumber via ioreg (primary)
    - Extract IOPlatformUUID via ioreg (primary)
    - Fall back to system_profiler if ioreg fails for serial
    - Handle command execution failures gracefully
    - Log all extraction attempts to audit chain
    - _Requirements: 2.1, 2.3, 2.4, 3.1, 3.3, 3.4, 4.1, 4.3, 4.4, 10.3, 10.4, 12.4_
  
  - [x] 3.2 Implement composite identifier generation logic
    - Combine serial and UUID as `${serial}:${uuid}` when both available (success mode)
    - Use UUID only when serial is missing (degraded mode)
    - Use serial only when UUID is missing (degraded mode)
    - Throw error when both are missing (hard failure)
    - Log mode transitions to audit chain
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 8.1, 8.2, 8.3, 8.5, 9.1, 9.2, 9.3, 9.4, 9.5, 12.2, 12.3_
  
  - [x] 3.3 Implement SHA-256 fingerprint generation
    - Compute SHA-256 hash of composite identifier
    - Output as 64-character hexadecimal string
    - Cache fingerprint in module-level variable
    - Return cached value on subsequent calls
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.3_
  
  - [x] 3.4 Add audit chain logging for all hardware binding events
    - Log success events with platform='darwin' and status='success'
    - Log degraded mode events with status='degraded'
    - Log hard failure events with status='failed'
    - Log fallback events with method='system_profiler-fallback'
    - Include identifier availability in all log entries
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 4. Integrate macOS backend into platform detection
  - Modify `getHardwareId()` to detect `process.platform === 'darwin'`
  - Route to `getMacOSHardwareId()` when on macOS
  - Preserve existing Windows and Linux routing logic
  - Ensure macOS code does not execute on other platforms
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 5. Checkpoint - Verify core implementation
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Write comprehensive test suite
  - [x]* 6.1 Write composite identifier tests
    - **Test file:** `tear/identity-kernel-macos-composite.test.js`
    - Test success mode (both identifiers), degraded mode (one identifier), hard failure (no identifiers)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [x]* 6.2 Write fingerprint generation tests
    - **Test file:** `tear/identity-kernel-macos-fingerprint.test.js`
    - Test 64-char hex output, determinism, caching, uniqueness
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.2, 7.3, 7.4_
  
  - [x]* 6.3 Write error handling tests
    - **Test file:** `tear/identity-kernel-macos-errors.test.js`
    - Test command failures, timeouts, degraded mode, hard failure, no insecure fallbacks
    - _Requirements: 2.4, 3.4, 4.4, 8.1, 8.2, 8.5, 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [ ]* 6.4 Write audit chain tests
    - **Test file:** `tear/identity-kernel-macos-audit.test.js`
    - Test success logging, degraded mode logging, hard failure logging, fallback logging, platform field
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_
  
  - [ ]* 6.5 Write property-based tests
    - **Test file:** `tear/identity-kernel-macos-properties.test.js`
    - **Property 1:** Platform detection routes correctly
    - **Property 5:** Identifier normalization removes whitespace
    - **Property 9:** SHA-256 produces 64-char hex
    - **Property 10:** Hash computation is deterministic
    - **Property 21:** Cross-platform format consistency
    - **Property 26:** Hash collision resistance
    - Use fast-check library with 100+ iterations per property
    - _Requirements: 1.1, 1.2, 2.5, 3.5, 4.5, 6.2, 6.4, 11.2, 11.4, 15.2_

- [ ] 7. Verify downstream compatibility
  - [ ]* 7.1 Write integration tests
    - **Test file:** `tear/identity-kernel-macos-integration.test.js`
    - Test end-to-end extraction on macOS (requires macOS CI)
    - Test fingerprint stability across multiple calls
    - Test license binding works with macOS fingerprint
    - Test vault encryption works with macOS fingerprint
    - Test peer trust works with macOS fingerprint
    - _Requirements: 7.1, 7.2, 11.5_
  
  - [x]* 7.2 Verify identity contract preservation
    - Test that macOS fingerprints are 64-char hex strings
    - Test that format matches Windows and Linux fingerprints
    - Test that downstream consumers work without modification
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Generate proof artifacts for Work Packet 1 closeout
  - [x] 9.1 Create implementation proof document
    - **File:** `docs/proofs/batch1-macos-backend-proof.md`
    - Include code snippets from identityKernel.js and execution.js
    - Include parsing function implementations
    - Include error handling implementations
    - Include audit chain integration
    - _Requirements: 13.1, 13.2_
  
  - [x] 9.2 Document Device 3 test results in proof
    - Include device specifications (model, macOS version, hardware)
    - Include extracted identifiers (first 4/8 chars only)
    - Include generated fingerprint (first 8 chars only)
    - Include stability test results (10 reboots)
    - Include fallback chain verification
    - Include degraded mode verification
    - _Requirements: 13.3, 7.5_
  
  - [x] 9.3 Document Device 4 test results in proof
    - Include device specifications (model, macOS version, hardware)
    - Include extracted identifiers (first 4/8 chars only)
    - Include generated fingerprint (first 8 chars only)
    - Include stability test results (10 reboots)
    - Include fallback chain verification
    - Include degraded mode verification
    - _Requirements: 13.4, 7.5_
  
  - [x] 9.4 Document cross-device uniqueness verification in proof
    - Include Device 3 fingerprint (first 8 chars)
    - Include Device 4 fingerprint (first 8 chars)
    - Verify fingerprints differ
    - Verify no collision occurred
    - _Requirements: 13.5, 15.1, 15.2, 15.3, 15.4, 15.5_
  
  - [x] 9.5 Document downstream compatibility verification in proof
    - Include license binding test results
    - Include vault encryption test results
    - Include peer trust test results
    - Verify identity contract is preserved
    - _Requirements: 13.6, 11.5_
  
  - [x] 9.6 Document audit chain verification in proof
    - Include sample audit log entries for success case
    - Include sample audit log entries for degraded mode
    - Include sample audit log entries for hard failure
    - Include sample audit log entries for fallback usage
    - Verify all entries include platform='darwin'
    - _Requirements: 13.7, 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 10. Final checkpoint - Work Packet 1 completion
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties with 100+ iterations
- Unit tests validate specific examples and edge cases
- Integration tests require macOS CI environment
- Proof artifacts document implementation and test results for Work Packet 1 closeout
- All hardware enumeration commands execute through OMEGA execution broker (no direct child_process usage)
- All events are logged to audit chain for auditability
- Implementation preserves existing 64-character hex SHA-256 identity contract
- No changes required to downstream consumers (license binding, vault encryption, peer trust)
