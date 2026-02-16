(function initStateSchema(globalObj) {
  "use strict";

  const CURRENT_SCHEMA_VERSION = 2;

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function normalizeSession(input) {
    const session = input && typeof input === "object" ? input : {};
    const createdAt = typeof session.createdAt === "string" ? session.createdAt : new Date().toISOString();
    const updatedAt = typeof session.updatedAt === "string" ? session.updatedAt : createdAt;
    const id = typeof session.id === "string" && session.id ? session.id : `s_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
    const name = typeof session.name === "string" && session.name ? session.name : "Recovered Session";
    const sourceMessages = Array.isArray(session.messages) ? session.messages : [];
    const messages = sourceMessages
      .filter((m) => m && typeof m.content === "string")
      .map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
        at: typeof m.at === "string" ? m.at : new Date().toISOString()
      }));
    return { id, name, createdAt, updatedAt, messages };
  }

  function migrateState(input) {
    const raw = input && typeof input === "object" ? clone(input) : {};
    const out = {
      schemaVersion: Number.isFinite(raw.schemaVersion) ? raw.schemaVersion : 1,
      sessions: Array.isArray(raw.sessions) ? raw.sessions.map(normalizeSession) : [],
      activeSessionId: typeof raw.activeSessionId === "string" ? raw.activeSessionId : null,
      settings: raw.settings && typeof raw.settings === "object" ? clone(raw.settings) : {},
      logs: Array.isArray(raw.logs) ? raw.logs.filter((l) => typeof l === "string") : []
    };

    if (out.schemaVersion < 2) {
      out.settings = {
        theme: typeof out.settings.theme === "string" ? out.settings.theme : "dark",
        model: typeof out.settings.model === "string" ? out.settings.model : "llama3",
        temperature: Number.isFinite(Number(out.settings.temperature)) ? Number(out.settings.temperature) : 0.4,
        systemPrompt: typeof out.settings.systemPrompt === "string" ? out.settings.systemPrompt : "",
        autoGoal: typeof out.settings.autoGoal === "string" ? out.settings.autoGoal : "",
        autoInterval: Number.isFinite(Number(out.settings.autoInterval)) ? Math.max(5, Number(out.settings.autoInterval)) : 20
      };
      out.schemaVersion = 2;
    }

    if (!out.sessions.length) {
      const fallback = normalizeSession({ name: "New Session", messages: [] });
      out.sessions.push(fallback);
      out.activeSessionId = fallback.id;
    } else if (!out.activeSessionId || !out.sessions.some((s) => s.id === out.activeSessionId)) {
      out.activeSessionId = out.sessions[0].id;
    }

    out.schemaVersion = CURRENT_SCHEMA_VERSION;
    return out;
  }

  const api = { CURRENT_SCHEMA_VERSION, migrateState };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (globalObj) {
    globalObj.NeuralStateSchema = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
