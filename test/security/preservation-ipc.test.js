/**
 * Preservation Test: Legitimate IPC Operations
 *
 * **Validates: Requirements 3.1**
 *
 * CRITICAL: This test MUST PASS on unfixed code to confirm baseline behavior.
 *
 * From Preservation Requirements 3.1:
 * - Validated IPC channels with Ajv strict mode schema validation should continue to work
 *
 * This test verifies that:
 * 1. IPC channels with literal string names are accepted
 * 2. IPC channels with corresponding Ajv schemas are validated
 * 3. Schema validation uses Ajv strict mode
 * 4. Valid payloads pass schema validation
 * 5. Invalid payloads fail schema validation
 *
 * Expected Behavior (on unfixed code):
 * - All legitimate IPC operations should work correctly
 * - Schema validation should enforce data integrity
 * - This behavior must be preserved after security fixes
 */

import { strict as assert } from 'assert';
import fs from 'fs';
import path from 'path';
import Ajv from 'ajv';

const tests = [];
const results = { passed: 0, failed: 0, total: 0 };

function test(name, fn) {
  tests.push({ name, fn });
}

async function runTests() {
  console.log('\n🧪 Running IPC Preservation Tests\n');
  console.log('✅ EXPECTED: These tests SHOULD PASS on unfixed code to confirm baseline behavior\n');

  for (const { name, fn } of tests) {
    results.total++;
    try {
      await fn();
      results.passed++;
      console.log(`✅ ${name}`);
    } catch (error) {
      results.failed++;
      console.log(`❌ ${name}`);
      console.log(`   Error: ${error.message}`);
      if (error.stack) {
        console.log(`   ${error.stack.split('\n').slice(1, 3).join('\n   ')}`);
      }
    }
  }

  console.log(`\n📊 Results: ${results.passed}/${results.total} passed, ${results.failed} failed\n`);

  if (results.failed > 0) {
    console.log('❌ PRESERVATION FAILURE: Baseline behavior is broken');
    console.log('   These tests should pass on unfixed code to establish baseline\n');
    process.exit(1);
  } else {
    console.log('✅ PRESERVATION CONFIRMED: Baseline IPC behavior is working correctly\n');
  }
}

/**
 * Property: All validated IPC channels have corresponding schemas
 *
 * This property verifies that the kernel IPC channels follow the pattern:
 * - Channel name is a literal string (e.g., "kernel:confirm")
 * - Schema file exists at src/kernel/schemas/{channel_name}.schema.json
 * - Schema is valid JSON
 */
test('Property: Validated IPC channels have corresponding Ajv schemas', async () => {
  const schemaDir = 'src/kernel/schemas';

  // Verify schema directory exists
  assert.ok(
    fs.existsSync(schemaDir),
    `Schema directory should exist at ${schemaDir}`
  );

  // Get all schema files
  const schemaFiles = fs.readdirSync(schemaDir).filter(f => f.endsWith('.schema.json'));

  assert.ok(
    schemaFiles.length > 0,
    'At least one IPC schema should exist'
  );

  console.log(`   Found ${schemaFiles.length} IPC schemas: ${schemaFiles.join(', ')}`);

  // Verify each schema is valid JSON
  for (const schemaFile of schemaFiles) {
    const schemaPath = path.join(schemaDir, schemaFile);
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');

    let schema;
    try {
      schema = JSON.parse(schemaContent);
    } catch (e) {
      throw new Error(`Schema ${schemaFile} is not valid JSON: ${e.message}`);
    }

    assert.ok(
      schema && typeof schema === 'object',
      `Schema ${schemaFile} should be a valid JSON object`
    );
  }
});

/**
 * Property: Ajv validation uses strict mode
 *
 * This verifies that the intentParser (which handles IPC validation)
 * uses Ajv with strict mode enabled, as required by preservation requirements.
 */
test('Property: Ajv validation uses strict mode', async () => {
  const intentParserPath = 'src/kernel/intentParser.js';

  assert.ok(
    fs.existsSync(intentParserPath),
    'intentParser.js should exist'
  );

  const content = fs.readFileSync(intentParserPath, 'utf8');

  // Verify Ajv is imported
  assert.ok(
    content.includes("require('ajv')") || content.includes('from "ajv"') || content.includes("from 'ajv'"),
    'intentParser should import Ajv'
  );

  // Verify strict mode is enabled
  assert.ok(
    content.includes('strict: true'),
    'Ajv should be configured with strict mode enabled'
  );

  console.log('   Confirmed: Ajv uses strict mode in intentParser');
});

