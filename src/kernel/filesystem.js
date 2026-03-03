const fs = require('fs');
const path = require('path');
const { app } = require('electron');

/**
 * NeuralShell FileSystem Broker — Capability-Based File Access
 */

class FileSystemBroker {
  constructor() {
    this.readOnlyRoot = app.getAppPath();
    this.writeRoot = app.getPath('userData');
  }

  /**
   * Check if the path is within the allowed roots.
   * @param {string} targetPath 
   * @param {string} root 
   */
  _isWithin(targetPath, root) {
    const resolved = path.resolve(targetPath);
    return resolved.startsWith(root);
  }

  async readFile(payload) {
    const { filePath, options = 'utf8' } = payload;
    const isAllowed = this._isWithin(filePath, this.readOnlyRoot) || this._isWithin(filePath, this.writeRoot);
    if (!isAllowed) throw new Error('File access outside permitted roots denied.');
    return fs.readFileSync(filePath, options);
  }

  async writeFile(payload) {
    const { filePath, data, options = 'utf8' } = payload;
    const isAllowed = this._isWithin(filePath, this.writeRoot);
    if (!isAllowed) throw new Error('Write access outside writeRoot denied.');
    fs.writeFileSync(filePath, data, options);
    return true;
  }

  async exists(payload) {
    const { filePath } = payload;
    return fs.existsSync(filePath);
  }

  async getPath(payload) {
    const { name } = payload;
    return app.getPath(name);
  }

  async getAppPath() {
    return app.getAppPath();
  }
}

module.exports = new FileSystemBroker();
