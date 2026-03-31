# Design Document: macOS Hardware Identity Backend

## Overview

This design implements hardware-bound device identity for macOS platforms by extending the existing `identityKernel.js` module with platform-specific hardware enumeration logic. The implementation extracts stable hardware identifiers from macOS systems using IOKit registry queries (via `ioreg`) and system profiler commands, combines them into a composite identifier, and produces a SHA-256 hash that conforms to the existing 64-character hex identity contract.

The macOS backend maintains strict compatibility with the existing identity contract consumed by licensing (`billing/licenseEngine.js`), vault encryption (`src/core/secretVault.js`), and peer trust management (within `identityKernel.js`). The design follows a fallback chain architecture to handle various macOS configurations, from modern Macs with full IOKit access to restricted environments where alternative methods are required.

### Design Goals

1. **Contract Preservation**: Produce identical 64-character hex SHA-256 fingerprints regardless of platform
2. **Stability**: Ensure fingerprints remain constant across reboots and OS updates
3. **Graceful Degradation**: Handle missing identifiers without breaking the system
4. **Security**: Execute all hardware queries through the OMEGA execution broker
5. **Auditability**: Log all hardware enumeration events to the audit chain

### Non-Goals

- Linux hardware binding (Work Packet 2)
- HSM/TPM integration (Batch 2)
- VM detection and special handling (Linux backend)
- Fingerprint migration tooling (manual reactivation required)

## Architecture

### Component Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    identityKernel.js                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              getHardwareId()                          │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  Platform Detection (process.platform)          │  │  │
│  │  │  ├─ 'win32'  → Windows backend (existing)       │  │  │
│  │  │  ├─ 'darwin' → macOS backend (NEW)              │  │  │
│  │  │  └─ 'linux'  → Linux backend (future)           │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │                                                         │  │
│  │  macOS Backend Flow:                                   │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │ 1. Extract IOPlatformSerialNumber (ioreg)      │  │  │
│  │  │ 2. Extract IOPlatformUUID (ioreg)              │  │  │
│  │  │ 3. Fallback: system_profiler (if ioreg fails)  │  │  │
│  │  │ 4. Combine: ${serial}:${uuid}                  │  │  │
│  │  │ 5. SHA-256 hash → 64-char hex                  │  │  │
│  │  │ 6. Cache result                                 │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ├─ Uses: kernel.request(CAP_PROC, ...)
                            ├─ Logs: auditChain.append(...)
                            └─ Returns: 64-char hex string
```

### Execution Flow

```
┌──────────────────────────────────────────────────────────────┐
│ 1. Platform Detection                                        │
│    if (process.platform === 'darwin')                        │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ 2. Primary Extraction (ioreg)                                │
│    ioreg -l | grep IOPlatformSerialNumber                    │
│    ioreg -rd1 -c IOPlatformExpertDevice | grep IOPlatformUUID│
└──────────────────────────────────────────────────────────────┘
                            ↓
                    ┌───────┴────────┐
                    │   Success?     │
                    └───────┬────────┘
                   Yes ↓    ↓ No
                       ↓    ↓
                       ↓    └──────────────────────────────────┐
                       ↓                                        ↓
┌──────────────────────↓──────────────┐  ┌────────────────────────────────┐
│ 3a. Parse Values     ↓              │  │ 3b. Fallback (system_profiler) │
│     platformSerial = extract(...)   │  │     system_profiler            │
│     hardwareUUID = extract(...)     │  │     SPHardwareDataType         │
└─────────────────────┬───────────────┘  └────────────┬───────────────────┘
                      ↓                               ↓
                      └───────────┬───────────────────┘
                                  ↓
┌──────────────────────────────────────────────────────────────┐
│ 4. Composite Identifier Generation                           │
│    if (platformSerial && hardwareUUID)                       │
│        composite = `${platformSerial}:${hardwareUUID}`       │
│    else if (hardwareUUID)                                    │
│        composite = hardwareUUID  // DEGRADED MODE            │
│    else                                                      │
│        throw Error("Hardware binding failed")  // HARD FAIL  │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ 5. SHA-256 Fingerprint                                       │
│    hardwareFingerprint = crypto.createHash('sha256')         │
│                               .update(composite)             │
│                               .digest('hex')                 │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ 6. Cache and Return                                          │
│    Cache in module-level variable                            │
│    Log to audit chain                                        │
│    Return 64-character hex string                            │
└──────────────────────────────────────────────────────────────┘
```

### Degraded Mode Logic

```
┌─────────────────────────────────────────────────────────┐
│ Identifier Availability Matrix                          │
├──────────────┬──────────────┬─────────────┬────────────┤
│ Serial       │ UUID         │ Mode        │ Action     │
├──────────────┼──────────────┼─────────────┼────────────┤
│ Available    │ Available    │ SUCCESS     │ Use both   │
│ Empty/Missing│ Available    │ DEGRADED    │ Use UUID   │
│ Available    │ Empty/Missing│ DEGRADED    │ Use serial │
│ Empty/Missing│ Empty/Missing│ HARD FAIL   │ Throw error│
└──────────────┴──────────────┴─────────────┴────────────┘
```

## Components and Interfaces

### Modified Files

#### `src/core/identityKernel.js`

**Modifications:**
- Add `getMacOSHardwareId()` function (~60 lines)
- Modify `getHardwareId()` to detect macOS platform and route to new function
- Add parsing utilities for ioreg and system_profiler output

**New Functions:**

```javascript
/**
 * Extract macOS hardware identifiers via IOKit and system_profiler.
 * @returns {Promise<string>} 64-character hex SHA-256 hash
 */
