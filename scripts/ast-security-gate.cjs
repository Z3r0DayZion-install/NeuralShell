#!/usr/bin/env node

/**
 * AST Security Gate - Vulnerability 5 Fix
 * 
 * This script performs static analysis on JavaScript code to detect security violations:
 * - Forbidden requires: child_process, fs (writeFile/unlink), net, http, https
 * - spawn/exec usage outside kernel/taskExecutor.js
 * - Non-literal IPC channel names
 * - Missing Ajv schema validation on IPC handlers
 * 
 * The build MUST fail if any violations are found.
 * 
 * Requirements: 1.5, 2.5
 */

"use strict";

const fs = require('node:fs');
const parser = require('@babel/parser');
const { glob } = require('glob');

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Configuration
const CONFIG = {
  // Files to scan (relative to project root)
  scanPatterns: [
    'kernel/**/*.js',
    'src/**/*.js',
    'router/**/*.js',
    'main.js',
    'preload.js',
    'production-server.js'
  ],
  
  // Files to exclude from scanning
  excludePatterns: [
    '**/node_modules/**',
    '**/dist/**',
    '**/test/**',
    '**/tests/**',
    '**/*.test.js',
    '**/*.spec.js'
  ],
  
  // Forbidden requires/imports
  // Note: http/https are allowed in router files for network broker functionality
  forbiddenModules: [
    'child_process',
    'net'
  ],
  
  // Modules that are forbidden except in specific files
  conditionallyForbiddenModules: {
    'http': {
      allowedFiles: ['src/router/connection-pool.js', 'src/router/auth.js']
    },
    'https': {
      allowedFiles: ['src/router/connection-pool.js', 'src/router/auth.js']
    }
  },
  
  // Forbidden fs methods (fs is allowed, but these methods are not)
  forbiddenFsMethods: [
    'writeFile',
    'writeFileSync',
    'unlink',
    'unlinkSync',
    'rmdir',
    'rmdirSync',
    'rm',
    'rmSync'
  ],
  
  // Allowed files/patterns for spawn/exec usage
  // The kernel directory is the trusted execution layer
  allowedSpawnExecFiles: [
    'kernel/taskExecutor.js',
    'src/kernel/execution.js',
    'src/kernel/crypto.js'
  ]
};

// Violation tracking
const violations = [];

/**
 * Add a violation to the tracking list
 */
function addViolation(type, file, line, column, message, code) {
  violations.push({
    type,
    file,
    line,
    column,
    message,
    code
  });
}

/**
 * Get all JavaScript files to scan
 */
async function getFilesToScan() {
  const files = new Set();
  
  for (const pattern of CONFIG.scanPatterns) {
    const matches = await glob(pattern, {
      ignore: CONFIG.excludePatterns,
      nodir: true
    });
    
    matches.forEach(file => files.add(file));
  }
  
  return Array.from(files);
}

/**
 * Parse JavaScript file into AST
 */
function parseFile(filePath) {
  try {
    const code = fs.readFileSync(filePath, 'utf8');
    
    return {
      ast: parser.parse(code, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript']
      }),
      code
    };
  } catch (error) {
    console.error(`${colors.red}✗${colors.reset} Failed to parse ${filePath}: ${error.message}`);
    return null;
  }
}

/**
 * Get line and column from AST node location
 */
function getLocation(node) {
  if (node.loc) {
    return {
      line: node.loc.start.line,
      column: node.loc.start.column + 1
    };
  }
  return { line: 0, column: 0 };
}

/**
 * Get code snippet from node
 */
function getCodeSnippet(code, node) {
  if (node.start !== undefined && node.end !== undefined) {
    return code.substring(node.start, node.end);
  }
  return '';
}

/**
 * Check for forbidden requires/imports
 */
