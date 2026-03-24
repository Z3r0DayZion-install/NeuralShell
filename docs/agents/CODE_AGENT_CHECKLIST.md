# Code Agent Checklist

Before proposing any change:
1. Does this preserve deterministic build behavior?
2. Does this preserve original OMEGA trust anchors in `src/core/identityKernel.js`?
3. Does this avoid introducing direct system primitives (fs, net) outside `src/kernel`?
4. Does this comply with `IntentFirewall` schemas in `src/security`?
5. Does this adhere to the "Operator-First" naming (Command Panel, Modular Injector, etc.)?
6. Does it pass the `tests/omega_security.test.js` assertion suite?
6. Does this reduce complexity rather than expand it?
7. Is this required for verification, release, or clarity?

If any answer is No, stop.
