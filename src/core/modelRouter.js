function routeModel(taskType, availableModels = []) {
  const models = Array.isArray(availableModels) ? availableModels.map((m) => String(m || "").toLowerCase()) : [];
  const pick = (preferred, fallback = "llama3") => {
    const found = preferred.find((p) => models.includes(p));
    return found || fallback;
  };

  switch (String(taskType || "").toLowerCase()) {
    case "code":
      return pick(["qwen2.5-coder", "deepseek-coder", "codellama"], "llama3");
    case "analysis":
      return pick(["llama3.1", "mistral-large", "phi4"], "llama3");
    case "creative":
      return pick(["mistral", "llama3.1", "phi3"], "llama3");
    case "safety":
      return pick(["llama3.1", "phi4"], "llama3");
    default:
      return pick(["llama3", "llama3.1"], "llama3");
  }
}

module.exports = {
  routeModel
};
