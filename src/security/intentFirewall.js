const { IntentFirewall } = require("@neural/omega-core");

/**
 * NeuralShell Intent Firewall
 * Plugs custom intent schemas into the OMEGA Core IntentFirewall engine.
 */

const INTENT_REGISTRY = {
  "llm:chat": {
    schema: {
      type: "object",
      properties: {
        messages: {
          type: "array",
          items: {
            type: "object",
            properties: {
              role: { type: "string", enum: ["user", "assistant", "system"] },
              content: { type: "string", maxLength: 32768 }
            },
            required: ["role", "content"]
          }
        },
        stream: { type: "boolean" }
      },
      required: ["messages"],
      additionalProperties: false
    },
    requiresApproval: false
  },
  "session:save": {
    schema: {
      type: "object",
      properties: {
        name: { type: "string", minLength: 1, maxLength: 255 },
        data: { type: "object" },
        passphrase: { type: "string", minLength: 8 }
      },
      required: ["name", "data", "passphrase"],
      additionalProperties: false
    },
    requiresApproval: false
  },
  "kernel:net:fetch": {
    schema: {
      type: "object",
      properties: {
        url: { type: "string", pattern: "^https://" },
        method: { type: "string", enum: ["GET", "POST"] },
        headers: { type: "object" },
        body: { type: "object" },
        timeoutMs: { type: "number", minimum: 1000, maximum: 30000 }
      },
      required: ["url"],
      additionalProperties: false
    },
    requiresApproval: true // Sensitive network intent
  },
  "kernel:agent:run": {
    schema: {
      type: "object",
      properties: {
        prompt: { type: "string", minLength: 1, maxLength: 4096 }
      },
      required: ["prompt"],
      additionalProperties: false
    },
    requiresApproval: true // Critical code execution intent
  }
};

module.exports = new IntentFirewall({ intentRegistry: INTENT_REGISTRY });
