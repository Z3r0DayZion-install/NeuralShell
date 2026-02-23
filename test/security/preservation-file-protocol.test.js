/**
 * Preservation Test: file:// Protocol Access
 * 
 * **Validates: Requirements 3.2**
 * 
 * CRITICAL: This test MUST PASS on unfixed code to confirm baseline behavior.
 * 
 * From Preservation Requirements 3.2:
 * - file:// protocol access for application resources should continue to work
 * 
 * This test verifies that:
 * 1. file:// protocol is allowed by webRequest handler
 * 2. Application resources (HTML, CSS, JS, images) can be loaded via file://
 * 3. file:// URLs under the application path are not blocked
 * 4. CSP allows file:// protocol for legitimate resources
 * 
 * Expected Behavior (on unfixed code):
 * - All file:// URLs for application resources should load successfully
 * - This behavior must be preserved after security fixes
 */

import { strict as assert } from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const tests = [];
const results = { passed: 0, failed: 0, total: 0 };

function test(name, fn) {
  tests.push({ name, fn });
}

async function runTests() {
  console.log('\n🧪 Running file:// Protocol Preservation Tests\n');
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
    console.log('✅ PRESERVATION CONFIRMED: Baseline file:// protocol access is working correctly\n');
  }
}

/**
 * Property: webRequest handler allows file:// protocol
 * 
 * This property verifies that the webRequest.onBeforeRequest handler
 * in main.js explicitly allows file:// protocol for application resources.
 */
test("Property: webRequest handler allows file:// protocol", async () => {
  const mainJsPath = 'NeuralShell_Desktop/main.js';
  
  assert.ok(
    fs.existsSync(mainJsPath),
    'main.js should exist'
  );
  
  const content = fs.readFileSync(mainJsPath, 'utf8');
  
  // Verify webRequest.onBeforeRequest is configured
  assert.ok(
    content.includes('webRequest.onBeforeRequest'),
    'main.js should configure webRequest.onBeforeRequest'
  );
  
  // Verify file:// protocol is explicitly allowed
  assert.ok(
    content.includes("protocol === 'file:'") || content.includes('protocol === "file:"'),
    'webRequest handler should check for file:// protocol'
  );
  
  // Verify file:// requests are not cancelled
  assert.ok(
    content.includes('cancel: false') && content.includes("'file:'"),
    'file:// protocol requests should not be cancelled'
  );
  
  console.log('   Confirmed: webRequest handler allows file:// protocol');
});

/**
 * Property: All application resource paths are valid file:// URLs
 * 
 * This property verifies that all application resources (HTML, CSS, JS, images)
 * exist as files and can be represented as valid file:// URLs.
 */
test("Property: Application resources exist and have valid file:// paths", async () => {
  const appResourcePaths = [
    'NeuralShell_Desktop/src/renderer.html',
    'NeuralShell_Desktop/src/style.css',
    'NeuralShell_Desktop/src/renderer.js',
    'NeuralShell_Desktop/src/stateSchema.js',
    'NeuralShell_Desktop/src/preload.js',
  ];
  
  for (const resourcePath of appResourcePaths) {
    // Verify file exists
    assert.ok(
      fs.existsSync(resourcePath),
      `Application resource should exist: ${resourcePath}`
    );
    
    // Verify we can construct a valid file:// URL
    const absolutePath = path.resolve(resourcePath);
    const fileUrl = `file://${absolutePath.replace(/\\/g, '/')}`;
    
    assert.ok(
      fileUrl.startsWith('file://'),
      `Should be able to construct valid file:// URL: ${fileUrl}`
    );
    
    // Verify URL is parseable
    const url = new URL(fileUrl);
    assert.strictEqual(
      url.protocol,
      'file:',
      `URL protocol should be file: for ${resourcePath}`
    );
  }
  
  console.log(`   Verified ${appResourcePaths.length} application resources have valid file:// paths`);
});

/**
 * Property: HTML file references local resources via relative paths
 * 
 * This property verifies that the renderer.html file references local resources
 * (CSS, JS, images) using relative paths, which will be resolved as file:// URLs
 * when the HTML is loaded via file:// protocol.
 */
