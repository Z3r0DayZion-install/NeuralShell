const { safeTimestamp } = require('./_proof_lib.cjs');

process.stdout.write(`${process.env.PROOF_RUN_TS || safeTimestamp()}\n`);

