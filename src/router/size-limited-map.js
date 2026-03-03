/**
 * A Map implementation with size limits and TTL support
 * Automatically evicts oldest entries when size limit is reached
 * Supports automatic expiration of entries after TTL
 */
export class SizeLimitedMap {
  /**
   * Create a new SizeLimitedMap
   * @param {Object} options - Configuration options
   * @param {number} options.maxSize - Maximum number of entries (default: 1000)
   * @param {number} options.ttl - Time to live in milliseconds (default: null, no expiration)
   */
  constructor(options = {}) {
    this.maxSize = options.maxSize || 1000;
    this.ttl = options.ttl || null;
    this.map = new Map();
    this.timers = new Map();
  }

  /**
   * Set a key-value pair in the map
   * @param {*} key - The key
   * @param {*} value - The value
   */
  set(key, value) {
    // Clear existing timer if key is being overwritten
    const existingTimer = this.timers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.timers.delete(key);
    }

    // Enforce size limit
    if (this.map.size >= this.maxSize && !this.map.has(key)) {
      // Remove oldest entry (first in iteration order)
      const firstKey = this.map.keys().next().value;
      this.delete(firstKey);
    }

    const entry = {
      value,
      createdAt: Date.now(),
      expiresAt: this.ttl ? Date.now() + this.ttl : null
    };

    this.map.set(key, entry);

    // Set TTL timer if configured
    if (this.ttl) {
      const timer = setTimeout(() => {
        this.delete(key);
      }, this.ttl);
      this.timers.set(key, timer);
    }
  }

  /**
   * Get a value from the map
   * @param {*} key - The key
   * @returns {*} The value, or undefined if not found or expired
   */
  get(key) {
    const entry = this.map.get(key);
    if (!entry) {
      return undefined;
    }

    // Check expiration
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.delete(key);
      return undefined;
    }

    return entry.value;
  }

  /**
   * Check if a key exists in the map
   * @param {*} key - The key
   * @returns {boolean} True if key exists and is not expired
   */
  has(key) {
    return this.get(key) !== undefined;
  }

  /**
   * Delete a key from the map
   * @param {*} key - The key
   * @returns {boolean} True if key was deleted
   */
  delete(key) {
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(key);
    }
    return this.map.delete(key);
  }

  /**
   * Clear all entries from the map
   */
  clear() {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    this.map.clear();
  }

  /**
   * Get the number of entries in the map
   * @returns {number} The size
   */
  get size() {
    return this.map.size;
  }

  /**
   * Cleanup expired entries
   * This is called automatically via TTL timers, but can be called manually
   */
  cleanupExpired() {
    const now = Date.now();
    for (const [key, entry] of this.map) {
      if (entry.expiresAt && now > entry.expiresAt) {
        this.delete(key);
      }
    }
  }

  /**
   * Make the map iterable
   */
  [Symbol.iterator]() {
    return this.map[Symbol.iterator]();
  }
}