async function getMacOSHardwareId() {
  // Implementation details in Data Models section
}

/**
 * Parse IOPlatformSerialNumber from ioreg output.
 * @param {string} output - Raw ioreg output
 * @returns {string} Trimmed serial number or empty string
 */
function parseIOPlatformSerialNumber(output) {
  // Match: "IOPlatformSerialNumber" = "C02ABC123DEF"
  const match = output.match(/"IOPlatformSerialNumber"\s*=\s*"([^"]+)"/);
  return match ? match[1].trim() : '';
}

/**
 * Parse IOPlatformUUID from ioreg output.
 * @param {string} output - Raw ioreg output
 * @returns {string} Trimmed UUID or empty string
 */
function parseIOPlatformUUID(output) {
  // Match: "IOPlatformUUID" = "12345678-1234-1234-1234-123456789ABC"
  const match = output.match(/"IOPlatformUUID"\s*=\s*"([^"]+)"/);
  return match ? match[1].trim() : '';
}

/**
 * Parse Serial Number from system_profiler output.
 * @param {string} output - Raw system_profiler output
 * @returns {string} Trimmed serial number or empty string
 */
function parseSystemProfilerSerial(output) {
  // Match: "Serial Number (system): C02ABC123DEF"
  const match = output.match(/Serial Number[^:]*:\s*([^\s\n]+)/i);
  return match ? match[1].trim() : '';
}
```

#### `src/kernel/execution.js`

**Modifications:**
- Add macOS command execution support for `ioreg` and `system_profiler`
- Extend `execute()` method to handle macOS-specific commands
- Add timeout enforcement (3000ms)

**Changes:**

```javascript
// In execute() method, extend the allowlist:
async execute(payload) {
  const { command, args = [] } = payload;
  
  // Windows hardware binding
  if (command === 'wmic') {
    const output = execSync(`${command} ${args.join(' ')}`, { timeout: 3000 }).toString();
    return output;
  }
  
  // macOS hardware binding (NEW)
  if (command === 'ioreg' && process.platform === 'darwin') {
    const output = execSync(`${command} ${args.join(' ')}`, { timeout: 3000 }).toString();
    return output;
  }
  
  if (command === 'system_profiler' && process.platform === 'darwin') {
    const output = execSync(`${command} ${args.join(' ')}`, { timeout: 3000 }).toString();
    return output;
  }
  
  throw new Error('OMEGA_BLOCK: Raw execute denied.');
}
```

### Integration Points

#### Downstream Consumers (No Changes Required)

1. **License Binding** (`billing/licenseEngine.js`)
   - Consumes: `identityKernel.getFingerprint()`
   - Contract: 64-character hex string
   - No changes required

2. **Vault Encryption** (`src/core/secretVault.js`)
   - Consumes: `identityKernel.getHardwareEncryptionKey()`
   - Contract: 32-byte Buffer derived from hardware fingerprint
   - No changes required

3. **Peer Trust** (`src/core/identityKernel.js`)
   - Consumes: Internal `hardwareFingerprint` variable
   - Contract: 64-character hex string
   - No changes required

#### Audit Chain Integration

All hardware enumeration events will be logged to the audit chain with the following payload structure:

```javascript
{
  event: 'hardware-binding',
  platform: 'darwin',
  status: 'success' | 'degraded' | 'failed',
  method: 'ioreg' | 'system_profiler' | 'fallback',
  identifiers: {
    serial: boolean,  // true if serial was extracted
    uuid: boolean     // true if UUID was extracted
  },
  message: string
}
```

## Data Models

### Hardware Identifier Extraction

#### IOPlatformSerialNumber (Primary)

**Command:**
```bash
ioreg -l | grep IOPlatformSerialNumber
```

**Expected Output:**
```
    "IOPlatformSerialNumber" = "C02ABC123DEF"