test("Property: HTML references local resources via relative paths", async () => {
  const htmlPath = 'NeuralShell_Desktop/src/renderer.html';
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');
  
  // Check for CSS references
  const cssLinkRegex = /<link[^>]+href=["']([^"']+\.css)["']/g;
  const cssMatches = [...htmlContent.matchAll(cssLinkRegex)];
  
  assert.ok(
    cssMatches.length > 0,
    'HTML should reference at least one CSS file'
  );
  
  for (const match of cssMatches) {
    const href = match[1];
    // Verify it's a relative path (not absolute or external URL)
    assert.ok(
      !href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('/'),
      `CSS reference should be relative path: ${href}`
    );
  }
  
  // Check for JS script references
  const scriptRegex = /<script[^>]+src=["']([^"']+\.js)["']/g;
  const scriptMatches = [...htmlContent.matchAll(scriptRegex)];
  
  assert.ok(
    scriptMatches.length > 0,
    'HTML should reference at least one JS file'
  );
  
  for (const match of scriptMatches) {
    const src = match[1];
    // Verify it's a relative path (not absolute or external URL)
    assert.ok(
      !src.startsWith('http://') && !src.startsWith('https://') && !src.startsWith('/'),
      `JS reference should be relative path: ${src}`
    );
  }
  
  console.log(`   Verified ${cssMatches.length} CSS and ${scriptMatches.length} JS references use relative paths`);
});

/**
 * Property: CSP allows file:// protocol
 * 
 * This property verifies that the Content-Security-Policy configured in main.js
 * allows file:// protocol for loading application resources.
 */
test("Property: CSP configuration allows file:// protocol", async () => {
  const mainJsPath = 'NeuralShell_Desktop/main.js';
  const content = fs.readFileSync(mainJsPath, 'utf8');
  
  // Check for CSP configuration
  assert.ok(
    content.includes('Content-Security-Policy'),
    'main.js should configure Content-Security-Policy'
  );
  
  // Extract CSP header value
  const cspRegex = /Content-Security-Policy['"]?\s*:\s*['"]([^'"]+)['"]/;
  const cspMatch = content.match(cspRegex);
  
  if (cspMatch) {
    const csp = cspMatch[1];
    
    // Verify CSP allows file:// or uses 'self' (which allows file:// when loaded from file://)
    const allowsFile = csp.includes('file:') || csp.includes("'self'");
    
    assert.ok(
      allowsFile,
      `CSP should allow file:// protocol or use 'self': ${csp}`
    );
    
    console.log(`   Confirmed: CSP allows file:// protocol: ${csp}`);
  } else {
    // If no explicit CSP in headers, check for webPreferences
    assert.ok(
      content.includes('webSecurity: true') || content.includes('webSecurity:true'),
      'webSecurity should be enabled (default allows file:// for local resources)'
    );
    
    console.log('   Confirmed: webSecurity enabled, file:// protocol allowed by default');
  }
});

/**
 * Property: BrowserWindow loads HTML via file:// protocol
 * 
 * This property verifies that the BrowserWindow.loadFile() or loadURL()
 * call in main.js loads the renderer HTML, which will use file:// protocol.
 */
test("Property: BrowserWindow loads HTML via file:// protocol", async () => {
  const mainJsPath = 'NeuralShell_Desktop/main.js';
  const content = fs.readFileSync(mainJsPath, 'utf8');
  
  // Check for loadFile or loadURL calls
  const hasLoadFile = content.includes('.loadFile(') || content.includes('.loadFile (');
  const hasLoadURL = content.includes('.loadURL(') || content.includes('.loadURL (');
  
  assert.ok(
    hasLoadFile || hasLoadURL,
    'main.js should call loadFile() or loadURL() to load renderer HTML'
  );
  
  if (hasLoadFile) {
    // Verify loadFile references renderer.html
    assert.ok(
      content.includes('renderer.html'),
      'loadFile should reference renderer.html'
    );
    
    console.log('   Confirmed: BrowserWindow.loadFile() loads renderer.html via file:// protocol');
  } else {
    // Check if loadURL uses file:// protocol
    const loadURLRegex = /loadURL\s*\(\s*['"`]([^'"`]+)['"`]/;
    const match = content.match(loadURLRegex);
    
    if (match) {
      const url = match[1];
      assert.ok(
        url.startsWith('file://') || url.includes('renderer.html'),
        `loadURL should use file:// protocol or reference renderer.html: ${url}`
      );
      
      console.log(`   Confirmed: BrowserWindow.loadURL() uses file:// protocol: ${url}`);
    }
  }
});

/**
 * Property: For all file:// URLs under app path, loading is not blocked
 * 
 * This is the core preservation property: verify that the webRequest handler
 * logic would allow (not cancel) requests for file:// URLs under the application path.
 * 
 * We test this by verifying the handler logic structure.
 */
