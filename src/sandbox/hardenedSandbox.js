import Docker from 'dockerode';

function stripControlChars(str) {
  let out = '';
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (
      (code >= 0x00 && code <= 0x09)
      || (code >= 0x0B && code <= 0x1F)
      || (code >= 0x7F && code <= 0x9F)
    ) {
      continue;
    }
    out += str[i];
  }
  return out;
}

function withTimeout(promise, timeoutMs, errorMessage) {
  if (!timeoutMs || timeoutMs <= 0) {
    return promise;
  }
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(errorMessage || 'Timed out')), timeoutMs);
    })
  ]);
}

function waitForContainer(container) {
  return new Promise((resolve, reject) => {
    container.wait((err, data) => {
      if (err) {
        return reject(err);
      }
      resolve(data);
    });
  });
}

export class HardenedSandbox {
  constructor(timeoutMs = 15000, dockerOptions) {
    this.docker = new Docker(dockerOptions);
    this.image = process.env.NS_SANDBOX_IMAGE || 'node:20-alpine';
    this.defaultTimeout = timeoutMs;

    this._availability = { ok: null, ts: 0 };
  }

  async isAvailable(timeoutMs = 1000) {
    const now = Date.now();
    if (this._availability.ok !== null && now - this._availability.ts < 5000) {
      return this._availability.ok;
    }

    const ping = new Promise((resolve, reject) => {
      this.docker.ping((err, data) => (err ? reject(err) : resolve(data)));
    });

    const ok = await withTimeout(ping, timeoutMs, 'docker ping timed out').then(
      () => true,
      () => false
    );

    this._availability = { ok, ts: now };
    return ok;
  }

  async execute(code, customTimeoutMs) {
    const outputBuffer = [];
    const timeoutMs = customTimeoutMs || this.defaultTimeout;

    const reachable = await this.isAvailable(1000);
    if (!reachable) {
      throw new Error('docker engine is not reachable (docker ping failed)');
    }

    // Encode code to base64 to avoid shell escaping issues and pass via ENV
    const encodedCode = Buffer.from(code, 'utf8').toString('base64');

    const cmd = [
      'node',
      '-e',
      [
        'try {',
        '  const src = Buffer.from(process.env.CODE || "", "base64").toString("utf8");',
        '  eval(src);',
        '} catch (e) {',
        '  console.error(e && e.stack ? e.stack : String(e));',
        '  process.exitCode = 1;',
        '}'
      ].join('')
    ];

    let container;
    try {
      container = await this.docker.createContainer({
        Image: this.image,
        Cmd: cmd,
        Env: [`CODE=${encodedCode}`],
        WorkingDir: '/tmp',
        User: 'node',
        HostConfig: {
          AutoRemove: true,

          // Resource limits
          Memory: 128 * 1024 * 1024,
          MemorySwap: 128 * 1024 * 1024,
          CpuQuota: 50000,
          PidsLimit: 128,

          // Isolation
          NetworkMode: 'none',
          ReadonlyRootfs: true,
          CapDrop: ['ALL'],
          SecurityOpt: ['no-new-privileges:true'],

          // Writable scratch
          Tmpfs: {
            '/tmp': 'rw,noexec,nosuid,size=16m'
          }
        }
      });
    } catch (err) {
      const msg = String(err && err.message ? err.message : err);
      if (msg.includes('npipe') || msg.toLowerCase().includes('connect')) {
        throw new Error(`docker engine is not reachable (${msg})`);
      }
      return { success: false, error: `Sandbox Failure: ${msg}`, output: '' };
    }

    await container.start();

    const logsStream = await container.logs({
      follow: true,
      stdout: true,
      stderr: true
    });

    const logsDone = new Promise((resolve) => {
      logsStream.on('data', (chunk) => outputBuffer.push(chunk.toString()));
      logsStream.on('end', () => resolve());
      logsStream.on('error', () => resolve());
    });

    let timeoutHit = false;
    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => {
        timeoutHit = true;
        resolve(null);
      }, timeoutMs);
    });

    let waitResult;
    try {
      waitResult = await Promise.race([
        Promise.all([logsDone, waitForContainer(container)]).then(([, r]) => r),
        timeoutPromise
      ]);
    } catch (err) {
      const outputText = stripControlChars(outputBuffer.join('')).trim();
      return {
        success: false,
        error: `Sandbox Failure: ${String(err && err.message ? err.message : err)}`,
        output: outputText
      };
    }

    if (timeoutHit || !waitResult) {
      try {
        await container.stop({ t: 0 }).catch(() => {});
        await container.remove({ force: true }).catch(() => {});
      } catch {
        // ignore
      }

      const outputText = stripControlChars(outputBuffer.join('')).trim();
      return {
        success: false,
        error: 'Execution Timed Out',
        output: outputText,
        exitCode: null
      };
    }

    const statusCode =
      waitResult && typeof waitResult.StatusCode === 'number' ? waitResult.StatusCode : null;

    const cleanOutput = stripControlChars(outputBuffer.join('')).trim();

    if (statusCode === 0) {
      return {
        success: true,
        output: cleanOutput,
        result: null,
        exitCode: 0
      };
    }

    return {
      success: false,
      output: cleanOutput,
      error: 'Non-zero exit code',
      exitCode: statusCode
    };
  }
}
