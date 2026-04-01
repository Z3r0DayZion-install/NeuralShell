# Requirements Document: macOS Hardware Identity Backend

## Introduction

This feature implements hardware-bound device identity for macOS platforms, extending the existing Windows-only hardware binding to support cross-platform operation. The implementation extracts stable hardware identifiers from macOS systems using IOKit (via ioreg) and system_profiler, combines them into a composite identifier, and produces a SHA-256 hash that conforms to the existing 64-character hex identity contract.

The macOS backend is part of Work Packet 1 in Core IP Hardening Batch 1, which aims to strengthen NeuralShell's most defensible IP by extending hardware-bound identity across all supported platforms (Windows, macOS, Linux).

## Glossary

- **Identity_Kernel**: The core module (`src/core/identityKernel.js`) responsible for device identity, Ed25519 keypair generation, and peer trust management
- **Hardware_Fingerprint**: A 64-character hexadecimal SHA-256 hash derived from immutable hardware identifiers
- **IOPlatformSerialNumber**: macOS hardware serial number exposed via IOKit registry
- **IOPlatformUUID**: macOS hardware UUID exposed via IOKit registry
- **ioreg**: macOS command-line utility for querying the IOKit registry
- **system_profiler**: macOS command-line utility for querying system hardware information
- **Execution_Broker**: The kernel module (`src/kernel/execution.js`) that enforces secure command execution with binary hash verification
- **Identity_Contract**: The requirement that all hardware fingerprints must be 64-character hex SHA-256 hashes, regardless of platform
- **Degraded_Mode**: Operational state where hardware binding uses reduced identifier set due to missing or unavailable hardware data
- **Fallback_Chain**: Sequence of progressively less preferred methods for obtaining hardware identifiers
- **Downstream_Consumer**: Any module that depends on the hardware fingerprint (license binding, vault encryption, peer trust)

## Requirements

### Requirement 1: Platform Detection

**User Story:** As the Identity Kernel, I want to detect when running on macOS, so that I can invoke the platform-specific hardware enumeration logic.

#### Acceptance Criteria

1. WHEN `getHardwareId()` is invoked, THE Identity_Kernel SHALL check `process.platform`
2. WHEN `process.platform` equals `'darwin'`, THE Identity_Kernel SHALL execute macOS-specific hardware enumeration
3. WHEN `process.platform` does not equal `'darwin'`, THE Identity_Kernel SHALL execute the appropriate platform-specific logic (Windows or Linux)
4. THE Identity_Kernel SHALL NOT execute macOS hardware enumeration on non-macOS platforms

### Requirement 2: IOPlatformSerialNumber Extraction

**User Story:** As the Identity Kernel, I want to extract IOPlatformSerialNumber from the IOKit registry, so that I can use it as the primary hardware identifier.

#### Acceptance Criteria

1. WHEN macOS hardware enumeration is invoked, THE Identity_Kernel SHALL execute `ioreg -l | grep IOPlatformSerialNumber`
2. WHEN the ioreg command succeeds, THE Identity_Kernel SHALL parse the IOPlatformSerialNumber value from the output
3. WHEN the IOPlatformSerialNumber value is non-empty, THE Identity_Kernel SHALL store it for fingerprint generation
4. WHEN the ioreg command fails or returns empty output, THE Identity_Kernel SHALL proceed to the fallback chain
5. THE Identity_Kernel SHALL trim whitespace from the extracted IOPlatformSerialNumber value

### Requirement 3: IOPlatformUUID Extraction

**User Story:** As the Identity Kernel, I want to extract IOPlatformUUID from the IOKit registry, so that I can use it as a secondary hardware identifier.

#### Acceptance Criteria

1. WHEN macOS hardware enumeration is invoked, THE Identity_Kernel SHALL execute `ioreg -rd1 -c IOPlatformExpertDevice | grep IOPlatformUUID`
2. WHEN the ioreg command succeeds, THE Identity_Kernel SHALL parse the IOPlatformUUID value from the output
3. WHEN the IOPlatformUUID value is non-empty, THE Identity_Kernel SHALL store it for fingerprint generation
4. WHEN the ioreg command fails or returns empty output, THE Identity_Kernel SHALL proceed to the fallback chain
5. THE Identity_Kernel SHALL trim whitespace from the extracted IOPlatformUUID value

### Requirement 4: system_profiler Fallback

**User Story:** As the Identity Kernel, I want to fall back to system_profiler when ioreg fails, so that I can still obtain hardware identifiers on systems where ioreg is unavailable or restricted.

#### Acceptance Criteria

1. WHEN ioreg extraction fails for IOPlatformSerialNumber, THE Identity_Kernel SHALL execute `system_profiler SPHardwareDataType | grep "Serial Number"`
2. WHEN the system_profiler command succeeds, THE Identity_Kernel SHALL parse the Serial Number value from the output
3. WHEN the Serial Number value is non-empty, THE Identity_Kernel SHALL use it as the IOPlatformSerialNumber
4. WHEN the system_profiler command fails or returns empty output, THE Identity_Kernel SHALL proceed to degraded mode
5. THE Identity_Kernel SHALL trim whitespace from the extracted Serial Number value

