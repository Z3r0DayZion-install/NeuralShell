const startedAt = Date.now();
let tokensUsed = 0;

function getStats() {
  const memoryMb = Math.round(process.memoryUsage().rss / (1024 * 1024));
  const uptimeSec = Math.round((Date.now() - startedAt) / 1000);
  return {
    cpuPercent: 0,
    memoryMb,
    tokensUsed,
    platform: process.platform,
    uptimeSec
  };
}

function addTokens(amount) {
  const delta = Number.isFinite(Number(amount)) ? Number(amount) : 0;
  tokensUsed += Math.max(0, delta);
  return tokensUsed;
}

function resetTokens() {
  tokensUsed = 0;
}

module.exports = {
  addTokens,
  getStats,
  resetTokens
};
