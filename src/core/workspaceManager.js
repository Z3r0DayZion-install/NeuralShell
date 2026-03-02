const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const stateManager = require('./stateManager');

// Directory where workspace state files are stored
const WS_DIR = path.join(app.getPath('userData'), 'workspaces');

/**
 * WorkspaceManager maintains separate chat histories and settings per
 * project workspace. Each workspace corresponds to a JSON file under
 * the `workspaces` directory. The current workspace name is stored
 * within the global state managed by stateManager. When switching
 * workspaces the caller must update the UI accordingly.
 */
class WorkspaceManager {
  constructor() {
    if (!fs.existsSync(WS_DIR)) {
      fs.mkdirSync(WS_DIR, { recursive: true });
    }
  }

  /**
   * List available workspaces. Returns an array of workspace names
   * (without `.json` extension).
   */
  list() {
    return fs.readdirSync(WS_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace(/\.json$/, ''));
  }

  /**
   * Create a new workspace with the given name. Initializes with the
   * default state. If the workspace already exists this is a no-op.
   *
   * @param {string} name
   */
  create(name) {
    const file = path.join(WS_DIR, `${name}.json`);
    if (fs.existsSync(file)) return;
    const defaultState = {
      model: stateManager.get('model') || 'llama3',
      theme: stateManager.get('theme') || 'dark',
      chat: [],
      tokens: 0
    };
    fs.writeFileSync(file, JSON.stringify(defaultState, null, 2), 'utf8');
  }

  /**
   * Delete a workspace. If the deleted workspace is the current one,
   * stateManager.workspace is cleared.
   *
   * @param {string} name
   */
  delete(name) {
    const file = path.join(WS_DIR, `${name}.json`);
    try {
      fs.unlinkSync(file);
    } catch {
      // ignore
    }
    const current = stateManager.get('workspace');
    if (current === name) {
      stateManager.set('workspace', null);
    }
  }

  /**
   * Rename an existing workspace.
   *
   * @param {string} oldName
   * @param {string} newName
   */
  rename(oldName, newName) {
    const oldFile = path.join(WS_DIR, `${oldName}.json`);
    const newFile = path.join(WS_DIR, `${newName}.json`);
    try {
      fs.renameSync(oldFile, newFile);
    } catch {
      // ignore
    }
    const current = stateManager.get('workspace');
    if (current === oldName) {
      stateManager.set('workspace', newName);
    }
  }

  /**
   * Load the state for a workspace. Returns the parsed JSON or null
   * if the file cannot be read.
   *
   * @param {string} name
   */
  load(name) {
    const file = path.join(WS_DIR, `${name}.json`);
    try {
      const raw = fs.readFileSync(file, 'utf8');
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  /**
   * Save the given state to the workspace file.
   *
   * @param {string} name
   * @param {object} state
   */
  save(name, state) {
    const file = path.join(WS_DIR, `${name}.json`);
    try {
      fs.writeFileSync(file, JSON.stringify(state, null, 2), 'utf8');
    } catch {
      // ignore
    }
  }

  /**
   * Set the current workspace name in the global state.
   *
   * @param {string} name
   */
  setCurrent(name) {
    stateManager.set('workspace', name);
  }

  /**
   * Retrieve the current workspace name.
   *
   * @returns {string|null}
   */
  getCurrent() {
    return stateManager.get('workspace');
  }
}

module.exports = new WorkspaceManager();