### Requirement 5: Composite Identifier Generation

**User Story:** As the Identity Kernel, I want to combine IOPlatformSerialNumber and IOPlatformUUID into a composite identifier, so that I can generate a stable hardware fingerprint.

#### Acceptance Criteria

1. WHEN both IOPlatformSerialNumber and IOPlatformUUID are available, THE Identity_Kernel SHALL combine them as `${platformSerial}:${hardwareUUID}`
2. WHEN only IOPlatformUUID is available (degraded mode), THE Identity_Kernel SHALL use `${hardwareUUID}` as the composite identifier
3. WHEN neither identifier is available, THE Identity_Kernel SHALL trigger hard failure
4. THE Identity_Kernel SHALL NOT use random UUIDs or hostname hashing as fallback identifiers
5. THE Identity_Kernel SHALL NOT modify the composite identifier format after generation

### Requirement 6: SHA-256 Fingerprint Generation

**User Story:** As the Identity Kernel, I want to compute a SHA-256 hash of the composite identifier, so that I can produce a hardware fingerprint that conforms to the identity contract.

#### Acceptance Criteria

1. WHEN the composite identifier is generated, THE Identity_Kernel SHALL compute its SHA-256 hash
2. THE Identity_Kernel SHALL output the hash as a 64-character hexadecimal string
3. THE Identity_Kernel SHALL cache the hardware fingerprint for subsequent calls
4. FOR ALL valid composite identifiers, computing the SHA-256 hash twice SHALL produce identical output (idempotence)
5. THE Identity_Kernel SHALL NOT produce fingerprints shorter or longer than 64 characters

### Requirement 7: Fingerprint Stability

**User Story:** As a downstream consumer, I want the hardware fingerprint to remain stable across reboots, so that I can reliably bind licenses and encrypt vaults.

#### Acceptance Criteria

1. WHEN the same macOS system is rebooted, THE Identity_Kernel SHALL produce an identical hardware fingerprint
2. WHEN hardware identifiers are extracted multiple times without reboot, THE Identity_Kernel SHALL produce an identical hardware fingerprint
3. WHEN the hardware fingerprint is cached, THE Identity_Kernel SHALL return the cached value without re-extraction
4. THE Identity_Kernel SHALL NOT produce different fingerprints for the same hardware configuration
5. FOR ALL macOS systems tested (Device 3 and Device 4), fingerprint stability SHALL be 100% across 10 reboots

### Requirement 8: Degraded Mode Detection

**User Story:** As the Identity Kernel, I want to detect when IOPlatformSerialNumber is unavailable, so that I can trigger degraded mode and warn the operator.

#### Acceptance Criteria

1. WHEN IOPlatformSerialNumber is empty or unavailable, THE Identity_Kernel SHALL trigger degraded mode
2. WHEN degraded mode is triggered, THE Identity_Kernel SHALL use IOPlatformUUID only as the composite identifier
3. WHEN degraded mode is triggered, THE Identity_Kernel SHALL log a warning to the audit chain
4. WHEN degraded mode is triggered, THE Identity_Kernel SHALL return a valid 64-character hex fingerprint
5. THE Identity_Kernel SHALL NOT trigger hard failure when only IOPlatformSerialNumber is missing

### Requirement 9: Hard Failure on Complete Identifier Loss

**User Story:** As the Identity Kernel, I want to trigger hard failure when all hardware identifiers are unavailable, so that I can prevent the system from operating without hardware binding.

#### Acceptance Criteria

1. WHEN both IOPlatformSerialNumber and IOPlatformUUID are unavailable, THE Identity_Kernel SHALL trigger hard failure
2. WHEN hard failure is triggered, THE Identity_Kernel SHALL log an error to the audit chain
3. WHEN hard failure is triggered, THE Identity_Kernel SHALL throw an error with message "Hardware binding failed on macOS"
4. WHEN hard failure is triggered, THE Identity_Kernel SHALL NOT fall back to random UUID generation
5. WHEN hard failure is triggered, THE Identity_Kernel SHALL NOT fall back to hostname hashing

### Requirement 10: Execution Broker Integration

**User Story:** As the Identity Kernel, I want to execute ioreg and system_profiler commands through the Execution Broker, so that I can maintain OMEGA security enforcement.

#### Acceptance Criteria

1. WHEN executing ioreg commands, THE Identity_Kernel SHALL use the kernel request interface with CAP_PROC capability
2. WHEN executing system_profiler commands, THE Identity_Kernel SHALL use the kernel request interface with CAP_PROC capability
3. THE Identity_Kernel SHALL NOT use `child_process.exec()` or `child_process.spawn()` directly
4. THE Identity_Kernel SHALL handle execution failures gracefully and proceed to fallback chain
5. THE Identity_Kernel SHALL enforce a 3000ms timeout for all hardware enumeration commands

