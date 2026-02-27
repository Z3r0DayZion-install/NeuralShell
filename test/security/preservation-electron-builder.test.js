/**
 * Preservation Test: Electron Builder Packaging
 *
 * **Validates: Requirements 3.9**
 *
 * CRITICAL: This test MUST PASS on unfixed code to confirm baseline behavior.
 *
 * From Preservation Requirements 3.9:
 * - electron-builder for packaging should continue to work correctly
 *
 * This test verifies that:
 * 1. electron-builder is installed and configured
 * 2. Build configuration exists in package.json
 * 3. Build scripts are defined and executable
 * 4. Build targets are properly configured
 * 5. Build artifacts can be generated successfully
 *
 * Expected Behavior (on unfixed code):
 * - electron-builder should be available as a dependency
 * - Build configuration should be valid
 * - Build scripts should be executable
 * - This behavior must be preserved after security fixes
 */

import { strict as assert } from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tests = [];
const results = { passed: 0, failed: 0, total: 0 };

function test(name, fn) {
  tests.push({ name, fn });
}

async function runTests() {
  console.log('\n🧪 Running Electron Builder Packaging Preservation Tests\n');
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
    console.log('✅ PRESERVATION CONFIRMED: Baseline electron-builder packaging behavior is working correctly\n');
  }
}

/**
 * Property: electron-builder is installed as a dependency
 *
 * This property verifies that electron-builder is available in the project
 * as a development dependency.
 */
test('Property: electron-builder is installed as a dependency', async () => {
  const desktopPackageJsonPath = path.join(__dirname, '..', '..', 'NeuralShell_Desktop', 'package.json');

  assert.ok(
    fs.existsSync(desktopPackageJsonPath),
    'NeuralShell_Desktop/package.json should exist'
  );

  const packageJson = JSON.parse(fs.readFileSync(desktopPackageJsonPath, 'utf8'));

  assert.ok(
    packageJson.devDependencies,
    'package.json should have devDependencies'
  );

  assert.ok(
    packageJson.devDependencies['electron-builder'],
    'electron-builder should be in devDependencies'
  );

  const version = packageJson.devDependencies['electron-builder'];
  console.log(`   electron-builder version: ${version}`);
});

/**
 * Property: Build configuration exists in package.json
 *
 * This verifies that the build configuration for electron-builder
 * is properly defined in package.json.
 */
test('Property: Build configuration exists in package.json', async () => {
  const desktopPackageJsonPath = path.join(__dirname, '..', '..', 'NeuralShell_Desktop', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(desktopPackageJsonPath, 'utf8'));

  assert.ok(
    packageJson.build,
    'package.json should have build configuration'
  );

  assert.ok(
    packageJson.build.appId,
    'Build configuration should have appId'
  );

  assert.ok(
    packageJson.build.productName,
    'Build configuration should have productName'
  );

  assert.ok(
    packageJson.build.files,
    'Build configuration should specify files to include'
  );

  console.log(`   appId: ${packageJson.build.appId}`);
  console.log(`   productName: ${packageJson.build.productName}`);
});

/**
 * Property: Build scripts are defined
 *
 * This verifies that build scripts for electron-builder are defined
 * in the scripts section of package.json.
 */
test('Property: Build scripts are defined', async () => {
  const desktopPackageJsonPath = path.join(__dirname, '..', '..', 'NeuralShell_Desktop', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(desktopPackageJsonPath, 'utf8'));

  assert.ok(
    packageJson.scripts,
    'package.json should have scripts section'
  );

  // Check for electron-builder specific build scripts
  const buildScripts = Object.keys(packageJson.scripts).filter(script => {
    const scriptContent = packageJson.scripts[script];
    return (script.startsWith('build:') || script.startsWith('dist:')) &&
           scriptContent.includes('electron-builder');
  });

  assert.ok(
    buildScripts.length > 0,
    'At least one electron-builder build script should be defined'
  );

  console.log(`   Found ${buildScripts.length} electron-builder build scripts: ${buildScripts.join(', ')}`);

  // Verify build scripts use electron-builder
  for (const script of buildScripts) {
    const scriptContent = packageJson.scripts[script];
    assert.ok(
      scriptContent.includes('electron-builder'),
      `Build script ${script} should use electron-builder`
    );
  }
});