```

**Parsing Logic:**
```javascript
function parseIOPlatformSerialNumber(output) {
  const match = output.match(/"IOPlatformSerialNumber"\s*=\s*"([^"]+)"/);
  return match ? match[1].trim() : '';
}
```

**Edge Cases:**
- Empty string: `"IOPlatformSerialNumber" = ""`
- Missing key: No match found
- Multiple matches: Take first match

#### IOPlatformUUID (Primary)

**Command:**
```bash
ioreg -rd1 -c IOPlatformExpertDevice | grep IOPlatformUUID
```

**Expected Output:**
```
    "IOPlatformUUID" = "12345678-1234-1234-1234-123456789ABC"
```

**Parsing Logic:**
```javascript
function parseIOPlatformUUID(output) {
  const match = output.match(/"IOPlatformUUID"\s*=\s*"([^"]+)"/);
  return match ? match[1].trim() : '';
}
```

**Edge Cases:**
- Empty string: `"IOPlatformUUID" = ""`
- Missing key: No match found
- Multiple matches: Take first match

#### system_profiler Serial Number (Fallback)

**Command:**
```bash
system_profiler SPHardwareDataType | grep "Serial Number"
```

**Expected Output:**
```
      Serial Number (system): C02ABC123DEF
```

**Parsing Logic:**
```javascript
function parseSystemProfilerSerial(output) {
  const match = output.match(/Serial Number[^:]*:\s*([^\s\n]+)/i);
  return match ? match[1].trim() : '';
}
```

**Edge Cases:**
- Multiple "Serial Number" lines: Take first match
- Missing line: No match found
- Empty value: Return empty string

### Composite Identifier Format

The composite identifier combines extracted hardware values according to availability:

**Success Mode (Both Available):**
```
${platformSerial}:${hardwareUUID}
Example: "C02ABC123DEF:12345678-1234-1234-1234-123456789ABC"
```

**Degraded Mode (UUID Only):**
```
${hardwareUUID}
Example: "12345678-1234-1234-1234-123456789ABC"
```

**Degraded Mode (Serial Only):**
```
${platformSerial}
Example: "C02ABC123DEF"
```

**Hard Failure (Neither Available):**
```
throw new Error("Hardware binding failed on macOS: No identifiers available")
```

### SHA-256 Fingerprint

**Input:** Composite identifier string
**Output:** 64-character hexadecimal string

```javascript
const hardwareFingerprint = crypto
  .createHash('sha256')
  .update(compositeIdentifier)
  .digest('hex');
