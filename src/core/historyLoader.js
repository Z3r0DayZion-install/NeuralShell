const fs = require('fs');
const path = require('path');

/**
 * HistoryLoader parses various chat log formats (.txt, .json) and
 * prepares them for injection into the current LLM session context.
 */
class HistoryLoader {
  /**
   * Parse a chat history file.
   * @param {string} filePath 
   * @returns {Object} {success, logs, error}
   */
  parse(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        return { success: false, error: 'File not found' };
      }

      const content = fs.readFileSync(filePath, 'utf8');
      const ext = path.extname(filePath).toLowerCase();

      if (ext === '.json') {
        const logs = JSON.parse(content);
        return { success: true, logs: Array.isArray(logs) ? logs : [logs] };
      } else if (ext === '.txt') {
        const logs = content.split('\n').filter(Boolean).map(line => ({
          role: 'unknown',
          content: line.trim()
        }));
        return { success: true, logs };
      }

      return { success: false, error: 'Unsupported file format' };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  /**
   * Prepare logs for injection (e.g., format as a single string).
   * @param {Array} logs 
   * @returns {string} Formatted log
   */
  formatForInjection(logs) {
    return logs.map(l => `[${l.role || 'user'}]: ${l.content}`).join('\n');
  }
}

module.exports = new HistoryLoader();
