export function parseCsvSet(value) {
  return new Set(
    String(value || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  );
}

export function parseBlockedTerms(value) {
  return String(value || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function validateBootConfig(config) {
  const checks = [
    ['timeoutMs', config.timeoutMs > 0],
    ['bodyLimit', config.bodyLimit > 0],
    ['maxConcurrentRequests', config.maxConcurrentRequests > 0],
    ['requestsPerWindow', config.requestsPerWindow > 0],
    ['rateLimitWindowMs', config.rateLimitWindowMs > 0],
    ['maxMessagesPerRequest', config.maxMessagesPerRequest > 0],
    ['maxMessageChars', config.maxMessageChars > 0],
    ['maxTotalMessageChars', config.maxTotalMessageChars > 0],
    ['responseMaxChars', config.responseMaxChars > 0],
    ['retryOnTimeout', config.retryOnTimeout >= 0],
    ['retryBackoffMs', config.retryBackoffMs >= 0],
    ['maxEndpoints', config.maxEndpoints > 0],
    ['rateLimitMaxKeys', config.rateLimitMaxKeys > 0],
    ['rateLimitCleanupIntervalMs', config.rateLimitCleanupIntervalMs > 0],
    ['idempotencyTtlMs', config.idempotencyTtlMs > 0],
    ['maxIdempotencyKeys', config.maxIdempotencyKeys > 0],
    ['maxFailuresReported', config.maxFailuresReported > 0],
    ['adminAuditMaxBytes', config.adminAuditMaxBytes > 0],
    ['adminAuditRecentDefaultLimit', config.adminAuditRecentDefaultLimit > 0],
    ['maxClientKeyChars', config.maxClientKeyChars > 0],
    ['persistStateIntervalMs', config.persistStateIntervalMs > 0]
  ];
  const failed = checks.filter(([, ok]) => !ok).map(([name]) => name);
  if (failed.length > 0) {
    throw new Error(`Invalid boot config: ${failed.join(', ')}`);
  }
}

export function containsBlockedTerm(messages, blockedTerms) {
  if (!blockedTerms.length) {
    return null;
  }
  const combined = messages.map((m) => String(m.content || '')).join('\n').toLowerCase();
  return blockedTerms.find((term) => combined.includes(term)) || null;
}
