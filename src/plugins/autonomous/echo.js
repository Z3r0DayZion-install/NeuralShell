/**
 * NeuralShell Echo Plugin — Sample for Integrity Testing
 */
module.exports = {
  name: "echo-plugin",
  description: "Simple echo for testing plugin loaders",
  register({ registerCommand }) {
    registerCommand({
      name: "echo",
      description: "Echoes back the input text",
      args: ["text"],
      async run({ text }) {
        return `ECHO: ${text || "No input provided."}`;
      }
    });
  }
};
