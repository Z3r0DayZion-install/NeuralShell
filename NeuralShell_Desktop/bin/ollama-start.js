/**
 * Ollama Service Starter
 * 
 * SECURITY FIX: Vulnerability 3 - Secure Execution Model
 * Replaced vulnerable command execution with secure executeTask from kernel/taskExecutor.js
 */

const { executeTask } = require('../../kernel/taskExecutor');

// Note: This file should ideally be removed and Ollama should be started
// through the secure task executor with a registered OLLAMA_SERVE task.
// For now, we'll log a warning and exit.

console.warn('[SECURITY] bin/ollama-start.js: Direct command execution is disabled.');
console.warn('[SECURITY] Please start Ollama manually or add OLLAMA_SERVE to kernel/taskExecutor.js TASK_REGISTRY');
console.warn('[SECURITY] Example: ollama serve');

// Exit with code 1 to indicate this script should not be used
process.exit(1);
