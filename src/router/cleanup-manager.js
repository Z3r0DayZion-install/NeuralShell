import { TIMEOUTS } from './constants.js';

/**
 * Centralized resource cleanup manager for graceful shutdown
 * Tracks intervals, timeouts, and resources that need cleanup
 */
export class CleanupManager {
  constructor() {
    this.resources = new Map();
    this.intervals = new Set();
    this.timeouts = new Set();
  }

  /**
   * Register a resource for cleanup
   * @param {string} name - Name of the resource
   * @param {Function} cleanupFn - Async function to cleanup the resource
   */
  register(name, cleanupFn) {
    this.resources.set(name, cleanupFn);
  }

  /**
   * Track an interval for cleanup
   * @param {*} intervalId - The interval ID returned by setInterval
   * @returns {*} The interval ID (for chaining)
   */
  trackInterval(intervalId) {
    this.intervals.add(intervalId);
    return intervalId;
  }

  /**
   * Track a timeout for cleanup
   * @param {*} timeoutId - The timeout ID returned by setTimeout
   * @returns {*} The timeout ID (for chaining)
   */
  trackTimeout(timeoutId) {
    this.timeouts.add(timeoutId);
    return timeoutId;
  }

  /**
   * Cleanup all resources with timeout
   * Clears all intervals and timeouts, then calls cleanup functions
   * If cleanup takes longer than grace period, forces completion
   */
  async cleanup() {
    // Clear all intervals and timeouts first
    for (const intervalId of this.intervals) {
      clearInterval(intervalId);
    }
    this.intervals.clear();

    for (const timeoutId of this.timeouts) {
      clearTimeout(timeoutId);
    }
    this.timeouts.clear();

    // Cleanup resources with timeout
    const cleanupPromises = Array.from(this.resources.entries()).map(
      ([name, cleanupFn]) => this.cleanupResource(name, cleanupFn)
    );

    await Promise.race([
      Promise.all(cleanupPromises),
      new Promise((resolve) =>
        setTimeout(resolve, TIMEOUTS.SHUTDOWN_GRACE_PERIOD_MS)
      )
    ]);

    this.resources.clear();
  }

  /**
   * Cleanup a single resource with error handling
   * @param {string} name - Name of the resource
   * @param {Function} cleanupFn - Cleanup function
   */
  async cleanupResource(name, cleanupFn) {
    try {
      await cleanupFn();
    } catch (err) {
      console.error(`Cleanup failed for ${name}:`, err.message);
    }
  }
}
