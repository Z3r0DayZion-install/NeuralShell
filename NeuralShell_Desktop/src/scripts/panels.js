(function initPanels(globalObj) {
  "use strict";

  function buildMergePreview(currentState, incomingState) {
    const currentIds = new Set((currentState.sessions || []).map((s) => s.id));
    const incoming = incomingState.sessions || [];
    const conflicts = incoming.filter((s) => currentIds.has(s.id));
    return {
      currentSessions: (currentState.sessions || []).length,
      incomingSessions: incoming.length,
      conflicts: conflicts.map((c) => ({ id: c.id, name: c.name || "Unnamed" })),
      summary: conflicts.length
        ? `Detected ${conflicts.length} session ID conflicts`
        : "No session ID conflicts detected"
    };
  }

  globalObj.NeuralPanels = { buildMergePreview };
})(window);