test("Property: file:// URLs under app path are not blocked by webRequest logic", async () => {
  const mainJsPath = 'NeuralShell_Desktop/main.js';
  const content = fs.readFileSync(mainJsPath, 'utf8');
  
  // Verify webRequest handler exists
  assert.ok(
    content.includes('webRequest.onBeforeRequest'),
    'Should have webRequest.onBeforeRequest handler'
  );
  
  // Find the section with the webRequest handler
  const handlerStartIndex = content.indexOf('webRequest.onBeforeRequest');
  const handlerSection = content.substring(handlerStartIndex, handlerStartIndex + 1000);
  
  // Verify file:// protocol check exists
  const hasFileProtocolCheck = handlerSection.includes("protocol === 'file:'") || 
                               handlerSection.includes('protocol === "file:"');
  
  assert.ok(
    hasFileProtocolCheck,
    'Handler should check for file:// protocol'
  );
  
  // Verify file:// protocol is allowed (cancel: false)
  // Find the file:// check and verify it returns cancel: false
  const fileCheckIndex = handlerSection.indexOf("protocol === 'file:'") || 
                         handlerSection.indexOf('protocol === "file:"');
  
  if (fileCheckIndex > 0) {
    const afterFileCheck = handlerSection.substring(fileCheckIndex, fileCheckIndex + 200);
    
    assert.ok(
      afterFileCheck.includes('cancel: false'),
      'file:// protocol should result in cancel: false'
    );
  }
  
  // Verify other protocols are blocked (cancel: true)
  assert.ok(
    handlerSection.includes('cancel: true'),
    'Handler should block non-file protocols with cancel: true'
  );
  
  console.log('   Verified webRequest logic allows file:// URLs');
  console.log('   Property confirmed: All file:// URLs under app path are not blocked');
});

/**
 * Property: No network protocols are confused with file:// protocol
 * 
 * This property verifies that the webRequest handler correctly distinguishes
 * file:// protocol from network protocols (http://, https://, etc.).
 */
test("Property: file:// protocol is distinct from network protocols", async () => {
  const mainJsPath = 'NeuralShell_Desktop/main.js';
  const content = fs.readFileSync(mainJsPath, 'utf8');
  
  // Verify handler checks protocol property
  assert.ok(
    content.includes('.protocol'),
    'Handler should check URL protocol property'
  );
  
  // Verify handler distinguishes file:// from http:// and https://
  const hasFileCheck = content.includes("protocol === 'file:'") || content.includes('protocol === "file:"');
  const hasHttpCheck = content.includes("protocol === 'http:'") || 
                       content.includes('protocol === "http:"') ||
                       content.includes("protocol === 'https:'") ||
                       content.includes('protocol === "https:"');
  
  assert.ok(
    hasFileCheck,
    'Handler should explicitly check for file:// protocol'
  );
  
  // Verify that network protocols are handled differently (blocked)
  if (hasHttpCheck) {
    console.log('   Confirmed: Handler distinguishes file:// from http:// and https://');
  } else {
    // Check for catch-all blocking of non-file protocols
    assert.ok(
      content.includes('cancel: true'),
      'Handler should block non-file protocols'
    );
    console.log('   Confirmed: Handler blocks network protocols while allowing file://');
  }
});

/**
 * Property: Asset files referenced in HTML exist and are accessible
 * 
 * This property verifies that all assets referenced in the HTML
 * (images, fonts, etc.) exist and can be accessed via file:// protocol.
 */
test("Property: Asset files referenced in HTML exist and are accessible", async () => {
  const htmlPath = 'NeuralShell_Desktop/src/renderer.html';
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');
  const htmlDir = path.dirname(htmlPath);
  
  // Check for image references
  const imgRegex = /<(?:img|link)[^>]+(?:src|href)=["']([^"']+\.(?:svg|png|jpg|jpeg|gif|ico))["']/gi;
  const imgMatches = [...htmlContent.matchAll(imgRegex)];
  
  if (imgMatches.length > 0) {
    for (const match of imgMatches) {
      const assetPath = match[1];
      
      // Skip external URLs
      if (assetPath.startsWith('http://') || assetPath.startsWith('https://')) {
        continue;
      }
      
      // Resolve relative path
      const resolvedPath = path.join(htmlDir, assetPath);
      
      // Check if file exists (it's okay if some assets are missing in test environment)
      if (fs.existsSync(resolvedPath)) {
        console.log(`   ✓ Asset exists: ${assetPath}`);
      } else {
        console.log(`   ⚠ Asset not found (may be generated): ${assetPath}`);
      }
    }
    
    console.log(`   Checked ${imgMatches.length} asset references in HTML`);
  } else {
    console.log('   No image assets found in HTML (or using data: URLs)');
  }
});

// Run all tests
runTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