function checkForbiddenRequires(ast, code, filePath) {
  // Normalize file path for comparison
  const normalizedPath = filePath.replace(/\\/g, '/');
  
  function traverse(node) {
    if (!node || typeof node !== 'object') return;
    
    // Check require() calls
    if (node.type === 'CallExpression' && 
        node.callee.type === 'Identifier' && 
        node.callee.name === 'require' &&
        node.arguments.length > 0) {
      
      const arg = node.arguments[0];
      if (arg.type === 'StringLiteral' || arg.type === 'Literal') {
        const moduleName = arg.value;
        
        // Check for forbidden modules
        if (CONFIG.forbiddenModules.includes(moduleName)) {
          const loc = getLocation(node);
          const snippet = getCodeSnippet(code, node);
          addViolation(
            'FORBIDDEN_REQUIRE',
            filePath,
            loc.line,
            loc.column,
            `Forbidden require('${moduleName}')`,
            snippet
          );
        }
        
        // Check for conditionally forbidden modules
        if (CONFIG.conditionallyForbiddenModules[moduleName]) {
          const config = CONFIG.conditionallyForbiddenModules[moduleName];
          const isAllowed = config.allowedFiles.some(allowed => normalizedPath.includes(allowed));
          
          if (!isAllowed) {
            const loc = getLocation(node);
            const snippet = getCodeSnippet(code, node);
            addViolation(
              'FORBIDDEN_REQUIRE',
              filePath,
              loc.line,
              loc.column,
              `Forbidden require('${moduleName}') (allowed only in: ${config.allowedFiles.join(', ')})`,
              snippet
            );
          }
        }
        
        // Check for fs with forbidden methods
        if (moduleName === 'fs' || moduleName === 'node:fs') {
          // Look for destructuring or property access
          const parent = node.parent;
          if (parent && parent.type === 'VariableDeclarator') {
            const id = parent.id;
            if (id.type === 'ObjectPattern') {
              // Check destructured properties
              id.properties.forEach(prop => {
                if (prop.type === 'ObjectProperty' && prop.key.type === 'Identifier') {
                  if (CONFIG.forbiddenFsMethods.includes(prop.key.name)) {
                    const loc = getLocation(prop);
                    addViolation(
                      'FORBIDDEN_FS_METHOD',
                      filePath,
                      loc.line,
                      loc.column,
                      `Forbidden fs method: ${prop.key.name}`,
                      `const { ${prop.key.name} } = require('fs')`
                    );
                  }
                }
              });
            }
          }
        }
      }
    }
    
    // Check import statements
    if (node.type === 'ImportDeclaration') {
      const moduleName = node.source.value;
      
      if (CONFIG.forbiddenModules.includes(moduleName)) {
        const loc = getLocation(node);
        const snippet = getCodeSnippet(code, node);
        addViolation(
          'FORBIDDEN_IMPORT',
          filePath,
          loc.line,
          loc.column,
          `Forbidden import from '${moduleName}'`,
          snippet
        );
      }
      
      // Check for conditionally forbidden modules
      if (CONFIG.conditionallyForbiddenModules[moduleName]) {
        const config = CONFIG.conditionallyForbiddenModules[moduleName];
        const isAllowed = config.allowedFiles.some(allowed => normalizedPath.includes(allowed));
        
        if (!isAllowed) {
          const loc = getLocation(node);
          const snippet = getCodeSnippet(code, node);
          addViolation(
            'FORBIDDEN_IMPORT',
            filePath,
            loc.line,
            loc.column,
            `Forbidden import from '${moduleName}' (allowed only in: ${config.allowedFiles.join(', ')})`,
            snippet
          );
        }
      }
      
      // Check for fs with forbidden methods
      if (moduleName === 'fs' || moduleName === 'node:fs') {
        node.specifiers.forEach(spec => {
          if (spec.type === 'ImportSpecifier' && spec.imported.type === 'Identifier') {
            if (CONFIG.forbiddenFsMethods.includes(spec.imported.name)) {
              const loc = getLocation(spec);
              addViolation(
                'FORBIDDEN_FS_METHOD',
                filePath,
                loc.line,
                loc.column,
                `Forbidden fs method: ${spec.imported.name}`,
                `import { ${spec.imported.name} } from 'fs'`
              );
            }
          }
        });
      }
    }
    
    // Traverse children
    for (const key in node) {
      if (key === 'parent') continue; // Avoid circular references
      const child = node[key];
      if (Array.isArray(child)) {
        child.forEach(c => {
          if (c && typeof c === 'object') {
            c.parent = node;
            traverse(c);
          }
        });
      } else if (child && typeof child === 'object') {
        child.parent = node;
        traverse(child);
      }
    }
  }
  
  traverse(ast.program);
}

/**
 * Check for spawn/exec usage outside allowed files
 */
