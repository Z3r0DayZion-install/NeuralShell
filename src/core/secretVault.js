let locked = true;

function lock() {
  locked = true;
  return { ok: true, locked };
}

function unlock(password) {
  const pass = String(password || "");
  if (!pass) {
    throw new Error("Vault password is required.");
  }
  locked = false;
  return { ok: true, locked };
}

function compact(data, format) {
  const mode = String(format || "json").toLowerCase();
  if (mode === "json") {
    return {
      ok: true,
      format: mode,
      data: JSON.stringify(data == null ? null : data)
    };
  }
  return {
    ok: true,
    format: mode,
    data: String(data == null ? "" : data)
  };
}

module.exports = {
  lock,
  unlock,
  compact
};
