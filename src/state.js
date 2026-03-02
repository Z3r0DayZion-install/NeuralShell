// Re-export the existing stateManager module for compatibility with
// tooling that expects a top-level state.js. If you need to modify
// state persistence logic, edit src/core/stateManager.js instead.
module.exports = require('./core/stateManager');
