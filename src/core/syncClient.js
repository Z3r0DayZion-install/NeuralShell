"use strict";

const fetch = require("node-fetch");

class SyncClient {
  async push(endpoint, token, payload) {
    if (!endpoint) throw new Error("sync endpoint missing");
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : ""
      },
      body: JSON.stringify({ type: "state_push", payload, at: new Date().toISOString() })
    });
    if (!res.ok) throw new Error(`sync push failed: ${res.status}`);
    return res.json().catch(() => ({ ok: true }));
  }

  async pull(endpoint, token) {
    if (!endpoint) throw new Error("sync endpoint missing");
    const res = await fetch(endpoint, {
      method: "GET",
      headers: { Authorization: token ? `Bearer ${token}` : "" }
    });
    if (!res.ok) throw new Error(`sync pull failed: ${res.status}`);
    return res.json();
  }
}

module.exports = { SyncClient };