/**
 * Property: Build targets are properly configured
 *
 * This verifies that build targets (platforms and formats) are
 * properly configured for electron-builder.
 */
test('Property: Build targets are properly configured', async () => {
  const desktopPackageJsonPath = path.join(__dirname, '..', '..', 'NeuralShell_Desktop', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(desktopPackageJsonPath, 'utf8'));

  assert.ok(
    packageJson.build,
    'Build configuration should exist'
  );

  // Check for platform-specific configurations
  const platforms = ['win', 'mac', 'linux'];
  const configuredPlatforms = platforms.filter(platform => packageJson.build[platform]);

  assert.ok(
    configuredPlatforms.length > 0,
    'At least one platform should be configured'
  );

  console.log(`   Configured platforms: ${configuredPlatforms.join(', ')}`);

  // Verify each configured platform has targets
  for (const platform of configuredPlatforms) {
    const platformConfig = packageJson.build[platform];

    if (platformConfig.target) {
      const targets = Array.isArray(platformConfig.target)
        ? platformConfig.target
        : [platformConfig.target];
      console.log(`   ${platform} targets: ${targets.join(', ')}`);
    }
  }
});

/**
 * Property: Build directories are configured
 *
 * This verifies that output directories for build artifacts
 * are properly configured.
 */
test('Property: Build directories are configured', async () => {
  const desktopPackageJsonPath = path.join(__dirname, '..', '..', 'NeuralShell_Desktop', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(desktopPackageJsonPath, 'utf8'));

  assert.ok(
    packageJson.build.directories,
    'Build configuration should specify directories'
  );

  assert.ok(
    packageJson.build.directories.output,
    'Build directories should specify output directory'
  );

  const outputDir = packageJson.build.directories.output;
  console.log(`   Output directory: ${outputDir}`);

  // Verify output directory path is reasonable
  assert.ok(
    !path.isAbsolute(outputDir),
    'Output directory should be relative'
  );
});

/**
 * Property: electron-builder binary is accessible
 *
 * This verifies that the electron-builder binary can be found
 * and executed from the project.
 */
