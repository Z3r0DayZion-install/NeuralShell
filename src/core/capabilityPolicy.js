const DEFAULT_SCOPES = ["chat.read", "chat.write"];

function normalizeScopes(scopes) {
  if (!Array.isArray(scopes)) return [...DEFAULT_SCOPES];
  return scopes
    .map((s) => String(s || "").trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 64);
}

function can(scopeSet, scope) {
  return scopeSet.includes(String(scope || "").trim().toLowerCase());
}

function enforce(scopeSet, required) {
  const needed = Array.isArray(required) ? required : [required];
  const missing = needed.filter((item) => !can(scopeSet, item));
  return {
    ok: missing.length === 0,
    missing
  };
}

module.exports = {
  DEFAULT_SCOPES,
  normalizeScopes,
  can,
  enforce
};