```

**Properties:**
- Length: Exactly 64 characters
- Character set: `[a-f0-9]`
- Deterministic: Same input always produces same output
- Collision-resistant: Different hardware produces different fingerprints

### Implementation Pseudocode

```javascript
async function getMacOSHardwareId() {
  let platformSerial = '';
  let hardwareUUID = '';
  
  // Step 1: Try ioreg for IOPlatformSerialNumber
  try {
    const serialOutput = await kernel.request(CAP_PROC, 'execute', {
      command: 'ioreg',
      args: ['-l']
    });
    platformSerial = parseIOPlatformSerialNumber(serialOutput);
  } catch (err) {
    // Log but continue to fallback
    auditChain.append({
      event: 'hardware-binding',
      platform: 'darwin',
      status: 'warning',
      method: 'ioreg-serial',
      message: `ioreg serial extraction failed: ${err.message}`
    });
  }
  
  // Step 2: Try ioreg for IOPlatformUUID
  try {
    const uuidOutput = await kernel.request(CAP_PROC, 'execute', {
      command: 'ioreg',
      args: ['-rd1', '-c', 'IOPlatformExpertDevice']
    });
    hardwareUUID = parseIOPlatformUUID(uuidOutput);
  } catch (err) {
    // Log but continue to fallback
    auditChain.append({
      event: 'hardware-binding',
      platform: 'darwin',
      status: 'warning',
      method: 'ioreg-uuid',
      message: `ioreg UUID extraction failed: ${err.message}`
    });
  }
  
  // Step 3: Fallback to system_profiler if serial is missing
  if (!platformSerial) {
    try {
      const profilerOutput = await kernel.request(CAP_PROC, 'execute', {
        command: 'system_profiler',
        args: ['SPHardwareDataType']
      });
      platformSerial = parseSystemProfilerSerial(profilerOutput);
      
      if (platformSerial) {
        auditChain.append({
          event: 'hardware-binding',
          platform: 'darwin',
          status: 'info',
          method: 'system_profiler-fallback',
          message: 'Used system_profiler fallback for serial number'
        });
      }
    } catch (err) {
      // Log but continue to degraded mode check
      auditChain.append({
        event: 'hardware-binding',
        platform: 'darwin',
        status: 'warning',
        method: 'system_profiler-fallback',
        message: `system_profiler fallback failed: ${err.message}`
      });
    }
  }
  
  // Step 4: Determine mode and construct composite identifier
  let compositeIdentifier = '';
  let mode = 'success';
  
  if (platformSerial && hardwareUUID) {
    compositeIdentifier = `${platformSerial}:${hardwareUUID}`;
    mode = 'success';
  } else if (hardwareUUID) {
    compositeIdentifier = hardwareUUID;
    mode = 'degraded';
    auditChain.append({
      event: 'hardware-binding',
      platform: 'darwin',
      status: 'degraded',
      method: 'uuid-only',
      message: 'Hardware binding degraded: serial unavailable, using UUID only'
    });
  } else if (platformSerial) {
    compositeIdentifier = platformSerial;
    mode = 'degraded';
    auditChain.append({
      event: 'hardware-binding',
      platform: 'darwin',
      status: 'degraded',
      method: 'serial-only',
      message: 'Hardware binding degraded: UUID unavailable, using serial only'
    });
  } else {
    // Hard failure
    auditChain.append({
      event: 'hardware-binding',
      platform: 'darwin',
      status: 'failed',
      method: 'none',
      message: 'Hardware binding failed: no identifiers available'
    });
    throw new Error('Hardware binding failed on macOS: No identifiers available');
  }
  
  // Step 5: Generate SHA-256 fingerprint
  const fingerprint = crypto
    .createHash('sha256')
    .update(compositeIdentifier)
    .digest('hex');
  
  // Step 6: Log success and cache
  auditChain.append({
    event: 'hardware-binding',
    platform: 'darwin',
    status: mode,
    method: 'complete',
    identifiers: {
      serial: !!platformSerial,
      uuid: !!hardwareUUID
    },
    message: `Hardware fingerprint generated (${mode} mode)`
  });
  
  hardwareFingerprint = fingerprint;
  return fingerprint;
}
```


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property Reflection

After analyzing all 75 acceptance criteria, I identified the following redundancies:

**Redundant Properties Eliminated:**
- 1.4 (redundant with 1.3) - Platform isolation
- 6.5 (redundant with 6.2) - Output length constraint
- 7.3 (redundant with 6.3) - Cache behavior
- 7.4 (redundant with 7.2) - Extraction determinism
- 8.2 (redundant with 5.2) - Degraded mode behavior
- 9.1 (redundant with 5.3) - Hard failure condition
- 9.4, 9.5 (redundant with 5.4) - No insecure fallbacks
- 10.4 (redundant with 2.4, 3.4) - Error handling
- 11.1 (redundant with 6.2) - Output format
- 11.3 (redundant with 8.4) - Degraded mode output format
- 11.4 (redundant with 11.2) - Cross-platform format consistency
- 12.2 (redundant with 8.3) - Degraded mode audit logging
- 12.3 (redundant with 9.2) - Hard failure audit logging
- 15.3 (redundant with 15.2) - Uniqueness property

**Combined Properties:**
- 2.5, 3.5, 4.5 combined into single normalization property
- 2.4, 3.4 combined into single error handling property
- 10.1, 10.2 combined into single execution broker property

### Property 1: Platform Detection Routes to Correct Backend

For any invocation of `getHardwareId()`, the system shall detect `process.platform` and route to the platform-specific implementation (Windows for 'win32', macOS for 'darwin', Linux for 'linux'), and shall not execute macOS-specific code on non-macOS platforms.

**Validates: Requirements 1.1, 1.2, 1.3**

### Property 2: Parsing Extracts Valid Identifiers

For any valid ioreg or system_profiler output containing hardware identifiers, the parsing functions shall correctly extract the IOPlatformSerialNumber, IOPlatformUUID, or Serial Number values.

**Validates: Requirements 2.2, 3.2, 4.2**

### Property 3: Extracted Values Are Used in Composite Identifier

For any non-empty extracted hardware identifier (serial or UUID), that identifier shall appear in the composite identifier used for fingerprint generation.

**Validates: Requirements 2.3, 3.3, 4.3**

### Property 4: Extraction Failures Trigger Fallback Chain

For any hardware enumeration command that fails or returns empty output, the system shall not throw an error but shall proceed to the next method in the fallback chain (ioreg → system_profiler → degraded mode).

**Validates: Requirements 2.4, 3.4**

### Property 5: Identifier Normalization Removes Whitespace

For any extracted hardware identifier containing leading or trailing whitespace, the system shall trim the whitespace before using the identifier in the composite identifier.

**Validates: Requirements 2.5, 3.5, 4.5**

### Property 6: Composite Identifier Format Follows Availability Rules

For any combination of available identifiers:
- When both serial and UUID are available: composite = `${serial}:${uuid}`
- When only UUID is available: composite = `${uuid}` (degraded mode)
- When only serial is available: composite = `${serial}` (degraded mode)
- When neither is available: throw error (hard failure)

**Validates: Requirements 5.1, 5.2, 5.3**

### Property 7: No Insecure Fallback Methods

For any hardware enumeration failure scenario, the system shall not fall back to random UUID generation or hostname hashing as identifier sources.

**Validates: Requirements 5.4, 9.4, 9.5**

### Property 8: Composite Identifier Immutability

For any generated composite identifier, the system shall not modify its format or content after initial generation.

**Validates: Requirements 5.5**

### Property 9: SHA-256 Hash Produces 64-Character Hex String

For any composite identifier, computing its SHA-256 hash shall produce exactly 64 hexadecimal characters matching the pattern `[a-f0-9]{64}`.

**Validates: Requirements 6.2, 11.1**

### Property 10: Hash Computation Is Deterministic

For any composite identifier, computing its SHA-256 hash multiple times shall always produce identical output (idempotence).

**Validates: Requirements 6.4**

### Property 11: Fingerprint Caching Prevents Re-extraction

For any hardware fingerprint that has been computed and cached, subsequent calls to `getHardwareId()` shall return the cached value without re-executing hardware enumeration commands.

**Validates: Requirements 6.3, 7.3**

### Property 12: Extraction Determinism Ensures Stability

For any macOS system in a stable hardware state, multiple extractions of hardware identifiers without reboot shall produce identical fingerprints.

**Validates: Requirements 7.2, 7.4**

### Property 13: Degraded Mode Triggers on Missing Serial

For any hardware enumeration where IOPlatformSerialNumber is empty or unavailable but IOPlatformUUID is available, the system shall trigger degraded mode and use UUID-only as the composite identifier.

**Validates: Requirements 8.1, 8.2**

### Property 14: Degraded Mode Logs Warning

For any degraded mode activation, the system shall log a warning event to the audit chain with platform='darwin' and status='degraded'.

**Validates: Requirements 8.3, 12.2**

### Property 15: Degraded Mode Produces Valid Fingerprint

For any degraded mode operation, the system shall still produce a valid 64-character hexadecimal SHA-256 fingerprint conforming to the identity contract.

**Validates: Requirements 8.4, 11.3**

### Property 16: Missing Serial Alone Does Not Cause Hard Failure

For any hardware enumeration where IOPlatformSerialNumber is missing but IOPlatformUUID is available, the system shall not throw an error but shall operate in degraded mode.

**Validates: Requirements 8.5**

### Property 17: Complete Identifier Loss Triggers Hard Failure

For any hardware enumeration where both IOPlatformSerialNumber and IOPlatformUUID are unavailable, the system shall throw an error with message "Hardware binding failed on macOS: No identifiers available".

**Validates: Requirements 9.1, 9.3, 5.3**

### Property 18: Hard Failure Logs Error

For any hard failure condition, the system shall log an error event to the audit chain with platform='darwin' and status='failed'.

**Validates: Requirements 9.2, 12.3**

### Property 19: Commands Execute Through Execution Broker

For any hardware enumeration command (ioreg or system_profiler), the system shall execute it via `kernel.request(CAP_PROC, 'execute', ...)` and shall not use `child_process.exec()` or `child_process.spawn()` directly.

**Validates: Requirements 10.1, 10.2, 10.3**

### Property 20: Command Timeout Enforcement

For any hardware enumeration command, the execution broker shall enforce a 3000ms timeout to prevent indefinite hangs.

**Validates: Requirements 10.5**

### Property 21: Cross-Platform Format Consistency

For all platforms (Windows, macOS, Linux), the hardware fingerprint output format shall be identical: 64-character hexadecimal SHA-256 hash, regardless of platform or degraded mode status.

**Validates: Requirements 11.2, 11.4**

### Property 22: Success Audit Logging

For any successful hardware enumeration, the system shall log a success event to the audit chain with platform='darwin', status='success', and identifiers indicating which values were extracted.

**Validates: Requirements 12.1**

### Property 23: Fallback Audit Logging

For any fallback to system_profiler, the system shall log an info event to the audit chain with platform='darwin' and method='system_profiler-fallback'.

**Validates: Requirements 12.4**

### Property 24: Platform Identifier in Audit Logs

For all audit log entries related to macOS hardware binding, the payload shall include platform='darwin'.

**Validates: Requirements 12.5**

### Property 25: Software Changes Do Not Affect Fingerprint

For any macOS system where only software changes occur (OS updates, application installation), the hardware fingerprint shall remain unchanged.

**Validates: Requirements 14.5**

### Property 26: Hash Collision Resistance

For any two different macOS devices with different hardware configurations, the system shall produce different hardware fingerprints (no hash collisions).

**Validates: Requirements 15.2, 15.3**

## Error Handling

### Error Categories

#### 1. Command Execution Failures

**Scenario:** `ioreg` or `system_profiler` command fails to execute

**Handling:**
- Catch exception from `kernel.request()`
- Log warning to audit chain
- Proceed to next method in fallback chain
- Do not propagate error to caller unless all methods fail

**Example:**
```javascript
try {
  const output = await kernel.request(CAP_PROC, 'execute', {
    command: 'ioreg',
    args: ['-l']
  });
  platformSerial = parseIOPlatformSerialNumber(output);
} catch (err) {
  auditChain.append({
    event: 'hardware-binding',
    platform: 'darwin',
    status: 'warning',
    method: 'ioreg-serial',
    message: `ioreg serial extraction failed: ${err.message}`
  });
  // Continue to fallback
}
```

#### 2. Empty or Invalid Output

**Scenario:** Command executes successfully but returns empty or unparseable output

**Handling:**
- Parse output with regex
- If no match found, treat as empty string
- Proceed to fallback chain if primary method returns empty
- Log info event for fallback usage

**Example:**
```javascript
const match = output.match(/"IOPlatformSerialNumber"\s*=\s*"([^"]+)"/);
const platformSerial = match ? match[1].trim() : '';

