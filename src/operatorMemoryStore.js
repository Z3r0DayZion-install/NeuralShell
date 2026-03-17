(function initOperatorMemoryStore(root, factory) {
  const store = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = store;
  }
  root.NeuralShellOperatorMemory = store;
})(typeof globalThis !== "undefined" ? globalThis : this, function buildOperatorMemoryStore() {
  const STORAGE_KEY = "neuralshell-operator-memory-v1";
  const PROMPT_LIMIT = 8;
  const WORKSPACE_LIMIT = 6;

  function safeLocalStorage() {
    try {
      if (typeof globalThis !== "undefined" && typeof globalThis.localStorage !== "undefined") {
        return globalThis.localStorage;
      }
    } catch {
      return null;
    }
    return null;
  }

  const memoryFallback = {
    draftPrompt: "",
    recentPrompts: [],
    recentWorkspaces: [],
    layoutPrefs: {}
  };

  function cloneFallback() {
    return {
      draftPrompt: memoryFallback.draftPrompt,
      recentPrompts: memoryFallback.recentPrompts.slice(),
      recentWorkspaces: memoryFallback.recentWorkspaces.slice(),
      layoutPrefs: { ...memoryFallback.layoutPrefs }
    };
  }

  function normalizePromptEntry(entry) {
    const text = String(entry && entry.text || "").trim();
    if (!text) return null;
    return {
      text,
      updatedAt: String(entry && entry.updatedAt || new Date().toISOString())
    };
  }

  function normalizeWorkspaceEntry(entry) {
    const rootPath = String(entry && entry.rootPath || "").trim();
    if (!rootPath) return null;
    const label = String(entry && (entry.label || entry.rootLabel) || "").trim() || rootPath;
    const signals = Array.isArray(entry && entry.signals)
      ? entry.signals.map((signal) => String(signal || "").trim()).filter(Boolean).slice(0, 6)
      : [];
    return {
      rootPath,
      label,
      signals,
      attachedAt: String(entry && entry.attachedAt || new Date().toISOString()),
      updatedAt: String(entry && (entry.updatedAt || entry.lastUsedAt || entry.attachedAt) || new Date().toISOString())
    };
  }

  function normalizeState(source) {
    const base = source && typeof source === "object" ? source : {};
    return {
      draftPrompt: String(base.draftPrompt || ""),
      recentPrompts: Array.isArray(base.recentPrompts)
        ? base.recentPrompts.map(normalizePromptEntry).filter(Boolean).slice(0, PROMPT_LIMIT)
        : [],
      recentWorkspaces: Array.isArray(base.recentWorkspaces)
        ? base.recentWorkspaces.map(normalizeWorkspaceEntry).filter(Boolean).slice(0, WORKSPACE_LIMIT)
        : [],
      layoutPrefs: base.layoutPrefs && typeof base.layoutPrefs === "object" ? { ...base.layoutPrefs } : {}
    };
  }

  function loadState() {
    const storage = safeLocalStorage();
    if (!storage) {
      return cloneFallback();
    }
    try {
      const raw = storage.getItem(STORAGE_KEY);
      if (!raw) {
        return cloneFallback();
      }
      return normalizeState(JSON.parse(raw));
    } catch {
      return cloneFallback();
    }
  }

  function saveState(nextState) {
    const normalized = normalizeState(nextState);
    const storage = safeLocalStorage();
    if (!storage) {
      memoryFallback.draftPrompt = normalized.draftPrompt;
      memoryFallback.recentPrompts = normalized.recentPrompts.slice();
      memoryFallback.recentWorkspaces = normalized.recentWorkspaces.slice();
      memoryFallback.layoutPrefs = { ...normalized.layoutPrefs };
      return normalized;
    }
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    } catch {
      return normalizeState(memoryFallback);
    }
    return normalized;
  }

  function mutateState(mutator) {
    const state = loadState();
    const next = typeof mutator === "function" ? mutator(state) || state : state;
    return saveState(next);
  }

  function loadDraftPrompt() {
    return loadState().draftPrompt;
  }

  function saveDraftPrompt(text) {
    return mutateState((state) => {
      state.draftPrompt = String(text || "");
      return state;
    }).draftPrompt;
  }

  function clearDraftPrompt() {
    return saveDraftPrompt("");
  }

  function recordPrompt(text) {
    const normalizedText = String(text || "").trim();
    if (!normalizedText) {
      return listRecentPrompts(PROMPT_LIMIT);
    }
    return mutateState((state) => {
      const updatedAt = new Date().toISOString();
      state.recentPrompts = [
        { text: normalizedText, updatedAt },
        ...state.recentPrompts.filter((entry) => String(entry && entry.text || "").trim() !== normalizedText)
      ].slice(0, PROMPT_LIMIT);
      return state;
    }).recentPrompts;
  }

  function listRecentPrompts(limit) {
    const maxItems = Number.isFinite(Number(limit)) ? Math.max(0, Number(limit)) : PROMPT_LIMIT;
    return loadState().recentPrompts.slice(0, maxItems);
  }

  function recordWorkspace(summary) {
    const normalized = normalizeWorkspaceEntry(summary);
    if (!normalized) {
      return listRecentWorkspaces(WORKSPACE_LIMIT);
    }
    return mutateState((state) => {
      const updatedAt = new Date().toISOString();
      state.recentWorkspaces = [
        {
          ...normalized,
          updatedAt
        },
        ...state.recentWorkspaces.filter((entry) => String(entry && entry.rootPath || "").trim() !== normalized.rootPath)
      ].slice(0, WORKSPACE_LIMIT);
      return state;
    }).recentWorkspaces;
  }

  function listRecentWorkspaces(limit) {
    const maxItems = Number.isFinite(Number(limit)) ? Math.max(0, Number(limit)) : WORKSPACE_LIMIT;
    return loadState().recentWorkspaces.slice(0, maxItems);
  }

  function removeWorkspace(rootPath) {
    const target = String(rootPath || "").trim();
    return mutateState((state) => {
      state.recentWorkspaces = state.recentWorkspaces.filter((entry) => String(entry && entry.rootPath || "").trim() !== target);
      return state;
    }).recentWorkspaces;
  }

  function loadLayoutPrefs() {
    return { ...loadState().layoutPrefs };
  }

  function saveLayoutPrefs(prefs) {
    const nextPrefs = prefs && typeof prefs === "object" ? { ...prefs } : {};
    return mutateState((state) => {
      state.layoutPrefs = {
        ...state.layoutPrefs,
        ...nextPrefs
      };
      return state;
    }).layoutPrefs;
  }

  return {
    clearDraftPrompt,
    listRecentPrompts,
    listRecentWorkspaces,
    loadDraftPrompt,
    loadLayoutPrefs,
    recordPrompt,
    recordWorkspace,
    removeWorkspace,
    saveDraftPrompt,
    saveLayoutPrefs
  };
});

