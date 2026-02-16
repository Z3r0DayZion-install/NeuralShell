(function initHelpers(globalObj) {
  "use strict";

  function escapeHtml(text) {
    return String(text)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function tokenize(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(Boolean);
  }

  function parseAssistantResponse(response) {
    if (!response || typeof response !== "object") return "No response";
    if (typeof response.message?.content === "string") return response.message.content;
    if (Array.isArray(response.choices) && response.choices[0]?.message?.content) return response.choices[0].message.content;
    if (typeof response.response === "string") return response.response;
    return JSON.stringify(response, null, 2);
  }

  function downloadText(filename, text, mime = "text/plain") {
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  globalObj.NeuralHelpers = { escapeHtml, tokenize, parseAssistantResponse, downloadText };
})(window);