if (!platformSerial) {
  // Proceed to fallback
}
```

#### 3. Degraded Mode (Partial Identifier Loss)

**Scenario:** One identifier is available but the other is missing

**Handling:**
- Use available identifier as composite identifier
- Log warning to audit chain with status='degraded'
- Continue normal operation
- Return valid 64-character hex fingerprint

**Example:**
```javascript
if (hardwareUUID && !platformSerial) {
  compositeIdentifier = hardwareUUID;
  auditChain.append({
    event: 'hardware-binding',
    platform: 'darwin',
    status: 'degraded',
    method: 'uuid-only',
    message: 'Hardware binding degraded: serial unavailable, using UUID only'
  });
}
```

#### 4. Hard Failure (Complete Identifier Loss)

**Scenario:** Both IOPlatformSerialNumber and IOPlatformUUID are unavailable

**Handling:**
- Log error to audit chain with status='failed'
- Throw descriptive error
- Do not fall back to insecure methods (random UUID, hostname)
- Propagate error to caller (will prevent app initialization)

**Example:**
```javascript
if (!platformSerial && !hardwareUUID) {
  auditChain.append({
    event: 'hardware-binding',
    platform: 'darwin',
    status: 'failed',
    method: 'none',
    message: 'Hardware binding failed: no identifiers available'
  });
  throw new Error('Hardware binding failed on macOS: No identifiers available');
}
```

#### 5. Timeout Errors

**Scenario:** Hardware enumeration command exceeds 3000ms timeout

**Handling:**
- Execution broker enforces timeout via `execSync({ timeout: 3000 })`
- Timeout throws error, caught by command execution error handler
- Proceed to fallback chain
- Log warning to audit chain

**Example:**
```javascript
// In execution.js
const output = execSync(`${command} ${args.join(' ')}`, { timeout: 3000 }).toString();
// If timeout exceeded, throws error caught by caller
```

### Error Recovery Flow

```
Command Execution
       ↓
   Success? ──No──→ Log Warning → Try Fallback
       ↓ Yes
   Parse Output
       ↓
   Valid? ──No──→ Treat as Empty → Try Fallback
       ↓ Yes
   Use Identifier
       ↓
   Both Available? ──No──→ One Available? ──Yes──→ Degraded Mode
       ↓ Yes                      ↓ No
   Success Mode              Hard Failure
