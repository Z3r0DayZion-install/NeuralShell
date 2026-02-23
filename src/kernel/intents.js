/**
 * Static Intent Registry
 * Immutable map of intents to deterministic kernel actions.
 */
"use strict";

const Broker = require('./index');
const { CAP_EXEC, CAP_FS, CAP_NET } = require('./tokens');

const INTENT_REGISTRY = Object.freeze({
  'SYS_GET_UPTIME': async () => ({ output: process.uptime().toFixed(2) + 's' }),
  'GIT_REPO_STATUS': async () => Broker.request(CAP_EXEC, 'git', ['status']),
  'GIT_REPO_LOG': async () => Broker.request(CAP_EXEC, 'git', ['log']),
  'NET_CHECK_GATEWAY': async () => Broker.request(CAP_NET, 'https://api.trusted-llm.com/health')
});

module.exports = INTENT_REGISTRY;
