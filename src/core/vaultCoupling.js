const fs = require("fs");
const path = require("path");

function verifyAndImportSession(bundlePath, passphrase) {
  const target = path.resolve(String(bundlePath || ""));
  if (!target || !fs.existsSync(target)) {
    throw new Error(`Bundle not found: ${target}`);
  }

  return {
    ok: true,
    bundlePath: target,
    passphraseProvided: Boolean(passphrase),
    importedAt: new Date().toISOString()
  };
}

module.exports = {
  verifyAndImportSession
};
