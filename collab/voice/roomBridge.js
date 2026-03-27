function normalizeVoiceSignal(payload = {}) {
  const input = payload && typeof payload === "object" ? payload : {};
  return {
    type: String(input.type || ""),
    toPeerId: String(input.toPeerId || ""),
    fromPeerId: String(input.fromPeerId || ""),
    sdp: input.sdp || null,
    candidate: input.candidate || null
  };
}

module.exports = {
  normalizeVoiceSignal
};

