/**
 * Threat Detector
 * Automatic security threat detection and response
 */

import { EventEmitter } from 'events';
import { globalIntel } from './threatIntel.js';

export class ThreatDetector extends EventEmitter {
  constructor(options = {}) {
    super();
    this.enabled = options.enabled !== false;
    this.autoBlock = options.autoBlock !== false;
    this.blockDurationMs = options.blockDurationMs || 3600000; // 1 hour
    this.rateLimitThreshold = options.rateLimitThreshold || 100;
    this.suspiciousPatterns = options.suspiciousPatterns || [];

    this.blockedIPs = new Map();
    this.suspiciousActivity = new Map();
    this.threatHistory = [];
    this.maxHistorySize = options.maxHistorySize || 1000;

    this.metrics = {
      totalThreats: 0,
      blockedIPs: 0,
      suspiciousRequests: 0,
      autoBlocked: 0,
      falsePositives: 0
    };

    this.initializePatterns();
  }

  /**
   * Initialize threat patterns
   */
  initializePatterns() {
    this.patterns = {
      sqlInjection: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\s+(FROM|INTO|WHERE|TABLE)\b)/i,
      xss: /<script[^>]*>.*?<\/script>|javascript:|onerror=|onload=/i,
      pathTraversal: /(?:\.\.[/\\])/,
      // More specific command injection: looks for separators followed by dangerous binaries or direct execution
      commandInjection: /(?:;|\||&|`|\$)\s*(?:bash|sh|nc|netcat|curl|wget|python|perl|ruby|gcc|make|docker|kubectl)/i,
      suspiciousUserAgent: /bot|crawler|spider|scraper|curl|wget/i,
      // Advanced LLM-specific threats
      promptInjection: /(ignore\s+previous\s+instructions|you\s+are\s+now\s+a|system\s+override|DAN\s+mode|jailbreak|do\s+anything\s+now)/i,
      sensitiveData: /(AIza[0-9A-Za-z-_]{35}|sk-[a-zA-Z0-9]{48}|(?:\d{3}-?\d{2}-?\d{4})|(?:\d{4}-?\d{4}-?\d{4}-?\d{4}))/,
      ...this.suspiciousPatterns
    };
  }

  /**
   * Analyze request for threats
   */
  analyzeRequest(request) {
    if (!this.enabled) {
      return { threat: false };
    }

    const ip = this.getClientIP(request);
    const threats = [];

    // Check if IP is blocked
    if (this.isBlocked(ip) || globalIntel.isThreat('ip', ip)) {
      return {
        threat: true,
        type: 'blocked_ip',
        ip,
        action: 'reject'
      };
    }

    // Check rate limiting abuse
    const rateAbuse = this.checkRateAbuse(ip);
    if (rateAbuse) {
      threats.push(rateAbuse);
    }

    // Check request patterns
    const patternThreats = this.checkPatterns(request);
    threats.push(...patternThreats);

    // Check suspicious behavior
    const behaviorThreat = this.checkBehavior(ip, request);
    if (behaviorThreat) {
      threats.push(behaviorThreat);
    }

    if (threats.length > 0) {
      this.handleThreat(ip, threats, request);

      return {
        threat: true,
        types: threats.map(t => t.type),
        severity: this.calculateSeverity(threats),
        action: this.determineAction(threats)
      };
    }

    return { threat: false };
  }

  /**
   * Check for rate abuse
   */
  checkRateAbuse(ip) {
    const activity = this.suspiciousActivity.get(ip);

    if (!activity) {
      return null;
    }

    const recentRequests = activity.requests.filter(
      r => Date.now() - r < 60000 // Last minute
    );

    if (recentRequests.length > this.rateLimitThreshold) {
      return {
        type: 'rate_abuse',
        severity: 'high',
        details: `${recentRequests.length} requests in 1 minute`
      };
    }

    return null;
  }

  /**
   * Check request against threat patterns
   */
  checkPatterns(request) {
    const threats = [];
    const checkData = [
      request.url,
      request.headers?.['user-agent'],
      JSON.stringify(request.body || {})
    ].join(' ');

    for (const [name, pattern] of Object.entries(this.patterns)) {
      if (pattern.test(checkData)) {
        threats.push({
          type: name,
          severity: this.getPatternSeverity(name),
          details: `Pattern matched: ${name}`
        });
      }
    }

    return threats;
  }

  /**
   * Check for suspicious behavior patterns
   */
  checkBehavior(ip, request) {
    let activity = this.suspiciousActivity.get(ip);

    if (!activity) {
      activity = {
        requests: [],
        endpoints: new Set(),
        userAgents: new Set(),
        firstSeen: Date.now()
      };
      this.suspiciousActivity.set(ip, activity);
    }

    // Track request
    activity.requests.push(Date.now());
    activity.endpoints.add(request.url);
    activity.userAgents.add(request.headers?.['user-agent']);

    // Clean old requests
    activity.requests = activity.requests.filter(
      r => Date.now() - r < 3600000 // Last hour
    );

    // Check for suspicious patterns
    const uniqueEndpoints = activity.endpoints.size;
    const uniqueUserAgents = activity.userAgents.size;

    // Scanning behavior: many different endpoints
    if (uniqueEndpoints > 50) {
      return {
        type: 'scanning',
        severity: 'high',
        details: `Accessed ${uniqueEndpoints} unique endpoints`
      };
    }

    // User agent switching
    if (uniqueUserAgents > 5) {
      return {
        type: 'user_agent_switching',
        severity: 'medium',
        details: `Used ${uniqueUserAgents} different user agents`
      };
    }

    return null;
  }

  /**
   * Handle detected threat
   */
  handleThreat(ip, threats, request) {
    this.metrics.totalThreats++;
    this.metrics.suspiciousRequests++;

    const threat = {
      ip,
      threats,
      timestamp: new Date().toISOString(),
      request: {
        method: request.method,
        url: request.url,
        userAgent: request.headers?.['user-agent']
      }
    };

    // Record in history
    this.threatHistory.push(threat);
    if (this.threatHistory.length > this.maxHistorySize) {
      this.threatHistory.shift();
    }

    // Emit threat event
    this.emit('threat_detected', threat);

    // Auto-block if enabled and severity is high
    const severity = this.calculateSeverity(threats);
    if (this.autoBlock && severity === 'critical') {
      this.blockIP(ip, 'auto_block', threats);
    }
  }

  /**
   * Block an IP address
   */
  blockIP(ip, reason, threats = []) {
    const expiresAt = Date.now() + this.blockDurationMs;

    this.blockedIPs.set(ip, {
      ip,
      reason,
      threats,
      blockedAt: Date.now(),
      expiresAt
    });

    // Report to Global Intel
    globalIntel.reportThreat('ip', ip, { reason, severity: 'critical' });

    this.metrics.blockedIPs++;
    if (reason === 'auto_block') {
      this.metrics.autoBlocked++;
    }

    this.emit('ip_blocked', {
      ip,
      reason,
      expiresAt: new Date(expiresAt).toISOString()
    });

    // Auto-unblock after duration
    setTimeout(() => {
      this.unblockIP(ip);
    }, this.blockDurationMs);

    console.log(`[ThreatDetector] Blocked IP: ${ip} (${reason})`);
  }

  /**
   * Unblock an IP address
   */
  unblockIP(ip) {
    if (this.blockedIPs.has(ip)) {
      this.blockedIPs.delete(ip);
      this.emit('ip_unblocked', { ip, timestamp: Date.now() });
      console.log(`[ThreatDetector] Unblocked IP: ${ip}`);
    }
  }

  /**
   * Check if IP is blocked
   */
  isBlocked(ip) {
    const block = this.blockedIPs.get(ip);

    if (!block) {
      return false;
    }

    // Check if block expired
    if (Date.now() >= block.expiresAt) {
      this.unblockIP(ip);
      return false;
    }

    return true;
  }

  /**
   * Calculate threat severity
   */
  calculateSeverity(threats) {
    const severities = threats.map(t => t.severity);

    if (severities.includes('critical')) {
      return 'critical';
    }
    if (severities.includes('high')) {
      return 'high';
    }
    if (severities.includes('medium')) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Determine action based on threats
   */
  determineAction(threats) {
    const severity = this.calculateSeverity(threats);

    switch (severity) {
    case 'critical':
      return 'block';
    case 'high':
      return 'challenge';
    case 'medium':
      return 'log';
    default:
      return 'monitor';
    }
  }

  /**
   * Get pattern severity
   */
  getPatternSeverity(patternName) {
    const criticalPatterns = ['sqlInjection', 'commandInjection'];
    const highPatterns = ['xss', 'pathTraversal'];

    if (criticalPatterns.includes(patternName)) {
      return 'critical';
    }
    if (highPatterns.includes(patternName)) {
      return 'high';
    }
    return 'medium';
  }

  /**
   * Get client IP
   */
  getClientIP(request) {
    return request.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
           request.headers?.['x-real-ip'] ||
           request.ip ||
           'unknown';
  }

  /**
   * Get threat statistics
   */
  getStats() {
    const blockRate = this.metrics.totalThreats > 0
      ? (this.metrics.blockedIPs / this.metrics.totalThreats) * 100
      : 0;

    return {
      enabled: this.enabled,
      autoBlock: this.autoBlock,
      metrics: {
        ...this.metrics,
        blockRate: blockRate.toFixed(2) + '%'
      },
      blocked: {
        current: this.blockedIPs.size,
        total: this.metrics.blockedIPs
      },
      suspicious: this.suspiciousActivity.size
    };
  }

  /**
   * Get blocked IPs
   */
  getBlockedIPs() {
    const blocked = [];

    for (const [ip, block] of this.blockedIPs) {
      blocked.push({
        ip,
        reason: block.reason,
        blockedAt: new Date(block.blockedAt).toISOString(),
        expiresAt: new Date(block.expiresAt).toISOString(),
        threats: block.threats.map(t => t.type)
      });
    }

    return blocked;
  }

  /**
   * Get recent threats
   */
  getRecentThreats(limit = 50) {
    return this.threatHistory.slice(-limit);
  }

  /**
   * Get threats by IP
   */
  getThreatsByIP(ip) {
    return this.threatHistory.filter(t => t.ip === ip);
  }

  /**
   * Mark threat as false positive
   */
  markFalsePositive(ip) {
    this.metrics.falsePositives++;
    this.unblockIP(ip);

    // Remove from suspicious activity
    this.suspiciousActivity.delete(ip);
  }

  /**
   * Add custom pattern
   */
  addPattern(name, pattern, _severity = 'medium') {
    this.patterns[name] = pattern;
  }

  /**
   * Whitelist an IP
   */
  whitelist(ip) {
    this.unblockIP(ip);
    this.suspiciousActivity.delete(ip);

    // Add to whitelist (implement as needed)
    this.emit('ip_whitelisted', { ip, timestamp: Date.now() });
  }
}

export default ThreatDetector;
