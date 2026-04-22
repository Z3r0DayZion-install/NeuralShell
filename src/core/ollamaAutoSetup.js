/**
 * Ollama Auto-Setup
 * 
 * Detects Ollama installation and helps user get running quickly.
 * Removes friction for first-time users.
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

class OllamaAutoSetup {
  constructor() {
    this.name = 'OllamaAutoSetup';
    this.status = 'unknown';
  }

  /**
   * Check if Ollama is installed and running
   */
  async detectOllama() {
    const checks = {
      installed: false,
      running: false,
      version: null,
      models: [],
      defaultModel: null,
      installPath: null,
      error: null
    };

    try {
      // Check if ollama command exists
      const platform = os.platform();
      let ollamaPath;
      
      if (platform === 'win32') {
        // Windows: Check common install locations
        const programFiles = process.env.PROGRAMFILES || 'C:\\Program Files';
        const localAppData = process.env.LOCALAPPDATA;
        
        const possiblePaths = [
          path.join(programFiles, 'Ollama', 'ollama.exe'),
          localAppData ? path.join(localAppData, 'Programs', 'Ollama', 'ollama.exe') : null,
          'ollama' // Try PATH
        ].filter(Boolean);
        
        for (const p of possiblePaths) {
          if (fs.existsSync(p)) {
            ollamaPath = p;
            checks.installPath = p;
            break;
          }
        }
      } else {
        // macOS/Linux
        ollamaPath = 'ollama';
      }

      if (!ollamaPath) {
        checks.error = 'Ollama not found in common locations';
        return checks;
      }

      checks.installed = true;

      // Check if running
      const version = await this.execPromise(`${ollamaPath} --version`);
      checks.version = version.trim();
      checks.running = true;

      // List models
      const modelsOutput = await this.execPromise(`${ollamaPath} list`);
      checks.models = this.parseModels(modelsOutput);
      
      if (checks.models.length > 0) {
        checks.defaultModel = checks.models[0].name;
      }

    } catch (err) {
      checks.error = err.message;
      
      // Ollama installed but not running
      if (err.message.includes('connection') || err.message.includes('refused')) {
        checks.installed = true;
        checks.running = false;
        checks.error = 'Ollama installed but not running. Start Ollama to continue.';
      }
    }

    this.status = checks;
    return checks;
  }

  /**
   * Get setup instructions for the user
   */
  getSetupInstructions(checks) {
    if (checks.installed && checks.running && checks.models.length > 0) {
      return {
        status: 'ready',
        title: '✅ Ollama Ready',
        message: `Found ${checks.models.length} model(s). Ready to run locally.`,
        action: 'start_chat',
        models: checks.models
      };
    }

    if (checks.installed && checks.running && checks.models.length === 0) {
      return {
        status: 'needs_model',
        title: '📦 Download a Model',
        message: 'Ollama is running but no models found. Download your first model:',
        action: 'download_model',
        suggestedModels: [
          { name: 'llama3.2:3b', size: '2GB', desc: 'Fast, good for most tasks' },
          { name: 'mistral:7b', size: '4.8GB', desc: 'High quality responses' },
          { name: 'phi3:mini', size: '2GB', desc: 'Microsoft model, efficient' }
        ],
        command: 'ollama pull llama3.2:3b'
      };
    }

    if (checks.installed && !checks.running) {
      return {
        status: 'not_running',
        title: '▶️ Start Ollama',
        message: 'Ollama is installed but not running.',
        action: 'start_ollama',
        steps: [
          'Open Start Menu',
          'Search for "Ollama"',
          'Click Ollama to start',
          'Return to NeuralShell'
        ]
      };
    }

    // Not installed
    return {
      status: 'not_installed',
      title: '⬇️ Install Ollama',
      message: 'Local AI requires Ollama. It\'s free and takes 2 minutes.',
      action: 'install_ollama',
      downloadUrl: 'https://ollama.com/download',
      steps: [
        'Download from ollama.com',
        'Run the installer',
        'Return to NeuralShell'
      ]
    };
  }

  /**
   * Quick setup for demo mode
   */
  async quickSetupForDemo() {
    const checks = await this.detectOllama();
    
    if (checks.status === 'ready') {
      return {
        canDemo: true,
        message: 'Ollama detected. Full offline demo available.'
      };
    }

    // Return demo mode with mock responses
    return {
      canDemo: false,
      useMockMode: true,
      message: 'Ollama not detected. Running in demo mode with simulated responses.',
      setupInstructions: this.getSetupInstructions(checks)
    };
  }

  parseModels(output) {
    const lines = output.split('\n').slice(1); // Skip header
    const models = [];
    
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 3) {
        models.push({
          name: parts[0],
          size: parts[1] + ' ' + parts[2],
          modified: parts.slice(3).join(' ')
        });
      }
    }
    
    return models;
  }

  execPromise(command) {
    return new Promise((resolve, reject) => {
      exec(command, { timeout: 5000 }, (err, stdout, stderr) => {
        if (err) reject(err);
        else resolve(stdout || stderr);
      });
    });
  }
}

module.exports = { OllamaAutoSetup };