```

### Error Messages

All error messages follow a consistent format:

**Warning (Fallback):**
```
ioreg serial extraction failed: <error details>
system_profiler fallback failed: <error details>
```

**Warning (Degraded Mode):**
```
Hardware binding degraded: serial unavailable, using UUID only
Hardware binding degraded: UUID unavailable, using serial only
```

**Error (Hard Failure):**
```
Hardware binding failed on macOS: No identifiers available
```

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests to ensure comprehensive coverage:

**Unit Tests:** Verify specific examples, edge cases, and error conditions
**Property Tests:** Verify universal properties across all inputs

Together, these approaches provide comprehensive coverage where unit tests catch concrete bugs and property tests verify general correctness.

### Property-Based Testing Configuration

**Library:** `fast-check` (JavaScript property-based testing library)

**Configuration:**
- Minimum 100 iterations per property test
- Each test tagged with comment referencing design property
- Tag format: `// Feature: macos-hardware-binding, Property {number}: {property_text}`

**Example Property Test:**
```javascript
// Feature: macos-hardware-binding, Property 9: SHA-256 Hash Produces 64-Character Hex String
fc.assert(
  fc.property(fc.string(), (compositeId) => {
    const hash = crypto.createHash('sha256').update(compositeId).digest('hex');
    return hash.length === 64 && /^[a-f0-9]{64}$/.test(hash);
  }),
  { numRuns: 100 }
);
```

### Unit Test Coverage

#### Parsing Tests

**File:** `tear/identity-kernel-macos-parsing.test.js`

