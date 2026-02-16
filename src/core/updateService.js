"use strict";

const fetch = require("node-fetch");

function parseVersion(v) {
  return String(v || "")
    .replace(/^v/i, "")
    .split(".")
    .map((x) => Number(x) || 0)
    .slice(0, 3);
}

function gt(a, b) {
  const av = parseVersion(a);
  const bv = parseVersion(b);
  for (let i = 0; i < 3; i += 1) {
    if ((av[i] || 0) > (bv[i] || 0)) return true;
    if ((av[i] || 0) < (bv[i] || 0)) return false;
  }
  return false;
}

class UpdateService {
  async check(currentVersion, feedUrl) {
    if (!feedUrl) throw new Error("feed url missing");
    const res = await fetch(feedUrl);
    if (!res.ok) throw new Error(`update check failed: ${res.status}`);
    const text = await res.text();
    const match = text.match(/^version:\s*(.+)$/m);
    const remote = match ? match[1].trim() : "";
    if (!remote) throw new Error("invalid latest.yml");
    return {
      current: currentVersion,
      latest: remote,
      updateAvailable: gt(remote, currentVersion)
    };
  }
}

module.exports = { UpdateService };