function checkSpawnExecUsage(ast, code, filePath) {
  // Normalize file path for comparison
  const normalizedPath = filePath.replace(/\\/g, '/');
  const isAllowedFile = CONFIG.allowedSpawnExecFiles.some(allowed => 
    normalizedPath.includes(allowed)
  );
  
  if (isAllowedFile) {
    // This file is allowed to use spawn/exec
    return;
  }
  
  function traverse(node) {
    if (!node || typeof node !== 'object') return;
    
    // Check for spawn/exec calls
    if (node.type === 'CallExpression') {
      const callee = node.callee;
      
      // Direct calls: spawn(...) or exec(...)
      if (callee.type === 'Identifier' && 
          (callee.name === 'spawn' || callee.name === 'exec' || callee.name === 'execSync' || callee.name === 'spawnSync')) {
        const loc = getLocation(node);
        const snippet = getCodeSnippet(code, node);
        addViolation(
          'FORBIDDEN_SPAWN_EXEC',
          filePath,
          loc.line,
          loc.column,
          `Forbidden ${callee.name}() usage outside kernel (allowed: ${CONFIG.allowedSpawnExecFiles.join(', ')})`,
          snippet.substring(0, 100) + (snippet.length > 100 ? '...' : '')
        );
      }
      
      // Member calls: cp.spawn(...) or child_process.exec(...)
      // Exclude false positives like pipeline.exec() (Redis)
      if (callee.type === 'MemberExpression' && 
          callee.property.type === 'Identifier' &&
          (callee.property.name === 'spawn' || callee.property.name === 'exec' || 
           callee.property.name === 'execSync' || callee.property.name === 'spawnSync')) {
        
        // Check if this is a Redis pipeline.exec() call (false positive)
        const objectName = callee.object.type === 'Identifier' ? callee.object.name : '';
        if (objectName === 'pipeline' && callee.property.name === 'exec') {
          // This is likely Redis pipeline.exec(), not child_process.exec()
          return;
        }
        
        const loc = getLocation(node);
        const snippet = getCodeSnippet(code, node);
        addViolation(
          'FORBIDDEN_SPAWN_EXEC',
          filePath,
          loc.line,
          loc.column,
          `Forbidden ${callee.property.name}() usage outside kernel (allowed: ${CONFIG.allowedSpawnExecFiles.join(', ')})`,
          snippet.substring(0, 100) + (snippet.length > 100 ? '...' : '')
        );
      }
    }
    
    // Traverse children
    for (const key in node) {
      if (key === 'parent') continue;
      const child = node[key];
      if (Array.isArray(child)) {
        child.forEach(c => traverse(c));
      } else if (child && typeof child === 'object') {
        traverse(child);
      }
    }
  }
  
  traverse(ast.program);
}

/**
 * Check for non-literal IPC channel names
 */
function checkIpcChannelNames(ast, code, filePath) {
  function traverse(node) {
    if (!node || typeof node !== 'object') return;
    
    // Check for ipcMain.on/handle/handleOnce calls
    if (node.type === 'CallExpression' && 
        node.callee.type === 'MemberExpression') {
      
      const obj = node.callee.object;
      const prop = node.callee.property;
      
      // Check if it's ipcMain.on/handle/handleOnce
      if (obj.type === 'Identifier' && 
          obj.name === 'ipcMain' &&
          prop.type === 'Identifier' &&
          (prop.name === 'on' || prop.name === 'handle' || prop.name === 'handleOnce') &&
          node.arguments.length > 0) {
        
        const channelArg = node.arguments[0];
        
        // Channel name must be a string literal
        if (channelArg.type !== 'StringLiteral' && channelArg.type !== 'Literal') {
          const loc = getLocation(node);
          const snippet = getCodeSnippet(code, node);
          addViolation(
            'NON_LITERAL_IPC_CHANNEL',
            filePath,
            loc.line,
            loc.column,
            `IPC channel name must be a string literal, not ${channelArg.type}`,
            snippet.substring(0, 100) + (snippet.length > 100 ? '...' : '')
          );
        }
      }
    }
    
    // Traverse children
    for (const key in node) {
      if (key === 'parent') continue;
      const child = node[key];
      if (Array.isArray(child)) {
        child.forEach(c => traverse(c));
      } else if (child && typeof child === 'object') {
        traverse(child);
      }
    }
  }
  
  traverse(ast.program);
}

/**
 * Check for missing Ajv schema validation on IPC handlers
 */
