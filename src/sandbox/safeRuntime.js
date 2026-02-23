import vm from 'vm';
import { Console } from 'console';
import { Writable } from 'stream';

/**
 * SafeRuntime
 * 
 * A sandboxed execution environment for the CoderAgent.
 * Allows the AI to run generated JavaScript code and capture the output.
 * 
 * SECURITY WARNING: 'vm' is not perfectly secure against malicious actors.
 * In a real production env, use 'isolated-vm' or Docker containers.
 */
export class SafeRuntime {
  constructor(timeout = 5000) {
    this.timeout = timeout;
  }

  async execute(code) {
    const outputBuffer = [];
    
    // Custom stream to capture stdout/stderr
    const captureStream = new Writable({
      write(chunk, encoding, callback) {
        outputBuffer.push(chunk.toString());
        callback();
      }
    });

    const sandboxConsole = new Console(captureStream, captureStream);

    // Context available to the code
    const sandbox = {
      console: sandboxConsole,
      setTimeout,
      clearTimeout,
      // Add safe math/utility functions here
      Math,
      Date,
      JSON
    };

    const context = vm.createContext(sandbox);

    try {
      const script = new vm.Script(code);
      
      const result = script.runInContext(context, {
        timeout: this.timeout,
        displayErrors: true
      });

      return {
        success: true,
        output: outputBuffer.join(''),
        result: String(result)
      };

    } catch (err) {
      return {
        success: false,
        output: outputBuffer.join(''),
        error: err.message
      };
    }
  }
}
