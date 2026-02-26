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

  function formatMarkdown(text) {
    if (typeof text !== "string") return "";
    let html = escapeHtml(text);
    
    // Code blocks
    html = html.replace(/```(?:[a-z]*)\n([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    
    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Bold
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // Italic
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    
    // Line breaks
    html = html.replace(/\n/g, '<br>');
    
    return html;
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

  globalObj.NeuralHelpers = { escapeHtml, tokenize, parseAssistantResponse, formatMarkdown, downloadText };
})(window);
