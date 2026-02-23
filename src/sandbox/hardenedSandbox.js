import Docker from 'dockerode';
import { Writable } from 'stream';

/**
 * Hardened Sandbox
 * 
 * Executes code inside a transient, isolated Docker container.
 * This provides industry-standard security boundaries compared to 'vm'.
 */
export class HardenedSandbox {
  constructor(timeoutMs = 15000) {
    this.docker = new Docker(); // Connects to local socket
    this.image = 'node:20-alpine';
    this.defaultTimeout = timeoutMs;
  }

  async execute(code, customTimeout) {
    const outputBuffer = [];
    const timeoutMs = customTimeout || this.defaultTimeout;
    
    console.log(`[Sandbox] Spinning up transient container (Timeout: ${timeoutMs}ms)...`);
    
    try {
      // Encode code to base64 to avoid shell escaping issues and pass via ENV
      const encodedCode = Buffer.from(code).toString('base64');
      
      const container = await this.docker.createContainer({
        Image: this.image,
        // safe execution wrapper
        Cmd: ['node', '-e', 'try { eval(Buffer.from(process.env.CODE, "base64").toString("utf8")) } catch(e) { console.error(e) }'],
        Env: [`CODE=${encodedCode}`],
        HostConfig: {
          Memory: 128 * 1024 * 1024, // 128MB limit
          CpuQuota: 50000, // 50% of 1 CPU
          NetworkMode: 'none', // Isolated
          AutoRemove: true
        }
      });

      await container.start();
      
      const logs = await container.logs({
        follow: true,
        stdout: true,
        stderr: true
      });

      return new Promise((resolve) => {
        const killTimer = setTimeout(async () => {
          console.warn('[Sandbox] Execution timed out. Terminating container.');
          try {
            await container.stop({ t: 0 }).catch(() => {}); // Try to stop gracefully first
            await container.remove({ force: true }).catch(() => {});
          } catch (err) {
            // Container might already be gone due to AutoRemove
          }
          resolve({
            success: false,
            error: 'Execution Timed Out'
          });
        }, timeoutMs);

        logs.on('data', (chunk) => outputBuffer.push(chunk.toString()));
        logs.on('end', () => {
          clearTimeout(killTimer);
          // Strip non-printable characters but keep newlines
          const rawOutput = outputBuffer.join('');
          const cleanOutput = rawOutput.replace(/[\x00-\x09\x0B-\x1F\x7F-\x9F]/g, "").trim();
          
          resolve({
            success: true,
            output: cleanOutput
          });
        });
      });

    } catch (err) {
      return {
        success: false,
        error: `Sandbox Failure: ${err.message}`
      };
    }
  }
}