**Tests:**
1. Parse valid IOPlatformSerialNumber from ioreg output
2. Parse valid IOPlatformUUID from ioreg output
3. Parse valid Serial Number from system_profiler output
4. Handle empty string in ioreg output
5. Handle missing key in ioreg output
6. Handle malformed output (no quotes, wrong format)
7. Trim whitespace from extracted values

#### Composite Identifier Tests

**File:** `tear/identity-kernel-macos-composite.test.js`

**Tests:**
1. Combine serial and UUID with colon separator (success mode)
2. Use UUID only when serial is empty (degraded mode)
3. Use serial only when UUID is empty (degraded mode)
4. Throw error when both are empty (hard failure)
5. Do not modify composite identifier after generation

#### Fingerprint Generation Tests

**File:** `tear/identity-kernel-macos-fingerprint.test.js`

**Tests:**
1. Generate 64-character hex string from composite identifier
2. Same input produces same hash (determinism)
3. Different inputs produce different hashes
4. Cache fingerprint after first generation
5. Return cached value on subsequent calls

#### Error Handling Tests

**File:** `tear/identity-kernel-macos-errors.test.js`

**Tests:**
1. Handle ioreg command failure (proceed to fallback)
2. Handle system_profiler command failure (proceed to degraded mode)
3. Handle timeout (3000ms exceeded)
4. Trigger degraded mode when serial is missing
5. Trigger hard failure when both identifiers are missing
6. Do not fall back to random UUID
7. Do not fall back to hostname hashing

#### Audit Chain Tests

**File:** `tear/identity-kernel-macos-audit.test.js`

**Tests:**
1. Log success event on successful extraction
2. Log warning event on degraded mode
3. Log error event on hard failure
4. Log info event on fallback to system_profiler
5. Include platform='darwin' in all log entries
6. Include correct status in log entries

#### Integration Tests

**File:** `tear/identity-kernel-macos-integration.test.js`

**Tests:**
1. End-to-end extraction on macOS system (requires macOS CI)
2. Verify fingerprint stability across multiple calls
3. Verify downstream consumers work with macOS fingerprint
4. Verify execution broker integration (no direct child_process usage)

### Property-Based Test Coverage

#### Property Test Suite

**File:** `tear/identity-kernel-macos-properties.test.js`

**Tests (100+ iterations each):**

1. **Property 1:** Platform detection routes correctly
   - Generate random platform strings
   - Verify correct backend is called

2. **Property 2:** Parsing extracts valid identifiers
   - Generate random valid ioreg/system_profiler outputs
   - Verify parsing extracts correct values

3. **Property 5:** Identifier normalization removes whitespace
   - Generate random identifiers with whitespace
   - Verify trimmed values are used

4. **Property 9:** SHA-256 produces 64-char hex
   - Generate random composite identifiers
   - Verify hash format

5. **Property 10:** Hash computation is deterministic
   - Generate random composite identifiers
   - Verify hashing twice produces same result

6. **Property 12:** Extraction determinism
   - Generate random system states
   - Verify multiple extractions produce same result

7. **Property 21:** Cross-platform format consistency
   - Generate fingerprints from all platforms
   - Verify all are 64-char hex

8. **Property 26:** Hash collision resistance
   - Generate many different composite identifiers
   - Verify no hash collisions

### Acceptance Test Plan (2-Mac Testing)

#### Test Devices

**Device 3:** Modern Mac (MacBook Pro M1, macOS 13+)
**Device 4:** Legacy Mac (MacBook 2015, macOS 12)

#### Test Scenarios

**Scenario 1: Fingerprint Extraction**
- Input: Fresh macOS system
- Expected: 64-character hex string
- Verification: Matches pattern `[a-f0-9]{64}`

**Scenario 2: Fingerprint Stability (10 Reboots)**
- Input: Same Mac, reboot 10 times
- Expected: Identical fingerprint across all reboots
- Verification: 100% stability (0 changes)

**Scenario 3: Cross-Device Uniqueness**
- Input: Device 3 and Device 4
- Expected: Different fingerprints
- Verification: No collision, first 8 chars differ

**Scenario 4: Fallback Chain (Simulated)**
- Input: Mock ioreg failure
- Expected: system_profiler fallback succeeds
- Verification: Fingerprint still generated

**Scenario 5: Degraded Mode (Simulated)**
- Input: Mock empty IOPlatformSerialNumber
- Expected: UUID-only fingerprint, warning logged
- Verification: Valid fingerprint, audit log contains warning

**Scenario 6: Hard Failure (Simulated)**
- Input: Mock both identifiers empty
- Expected: Error thrown, error logged
- Verification: Error message matches spec, audit log contains error

**Scenario 7: Downstream Compatibility**
- Input: macOS fingerprint
- Expected: License binding, vault encryption, peer trust all work
- Verification: No errors, same behavior as Windows

### Test Execution Order