### Requirement 11: Identity Contract Preservation

**User Story:** As a downstream consumer, I want the macOS hardware fingerprint to conform to the identity contract, so that I can use it interchangeably with Windows and Linux fingerprints.

#### Acceptance Criteria

1. THE Identity_Kernel SHALL produce 64-character hexadecimal SHA-256 hashes on macOS
2. THE Identity_Kernel SHALL NOT change the fingerprint format based on platform
3. THE Identity_Kernel SHALL NOT change the fingerprint format based on degraded mode status
4. FOR ALL platforms (Windows, macOS, Linux), the hardware fingerprint format SHALL be identical
5. THE Identity_Kernel SHALL NOT break compatibility with existing downstream consumers (license binding, vault encryption, peer trust)

### Requirement 12: Audit Chain Logging

**User Story:** As a security auditor, I want all hardware enumeration events logged to the audit chain, so that I can verify hardware binding integrity.

#### Acceptance Criteria

1. WHEN hardware enumeration succeeds, THE Identity_Kernel SHALL log a success event to the audit chain
2. WHEN degraded mode is triggered, THE Identity_Kernel SHALL log a warning event to the audit chain
3. WHEN hard failure is triggered, THE Identity_Kernel SHALL log an error event to the audit chain
4. WHEN fallback to system_profiler occurs, THE Identity_Kernel SHALL log an info event to the audit chain
5. THE Identity_Kernel SHALL include the platform name ('darwin') in all audit log entries

### Requirement 13: Proof Artifact Generation

**User Story:** As a release engineer, I want a proof artifact documenting the macOS backend implementation, so that I can verify Work Packet 1 completion.

#### Acceptance Criteria

1. WHEN Work Packet 1 is complete, THE release engineer SHALL generate `docs/proofs/batch1-macos-backend-proof.md`
2. THE proof artifact SHALL include code snippets showing macOS implementation
3. THE proof artifact SHALL include test results from Device 3 (modern Mac)
4. THE proof artifact SHALL include test results from Device 4 (legacy Mac)
5. THE proof artifact SHALL include fingerprint stability results (10 reboots per device)
6. THE proof artifact SHALL include fallback chain verification results
7. THE proof artifact SHALL include degraded mode verification results

### Requirement 14: Hardware Change Detection

**User Story:** As the Identity Kernel, I want the hardware fingerprint to change when hardware is replaced, so that I can detect unauthorized hardware modifications.

#### Acceptance Criteria

1. WHEN the CPU is replaced, THE Identity_Kernel SHALL produce a different hardware fingerprint
2. WHEN the motherboard is replaced, THE Identity_Kernel SHALL produce a different hardware fingerprint
3. WHEN RAM is added or removed, THE Identity_Kernel SHALL produce the same hardware fingerprint
4. WHEN storage is added or removed, THE Identity_Kernel SHALL produce the same hardware fingerprint
5. THE Identity_Kernel SHALL NOT produce different fingerprints for non-hardware changes (OS updates, software installation)

### Requirement 15: Cross-Device Uniqueness

**User Story:** As the Identity Kernel, I want to produce unique hardware fingerprints for different macOS devices, so that I can distinguish between devices in the peer trust registry.

#### Acceptance Criteria

1. FOR ALL tested macOS devices (Device 3 and Device 4), THE Identity_Kernel SHALL produce unique hardware fingerprints
2. THE Identity_Kernel SHALL NOT produce hash collisions across different devices
3. THE Identity_Kernel SHALL NOT produce identical fingerprints for different hardware configurations
4. FOR ALL tested devices, the first 8 characters of the fingerprint SHALL be unique
5. THE Identity_Kernel SHALL maintain fingerprint uniqueness across modern and legacy Mac hardware

---

## Requirements Quality Verification

All requirements in this document follow EARS patterns and comply with INCOSE quality rules:

- Active voice: "THE Identity_Kernel SHALL..."
- No vague terms: Specific commands, file paths, and error messages
- No pronouns: Explicit system names from Glossary
- Consistent terminology: Identity_Kernel, Hardware_Fingerprint, etc.
- Testable conditions: Specific commands, outputs, and behaviors
- Measurable criteria: 64-character hex, 100% stability, 10 reboots
- No escape clauses: No "where possible" or "if feasible"
- Positive statements: Focus on what SHALL happen, not what SHALL NOT (except for security requirements)
- One thought per requirement: Each acceptance criterion tests one specific behavior

---

## Out of Scope

The following items are explicitly out of scope for this feature:

- Linux hardware binding (covered in Work Packet 2)
- HSM/TPM integration (deferred to Batch 2)
- Key lifecycle hardening (deferred to Batch 3)
- Enterprise proof documentation (deferred to Batch 4)
- Cross-platform test harness (covered in Work Packet 3)
- VM detection and handling (covered in Linux backend)
- Hardware change UI notifications (existing behavior preserved)
- Fingerprint migration from hostname-based to hardware-based (manual reactivation required)
