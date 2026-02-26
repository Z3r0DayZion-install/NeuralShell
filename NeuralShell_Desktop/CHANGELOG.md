# Changelog

## 2026-02-16
- Security: removed default first-run PIN behavior and added mandatory setup flow.
- Security: added login lockout after repeated failed attempts.
- Security: added explicit local PIN recovery flow requiring `RESET PIN` confirmation and desktop confirmation dialog.
- Security: added auth audit log (`auth_audit.log`) for login, lockout, bootstrap, and recovery events.
- Security: enforced admin auth checks on sensitive permission/vault/sync IPC routes through centralized security IPC registration.
- Tests: replaced source-pattern authz checks with executable security IPC handler integration tests.
- UX: auth panel now shows lockout countdown and clearer first-run/recovery messages.
