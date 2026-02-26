/**
 * Capability Tokens for NeuralShell Kernel
 * Unique Symbol-based tokens required to access restricted broker actions.
 */
'use strict';

module.exports = Object.freeze({
  CAP_EXEC: Symbol('NEURALSHELL_CAP_EXEC'),
  CAP_FS: Symbol('NEURALSHELL_CAP_FS'),
  CAP_NET: Symbol('NEURALSHELL_CAP_NET'),
  CAP_CRYPTO: Symbol('NEURALSHELL_CAP_CRYPTO'),
  CAP_UI: Symbol('NEURALSHELL_CAP_UI')
});