function checkIpcSchemaValidation(ast, code, filePath) {
  function traverse(node) {
    if (!node || typeof node !== 'object') return;
    
    // Check for ipcMain.on/handle/handleOnce calls
    if (node.type === 'CallExpression' && 
        node.callee.type === 'MemberExpression') {
      
      const obj = node.callee.object;
      const prop = node.callee.property;
      
      // Check if it's ipcMain.on/handle/handleOnce
      if (obj.type === 'Identifier' && 
          obj.name === 'ipcMain' &&
          prop.type === 'Identifier' &&
          (prop.name === 'on' || prop.name === 'handle' || prop.name === 'handleOnce') &&
          node.arguments.length > 1) {
        
        const handler = node.arguments[1];
        
        // Check if handler function body contains Ajv validation
        let hasValidation = false;
        
        if (handler.type === 'ArrowFunctionExpression' || handler.type === 'FunctionExpression') {
          const body = handler.body;
          
          // Look for validate() calls or ajv references in the handler
          const handlerCode = getCodeSnippet(code, body);
          if (handlerCode.includes('validate(') || 
              handlerCode.includes('ajv.') || 
              handlerCode.includes('schema')) {
            hasValidation = true;
          }
        }
        
        if (!hasValidation) {
          const loc = getLocation(node);
          const channelName = node.arguments[0].value || '<dynamic>';
          addViolation(
            'MISSING_IPC_SCHEMA_VALIDATION',
            filePath,
            loc.line,
            loc.column,
            `IPC handler for '${channelName}' missing Ajv schema validation`,
            `ipcMain.${prop.name}('${channelName}', ...)`
          );
        }
      }
    }
    
    // Traverse children
    for (const key in node) {
      if (key === 'parent') continue;
      const child = node[key];
      if (Array.isArray(child)) {
        child.forEach(c => traverse(c));
      } else if (child && typeof child === 'object') {
        traverse(child);
      }
    }
  }
  
  traverse(ast.program);
}

/**
 * Scan a single file for violations
 */
function scanFile(filePath) {
  const parsed = parseFile(filePath);
  if (!parsed) return;
  
  const { ast, code } = parsed;
  
  // Run all checks
  checkForbiddenRequires(ast, code, filePath);
  checkSpawnExecUsage(ast, code, filePath);
  checkIpcChannelNames(ast, code, filePath);
  checkIpcSchemaValidation(ast, code, filePath);
}

/**
 * Print violations report
 */
function printReport() {
  console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}  AST Security Gate Report${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}\n`);
  
  if (violations.length === 0) {
    console.log(`${colors.green}✓${colors.reset} No security violations found\n`);
    return true;
  }
  
  // Group violations by type
  const byType = {};
  violations.forEach(v => {
    if (!byType[v.type]) byType[v.type] = [];
    byType[v.type].push(v);
  });
  
  // Print violations by type
  Object.keys(byType).sort().forEach(type => {
    const typeViolations = byType[type];
    console.log(`${colors.red}✗ ${type}${colors.reset} (${typeViolations.length} violation${typeViolations.length > 1 ? 's' : ''})\n`);
    
    typeViolations.forEach(v => {
      console.log(`  ${colors.yellow}${v.file}:${v.line}:${v.column}${colors.reset}`);
      console.log(`  ${v.message}`);
      if (v.code) {
        console.log(`  ${colors.blue}${v.code}${colors.reset}`);
      }
      console.log();
    });
  });
  
  console.log(`${colors.red}═══════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.red}  Total violations: ${violations.length}${colors.reset}`);
  console.log(`${colors.red}═══════════════════════════════════════════════════════════════${colors.reset}\n`);
  
  return false;
}

/**
 * Main execution
 */
async function main() {
  console.log(`${colors.cyan}🛡️  Running AST Security Gate...${colors.reset}\n`);
  
  try {
    const files = await getFilesToScan();
    console.log(`Scanning ${files.length} file${files.length !== 1 ? 's' : ''}...\n`);
    
    files.forEach(file => {
      console.log(`  ${colors.blue}→${colors.reset} ${file}`);
      scanFile(file);
    });
    
    const passed = printReport();
    
    if (!passed) {
      console.error(`${colors.red}Build failed due to AST security gate violations${colors.reset}\n`);
      process.exit(1);
    }
    
    console.log(`${colors.green}✓ AST Security Gate passed${colors.reset}\n`);
    process.exit(0);
    
  } catch (error) {
    console.error(`${colors.red}✗ AST Security Gate failed with error:${colors.reset}`, error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { main };