1. **Unit tests** (local development)
2. **Property tests** (local development)
3. **Integration tests** (macOS CI environment)
4. **Acceptance tests** (Device 3 and Device 4)
5. **Cross-platform tests** (Windows + macOS + Linux CI)

### Coverage Requirements

- **identityKernel.js:** >90% line coverage
- **Hardware binding code paths:** 100% coverage
- **Error handling paths:** 100% coverage
- **Audit logging paths:** 100% coverage

### Test Automation

All tests must be automated and run in CI:

```bash
# Run all tests
npm test

# Run macOS-specific tests
npm test -- --grep "macos"

# Run property tests
npm test -- --grep "property"

# Check coverage
npm run coverage:check
```

## Proof Artifacts Required for Packet 1 Closeout

### Artifact 1: Implementation Proof

**File:** `docs/proofs/batch1-macos-backend-proof.md`

**Required Content:**
1. Code snippets showing macOS implementation in `identityKernel.js`
2. Code snippets showing execution broker modifications
3. Parsing function implementations
4. Error handling implementations
5. Audit chain integration

### Artifact 2: Test Results (Device 3)

**Required Content:**
1. Device specifications (model, macOS version, hardware)
2. Extracted IOPlatformSerialNumber (first 4 chars only)
3. Extracted IOPlatformUUID (first 8 chars only)
4. Generated fingerprint (first 8 chars only)
5. Stability test results (10 reboots, 100% stable)
6. Fallback chain verification (simulated ioreg failure)
7. Degraded mode verification (simulated empty serial)

### Artifact 3: Test Results (Device 4)

**Required Content:**
1. Device specifications (model, macOS version, hardware)
2. Extracted IOPlatformSerialNumber (first 4 chars only)
3. Extracted IOPlatformUUID (first 8 chars only)
4. Generated fingerprint (first 8 chars only)
5. Stability test results (10 reboots, 100% stable)
6. Fallback chain verification (simulated ioreg failure)
7. Degraded mode verification (simulated empty serial)

### Artifact 4: Cross-Device Uniqueness Verification

**Required Content:**
1. Device 3 fingerprint (first 8 chars)
2. Device 4 fingerprint (first 8 chars)
3. Verification that fingerprints differ
4. Verification that no collision occurred

### Artifact 5: Downstream Compatibility Verification

**Required Content:**
1. License binding test results (macOS fingerprint works)
2. Vault encryption test results (macOS fingerprint works)
3. Peer trust test results (macOS fingerprint works)
4. Verification that identity contract is preserved

### Artifact 6: Audit Chain Verification

**Required Content:**
1. Sample audit log entries for success case
2. Sample audit log entries for degraded mode
3. Sample audit log entries for hard failure
4. Sample audit log entries for fallback usage
5. Verification that all entries include platform='darwin'

### Artifact 7: Test Coverage Report

**Required Content:**
1. Line coverage for `identityKernel.js` (must be >90%)
2. Branch coverage for hardware binding code paths (must be 100%)
3. Coverage report in JSON format
4. Coverage report in HTML format (for review)

### Signoff Criteria

Work Packet 1 is complete when:

- [ ] All code changes committed to `src/core/identityKernel.js`
- [ ] All code changes committed to `src/kernel/execution.js`
- [ ] All unit tests pass (100% pass rate)
- [ ] All property tests pass (100% pass rate)
- [ ] All integration tests pass on macOS CI
- [ ] Device 3 acceptance tests pass (100% stability)
- [ ] Device 4 acceptance tests pass (100% stability)
- [ ] Cross-device uniqueness verified (no collisions)
- [ ] Downstream compatibility verified (license, vault, peer trust)
- [ ] Test coverage meets requirements (>90% identityKernel, 100% hardware binding)
- [ ] All 7 proof artifacts generated and committed
- [ ] Code review completed and approved
- [ ] No regressions in Windows backend (existing tests still pass)

---

## Summary

This design extends the NeuralShell identity kernel with macOS hardware binding support while preserving the existing 64-character hex SHA-256 identity contract. The implementation uses IOKit registry queries (via `ioreg`) as the primary method, with `system_profiler` as a fallback, and supports graceful degradation when identifiers are partially unavailable. All hardware enumeration commands execute through the OMEGA execution broker, and all events are logged to the audit chain for auditability.

The design maintains strict compatibility with downstream consumers (licensing, vault encryption, peer trust) and requires no changes to those modules. The fallback chain architecture ensures the system can operate in various macOS configurations, from modern Macs with full IOKit access to restricted environments where alternative methods are required.

Comprehensive testing includes unit tests for parsing and error handling, property-based tests for universal correctness properties, and acceptance tests on two physical Mac devices to verify stability and uniqueness. The proof artifacts document the implementation, test results, and downstream compatibility verification required for Work Packet 1 closeout.
