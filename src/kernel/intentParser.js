/**
 * Intent Parser
 * Converts hostile LLM output into validated structured intents.
 */
"use strict";

const Ajv = require('ajv');
const INTENT_REGISTRY = require('./intents');

const ajv = new Ajv({ allErrors: false, strict: true });
const intentSchema = {
  type: "object",
  properties: {
    intent: { type: "string", enum: Object.keys(INTENT_REGISTRY) }
  },
  required: ["intent"],
  additionalProperties: false
};

const validate = ajv.compile(intentSchema);

function parseIntent(rawInput) {
  if (typeof rawInput !== 'string' || rawInput.length > 1024) return null;
  if (rawInput.includes('\0')) return null;

  try {
    const normalized = rawInput.normalize('NFC');
    const parsed = JSON.parse(normalized);
    
    // Guard against prototype pollution
    if (parsed.__proto__ || parsed.constructor || parsed.prototype) return null;

    if (validate(parsed)) {
      return parsed.intent;
    }
  } catch {
    return null;
  }
  return null;
}

module.exports = { parseIntent };