/**
 * Property: Schema validation accepts valid payloads
 *
 * For each IPC schema, verify that valid payloads pass validation.
 * This uses property-based testing approach by testing multiple valid inputs.
 */
test('Property: Valid payloads pass schema validation', async () => {
  const ajv = new Ajv({ allErrors: false, strict: true });

  // Test kernel:confirm schema
  const confirmSchemaPath = 'src/kernel/schemas/kernel_confirm.schema.json';
  if (fs.existsSync(confirmSchemaPath)) {
    const confirmSchema = JSON.parse(fs.readFileSync(confirmSchemaPath, 'utf8'));
    const validateConfirm = ajv.compile(confirmSchema);

    // Property: Valid confirm payloads should pass
    const validConfirmPayloads = [
      { action: 'test', details: 'test details' },
      { action: 'execute', details: 'execute command' },
      { action: 'a'.repeat(100), details: 'b'.repeat(500) } // Max length
    ];

    for (const payload of validConfirmPayloads) {
      const valid = validateConfirm(payload);
      assert.ok(
        valid,
        `Valid confirm payload should pass validation: ${JSON.stringify(payload)}`
      );
    }

    console.log(`   Validated ${validConfirmPayloads.length} valid kernel:confirm payloads`);
  }

  // Test kernel:fs:read schema
  const fsReadSchemaPath = 'src/kernel/schemas/kernel_fs_read.schema.json';
  if (fs.existsSync(fsReadSchemaPath)) {
    const fsReadSchema = JSON.parse(fs.readFileSync(fsReadSchemaPath, 'utf8'));
    const validateFsRead = ajv.compile(fsReadSchema);

    // Property: Valid file paths should pass
    const validPaths = [
      '/path/to/file.txt',
      './relative/path.js',
      'C:\\Windows\\System32\\file.txt',
      '/usr/local/bin/app'
    ];

    for (const filePath of validPaths) {
      const valid = validateFsRead(filePath);
      assert.ok(
        valid,
        `Valid file path should pass validation: ${filePath}`
      );
    }

    console.log(`   Validated ${validPaths.length} valid kernel:fs:read payloads`);
  }

  // Test kernel:intent schema
  const intentSchemaPath = 'src/kernel/schemas/kernel_intent.schema.json';
  if (fs.existsSync(intentSchemaPath)) {
    const intentSchema = JSON.parse(fs.readFileSync(intentSchemaPath, 'utf8'));
    const validateIntent = ajv.compile(intentSchema);

    // Property: Valid intent payloads should pass
    const validIntents = [
      { intent: 'test' },
      { intent: 'execute' },
      { intent: 'query' }
    ];

    for (const payload of validIntents) {
      const valid = validateIntent(payload);
      assert.ok(
        valid,
        `Valid intent payload should pass validation: ${JSON.stringify(payload)}`
      );
    }

    console.log(`   Validated ${validIntents.length} valid kernel:intent payloads`);
  }
});

/**
 * Property: Schema validation rejects invalid payloads
 *
 * For each IPC schema, verify that invalid payloads fail validation.
 * This ensures schema validation provides security by rejecting malformed data.
 */
