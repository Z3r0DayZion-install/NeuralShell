const os = require('os');
const stateManager = require('./stateManager');

/**
 * SystemMonitor collects basic system statistics such as CPU usage, memory
 * usage, token usage (from state) and platform information. The CPU
 * utilisation returned here is a snapshot percentage across all cores; it
 * may not be precise but provides a useful indicator for the UI.
 */
class SystemMonitor {
  /**
   * Compute average CPU usage across all cores. This function samples the
   * CPU usage over a very short interval to approximate utilisation. It
   * should not be called too frequently to avoid performance impact.
   *
   * @returns {number} Percentage of CPU used (0-100).
   */
  getCpuUsage() {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;
    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });
    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 100 - Math.round((idle / total) * 100);
    return usage;
  }

  /**
   * Collect memory statistics and token usage. Memory is reported in bytes
   * along with the calculated percentage used.
   *
   * @returns {object}
   */
  getStats() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const tokens = stateManager.get('tokens') || 0;
    const memoryMb = Math.round(usedMem / (1024 * 1024));
    const cpuPercent = this.getCpuUsage();
    return {
      cpu: cpuPercent,
      cpuPercent,
      memory: {
        total: totalMem,
        used: usedMem,
        free: freeMem,
        percent: Math.round((usedMem / totalMem) * 100)
      },
      memoryMb,
      tokens,
      tokensUsed: tokens,
      platform: os.platform(),
      arch: os.arch(),
      uptime: os.uptime()
    };
  }
}

module.exports = new SystemMonitor();