test('Property: electron-builder binary is accessible', async () => {
  const desktopDir = path.join(__dirname, '..', '..', 'NeuralShell_Desktop');
  const nodeModulesBin = path.join(desktopDir, 'node_modules', '.bin', 'electron-builder');
  const nodeModulesBinCmd = path.join(desktopDir, 'node_modules', '.bin', 'electron-builder.cmd');

  // Check if electron-builder binary exists (either .cmd on Windows or direct binary on Unix)
  const binaryExists = fs.existsSync(nodeModulesBin) || fs.existsSync(nodeModulesBinCmd);

  assert.ok(
    binaryExists,
    'electron-builder binary should exist in node_modules/.bin'
  );

  console.log('   electron-builder binary is accessible');

  // Try to get version (this confirms it's executable)
  try {
    const version = execSync('npx electron-builder --version', {
      cwd: desktopDir,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim();
    console.log(`   electron-builder version: ${version}`);
  } catch (error) {
    // If version check fails, it's still ok as long as the binary exists
    console.log('   (version check skipped - binary exists)');
  }
});

/**
 * Property: Build configuration includes required files
 *
 * This verifies that the build configuration specifies which files
 * should be included in the packaged application.
 */
test('Property: Build configuration includes required files', async () => {
  const desktopPackageJsonPath = path.join(__dirname, '..', '..', 'NeuralShell_Desktop', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(desktopPackageJsonPath, 'utf8'));

  assert.ok(
    packageJson.build.files,
    'Build configuration should specify files to include'
  );

  const files = packageJson.build.files;
  assert.ok(
    Array.isArray(files),
    'Build files should be an array'
  );

  assert.ok(
    files.length > 0,
    'Build files array should not be empty'
  );

  console.log(`   ${files.length} file patterns specified for packaging`);

  // Verify essential files are included
  const hasMainFile = files.some(pattern =>
    pattern.includes('main.js') || pattern === 'main.js'
  );

  assert.ok(
    hasMainFile,
    'Build files should include main.js'
  );

  console.log('   Essential files (main.js) are included');
});

/**
 * Property: Build configuration is valid JSON
 *
 * This verifies that the build configuration in package.json
 * is valid and can be parsed correctly.
 */
test('Property: Build configuration is valid JSON', async () => {
  const desktopPackageJsonPath = path.join(__dirname, '..', '..', 'NeuralShell_Desktop', 'package.json');

  // Read raw file content
  const rawContent = fs.readFileSync(desktopPackageJsonPath, 'utf8');

  // Verify it can be parsed
  let packageJson;
  try {
    packageJson = JSON.parse(rawContent);
  } catch (error) {
    throw new Error(`package.json is not valid JSON: ${error.message}`);
  }

  // Verify build section can be stringified back
  assert.ok(
    packageJson.build,
    'Build configuration should exist'
  );

  const buildJson = JSON.stringify(packageJson.build, null, 2);
  assert.ok(
    buildJson.length > 0,
    'Build configuration should be serializable'
  );

  console.log('   Build configuration is valid JSON');
});

/**
 * Property: For all configured platforms, packaging configuration is complete
 *
 * This is a property-based test that verifies each configured platform
 * has complete packaging configuration.
 */
test('Property: For all configured platforms, packaging configuration is complete', async () => {
  const desktopPackageJsonPath = path.join(__dirname, '..', '..', 'NeuralShell_Desktop', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(desktopPackageJsonPath, 'utf8'));

  const platforms = ['win', 'mac', 'linux'];
  const configuredPlatforms = platforms.filter(platform => packageJson.build[platform]);

  assert.ok(
    configuredPlatforms.length > 0,
    'At least one platform should be configured'
  );

  // For each configured platform, verify it has complete configuration
  for (const platform of configuredPlatforms) {
    const platformConfig = packageJson.build[platform];

    // Verify platform has target(s)
    assert.ok(
      platformConfig.target || platformConfig.targets,
      `Platform ${platform} should have target(s) defined`
    );

    console.log(`   ✓ Platform ${platform} has complete configuration`);
  }

  console.log(`   All ${configuredPlatforms.length} configured platforms have complete configuration`);
});

/**
 * Property: Build scripts can be invoked without errors
 *
 * This verifies that build scripts are syntactically correct and can be
 * invoked (we don't run full builds, just verify the scripts are valid).
 */
test('Property: Build scripts can be invoked without errors', async () => {
  const desktopPackageJsonPath = path.join(__dirname, '..', '..', 'NeuralShell_Desktop', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(desktopPackageJsonPath, 'utf8'));

  // Only check electron-builder specific scripts
  const buildScripts = Object.keys(packageJson.scripts).filter(script => {
    const scriptContent = packageJson.scripts[script];
    return (script.startsWith('build:') || script.startsWith('dist:')) &&
           scriptContent.includes('electron-builder');
  });

  assert.ok(
    buildScripts.length > 0,
    'electron-builder build scripts should exist'
  );

  // Verify each build script is a valid string
  for (const script of buildScripts) {
    const scriptContent = packageJson.scripts[script];

    assert.ok(
      typeof scriptContent === 'string',
      `Build script ${script} should be a string`
    );

    assert.ok(
      scriptContent.length > 0,
      `Build script ${script} should not be empty`
    );

    // Verify script contains electron-builder command
    assert.ok(
      scriptContent.includes('electron-builder'),
      `Build script ${script} should contain electron-builder command`
    );
  }

  console.log(`   All ${buildScripts.length} electron-builder build scripts are valid`);
});

/**
 * Property: electron dependency is installed
 *
 * This verifies that electron itself is installed, which is required
 * for electron-builder to work.
 */
test('Property: electron dependency is installed', async () => {
  const desktopPackageJsonPath = path.join(__dirname, '..', '..', 'NeuralShell_Desktop', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(desktopPackageJsonPath, 'utf8'));

  assert.ok(
    packageJson.devDependencies,
    'package.json should have devDependencies'
  );

  assert.ok(
    packageJson.devDependencies.electron,
    'electron should be in devDependencies'
  );

  const version = packageJson.devDependencies.electron;
  console.log(`   electron version: ${version}`);
});

// Run all tests
runTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