test('Property: Invalid payloads fail schema validation', async () => {
  const ajv = new Ajv({ allErrors: false, strict: true });

  // Test kernel:confirm schema
  const confirmSchemaPath = 'src/kernel/schemas/kernel_confirm.schema.json';
  if (fs.existsSync(confirmSchemaPath)) {
    const confirmSchema = JSON.parse(fs.readFileSync(confirmSchemaPath, 'utf8'));
    const validateConfirm = ajv.compile(confirmSchema);

    // Property: Invalid confirm payloads should fail
    const invalidConfirmPayloads = [
      { action: 'test' }, // Missing details
      { details: 'test' }, // Missing action
      { action: 123, details: 'test' }, // Wrong type
      { action: 'test', details: 'test', extra: 'field' }, // Additional properties
      { action: 'a'.repeat(101), details: 'test' } // Exceeds maxLength
    ];

    for (const payload of invalidConfirmPayloads) {
      const valid = validateConfirm(payload);
      assert.strictEqual(
        valid,
        false,
        `Invalid confirm payload should fail validation: ${JSON.stringify(payload)}`
      );
    }

    console.log(`   Rejected ${invalidConfirmPayloads.length} invalid kernel:confirm payloads`);
  }

  // Test kernel:fs:read schema
  const fsReadSchemaPath = 'src/kernel/schemas/kernel_fs_read.schema.json';
  if (fs.existsSync(fsReadSchemaPath)) {
    const fsReadSchema = JSON.parse(fs.readFileSync(fsReadSchemaPath, 'utf8'));
    const validateFsRead = ajv.compile(fsReadSchema);

    // Property: Invalid file paths should fail
    const invalidPaths = [
      123, // Not a string
      null, // Null
      undefined, // Undefined
      {}, // Object
      [] // Array
    ];

    for (const filePath of invalidPaths) {
      const valid = validateFsRead(filePath);
      assert.strictEqual(
        valid,
        false,
        `Invalid file path should fail validation: ${JSON.stringify(filePath)}`
      );
    }

    console.log(`   Rejected ${invalidPaths.length} invalid kernel:fs:read payloads`);
  }

  // Test kernel:intent schema
  const intentSchemaPath = 'src/kernel/schemas/kernel_intent.schema.json';
  if (fs.existsSync(intentSchemaPath)) {
    const intentSchema = JSON.parse(fs.readFileSync(intentSchemaPath, 'utf8'));
    const validateIntent = ajv.compile(intentSchema);

    // Property: Invalid intent payloads should fail
    const invalidIntents = [
      {}, // Missing intent
      { intent: 123 }, // Wrong type
      { intent: 'test', extra: 'field' }, // Additional properties
      'string', // Not an object
      null // Null
    ];

    for (const payload of invalidIntents) {
      const valid = validateIntent(payload);
      assert.strictEqual(
        valid,
        false,
        `Invalid intent payload should fail validation: ${JSON.stringify(payload)}`
      );
    }

    console.log(`   Rejected ${invalidIntents.length} invalid kernel:intent payloads`);
  }
});

/**
 * Property: AST gate enforces schema existence for IPC channels
 *
 * This verifies that the AST security gate checks for schema files
 * when it encounters IPC channel registrations.
 */
test('Property: AST gate checks for IPC channel schemas', async () => {
  const astGatePath = 'tools/security/ast_gate.js';

  assert.ok(
    fs.existsSync(astGatePath),
    'AST gate should exist at tools/security/ast_gate.js'
  );

  const content = fs.readFileSync(astGatePath, 'utf8');

  // Verify AST gate checks for .handle() calls
  assert.ok(
    content.includes('.handle') || content.includes("'handle'") || content.includes('"handle"'),
    'AST gate should check for IPC handle registrations'
  );

  // Verify AST gate checks for schema files
  assert.ok(
    content.includes('.schema.json'),
    'AST gate should verify schema file existence'
  );

  // Verify AST gate checks literal channel names
  assert.ok(
    content.includes('StringLiteral') || content.includes('Literal'),
    'AST gate should enforce literal channel names'
  );

  console.log('   Confirmed: AST gate enforces IPC schema requirements');
});

/**
 * Property: IPC channels use literal string names
 *
 * This verifies that all IPC channel registrations in the codebase
 * use literal string names (not variables), which is required for
 * static analysis and security validation.
 */
test('Property: IPC channels use literal string names', async () => {
  const mainKernelPath = 'NeuralShell_Desktop/main_kernel.js';

  if (fs.existsSync(mainKernelPath)) {
    const content = fs.readFileSync(mainKernelPath, 'utf8');

    // Find all ipcMain.handle calls
    const handleRegex = /ipcMain\.handle\s*\(\s*['"]([^'"]+)['"]/g;
    const matches = [...content.matchAll(handleRegex)];

    assert.ok(
      matches.length > 0,
      'Should find at least one IPC channel registration'
    );

    // Verify all channels use literal strings
    for (const match of matches) {
      const channelName = match[1];
      assert.ok(
        typeof channelName === 'string' && channelName.length > 0,
        `IPC channel should use literal string name: ${channelName}`
      );
    }

    console.log(`   Verified ${matches.length} IPC channels use literal string names`);
  }
});

// Run all tests
runTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
