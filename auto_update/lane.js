const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function sha256File(filePath) {
  const hash = crypto.createHash('sha256');
  const data = fs.readFileSync(filePath);
  hash.update(data);
  return hash.digest('hex');
}

function parseLatestYml(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = String(line || '').trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf(':');
    if (idx <= 0) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
    out[key] = value;
  }
  return out;
}

function resolveMaybePath(rawPath, baseDir) {
  const safe = String(rawPath || '').trim();
  if (!safe) return '';
  if (path.isAbsolute(safe)) return safe;
  return path.resolve(baseDir || process.cwd(), safe);
}

function normalizeSignatureBase64(value) {
  return String(value || '').trim().replace(/\s+/g, '');
}

function normalizePublicKeyPem(value) {
  return String(value || '').trim();
}

function resolveSignatureMaterial(options = {}, latest = {}, baseDir = process.cwd()) {
  const signaturePath = resolveMaybePath(
    options.signaturePath || latest.signaturePath || latest.signatureFile || latest.signature_file,
    baseDir
  );
  const publicKeyPath = resolveMaybePath(
    options.publicKeyPath || latest.publicKeyPath || latest.publicKeyFile || latest.public_key_file,
    baseDir
  );

  const signatureBase64 = normalizeSignatureBase64(
    options.signatureBase64
      || options.signature
      || latest.signatureBase64
      || latest.signature_base64
      || latest.signature
      || (signaturePath && fs.existsSync(signaturePath) ? fs.readFileSync(signaturePath, 'utf8') : '')
  );

  const publicKeyPem = normalizePublicKeyPem(
    options.publicKeyPem
      || options.publicKey
      || latest.publicKeyPem
      || latest.public_key
      || latest.publicKey
      || (publicKeyPath && fs.existsSync(publicKeyPath) ? fs.readFileSync(publicKeyPath, 'utf8') : '')
  );

  const algorithm = String(options.algorithm || latest.signatureAlgorithm || 'ed25519').trim().toLowerCase() || 'ed25519';

  return {
    algorithm,
    signatureBase64,
    signaturePath,
    publicKeyPem,
    publicKeyPath
  };
}

function verifySignatureForHash(sha256Hex, material) {
  assert(material && typeof material === 'object', 'Signature material is required.');
  assert(material.algorithm === 'ed25519', `Unsupported signature algorithm: ${material.algorithm}`);
  assert(material.signatureBase64, 'Missing update signature payload.');
  assert(material.publicKeyPem, 'Missing update public key.');

  const signature = Buffer.from(material.signatureBase64, 'base64');
  assert(signature.length > 0, 'Update signature payload is invalid.');

  const verified = crypto.verify(
    null,
    Buffer.from(String(sha256Hex || '').trim().toLowerCase(), 'utf8'),
    material.publicKeyPem,
    signature
  );
  assert(verified, 'Update signature verification failed.');

  return {
    ok: true,
    algorithm: material.algorithm,
    signaturePath: material.signaturePath || '',
    publicKeyPath: material.publicKeyPath || ''
  };
}

function createAutoUpdateLane(options = {}) {
  const userDataPath = String(options.userDataPath || '').trim() || path.join(process.cwd(), 'state');
  const laneRoot = path.join(userDataPath, 'auto_update');
  const stagedDir = path.join(laneRoot, 'staged');
  const policyPath = path.join(laneRoot, 'policy.json');
  const pendingPath = path.join(laneRoot, 'pending_swap.json');
  const logger = options.logger && typeof options.logger.log === 'function' ? options.logger : null;

  function log(level, message, meta) {
    if (!logger) return;
    logger.log(level, message, meta || {});
  }

  function defaultPolicy() {
    return {
      enabled: false,
      channel: 'stable',
      lastCheckedAt: '',
      lastScheduledAt: '',
      lastAppliedAt: ''
    };
  }

  function getPolicy() {
    const current = readJson(policyPath, defaultPolicy());
    return {
      ...defaultPolicy(),
      ...(current && typeof current === 'object' ? current : {})
    };
  }

  function setPolicy(patch = {}) {
    const current = getPolicy();
    const next = {
      ...current,
      enabled: patch.enabled == null ? current.enabled : Boolean(patch.enabled),
      channel: patch.channel == null ? current.channel : String(patch.channel || 'stable')
    };
    writeJson(policyPath, next);
    return next;
  }

  function verifyPackageHash(filePath, expectedSha256) {
    const resolved = path.resolve(String(filePath || ''));
    assert(fs.existsSync(resolved), `Update package not found: ${resolved}`);
    const actualSha256 = sha256File(resolved);
    const expected = String(expectedSha256 || '').trim().toLowerCase();
    assert(expected.length === 64, 'Expected sha256 must be a 64-char hex digest.');
    assert(actualSha256 === expected, `Update sha256 mismatch (expected ${expected}, got ${actualSha256}).`);
    return {
      ok: true,
      filePath: resolved,
      sha256: actualSha256,
      sizeBytes: fs.statSync(resolved).size
    };
  }

  function verifyPackageSignature(params = {}) {
    const packagePath = path.resolve(String(params.packagePath || ''));
    const expectedSha256 = String(params.expectedSha256 || '').trim().toLowerCase();
    const baseDir = String(params.baseDir || path.dirname(packagePath));

    const hashReport = verifyPackageHash(packagePath, expectedSha256);
    const material = resolveSignatureMaterial(params, {}, baseDir);
    const signature = verifySignatureForHash(hashReport.sha256, material);

    return {
      ok: true,
      packagePath,
      hash: hashReport,
      signature
    };
  }

  function verifyLatestYmlAndPackage(latestYmlPath, packagePath, expectedSha256OrOptions) {
    const ymlPath = path.resolve(String(latestYmlPath || ''));
    const latestDir = path.dirname(ymlPath);

    let options = {};
    if (expectedSha256OrOptions && typeof expectedSha256OrOptions === 'object' && !Array.isArray(expectedSha256OrOptions)) {
      options = expectedSha256OrOptions;
    } else {
      options = { expectedSha256: expectedSha256OrOptions };
    }

    assert(fs.existsSync(ymlPath), `latest.yml not found: ${ymlPath}`);

    const latest = parseLatestYml(ymlPath);
    const resolvedPackagePath = String(packagePath || '').trim()
      ? path.resolve(String(packagePath || ''))
      : resolveMaybePath(latest.path || latest.file || '', latestDir);

    assert(resolvedPackagePath, 'Update package path is required.');
    assert(fs.existsSync(resolvedPackagePath), `Update package not found: ${resolvedPackagePath}`);

    const expectedSha256 = String(
      options.expectedSha256
      || latest.sha256
      || latest.SHA256
      || ''
    ).trim().toLowerCase();

    const hashReport = verifyPackageHash(resolvedPackagePath, expectedSha256);
    const material = resolveSignatureMaterial(options, latest, latestDir);
    const signature = verifySignatureForHash(hashReport.sha256, material);

    return {
      ok: true,
      latestYmlPath: ymlPath,
      packagePath: resolvedPackagePath,
      latest,
      hash: hashReport,
      signature
    };
  }

  function scheduleSwapOnRestart(params = {}) {
    const packagePath = path.resolve(String(params.packagePath || ''));
    const expectedSha256 = String(params.expectedSha256 || '').trim().toLowerCase();
    const targetPath = path.resolve(String(params.targetPath || ''));
    const requireSignature = params.requireSignature == null ? true : Boolean(params.requireSignature);

    assert(packagePath, 'packagePath is required.');
    assert(targetPath, 'targetPath is required.');

    const hashReport = verifyPackageHash(packagePath, expectedSha256);

    let signature = {
      ok: false,
      skipped: true,
      reason: 'signature_verification_disabled'
    };

    if (requireSignature) {
      const material = resolveSignatureMaterial(params, {}, path.dirname(packagePath));
      signature = verifySignatureForHash(hashReport.sha256, material);
    }

    fs.mkdirSync(stagedDir, { recursive: true });
    const stagedFileName = `${Date.now()}-${path.basename(packagePath)}`;
    const stagedPath = path.join(stagedDir, stagedFileName);
    fs.copyFileSync(packagePath, stagedPath);

    const marker = {
      createdAt: new Date().toISOString(),
      stagedPath,
      targetPath,
      expectedSha256: hashReport.sha256,
      signatureRequired: requireSignature,
      signature
    };
    writeJson(pendingPath, marker);

    const currentPolicy = getPolicy();
    writeJson(policyPath, {
      ...currentPolicy,
      lastScheduledAt: marker.createdAt
    });

    log('info', 'auto update swap scheduled', marker);

    return {
      ok: true,
      markerPath: pendingPath,
      marker,
      hash: hashReport,
      signature
    };
  }

  function pendingSwapStatus() {
    const marker = readJson(pendingPath, null);
    if (!marker || typeof marker !== 'object') {
      return { pending: false };
    }
    const stagedPath = String(marker.stagedPath || '').trim();
    const targetPath = String(marker.targetPath || '').trim();
    return {
      pending: true,
      marker,
      stagedExists: Boolean(stagedPath && fs.existsSync(stagedPath)),
      targetExists: Boolean(targetPath && fs.existsSync(targetPath))
    };
  }

  function applyPendingSwap() {
    const marker = readJson(pendingPath, null);
    if (!marker || typeof marker !== 'object') {
      return {
        ok: true,
        applied: false,
        reason: 'no_pending_swap'
      };
    }

    const stagedPath = path.resolve(String(marker.stagedPath || ''));
    const targetPath = path.resolve(String(marker.targetPath || ''));
    const expectedSha256 = String(marker.expectedSha256 || '').trim().toLowerCase();

    assert(fs.existsSync(stagedPath), `Staged update file missing: ${stagedPath}`);
    assert(fs.existsSync(targetPath), `Swap target missing: ${targetPath}`);

    const stagedSha = sha256File(stagedPath);
    assert(stagedSha === expectedSha256, `Staged update sha256 mismatch (expected ${expectedSha256}, got ${stagedSha}).`);

    const backupPath = `${targetPath}.bak`;
    fs.copyFileSync(targetPath, backupPath);

    try {
      fs.copyFileSync(stagedPath, targetPath);
      if (fs.existsSync(pendingPath)) fs.unlinkSync(pendingPath);
      if (fs.existsSync(stagedPath)) fs.unlinkSync(stagedPath);

      const currentPolicy = getPolicy();
      writeJson(policyPath, {
        ...currentPolicy,
        lastAppliedAt: new Date().toISOString()
      });

      log('info', 'auto update swap applied', {
        targetPath,
        stagedPath,
        sha256: stagedSha
      });

      return {
        ok: true,
        applied: true,
        targetPath,
        sha256: stagedSha
      };
    } catch (err) {
      if (fs.existsSync(backupPath)) {
        try {
          fs.copyFileSync(backupPath, targetPath);
        } catch {
          // ignore rollback failure
        }
      }
      throw err;
    } finally {
      if (fs.existsSync(backupPath)) {
        try {
          fs.unlinkSync(backupPath);
        } catch {
          // ignore
        }
      }
    }
  }

  return {
    laneRoot,
    policyPath,
    pendingPath,
    stagedDir,
    getPolicy,
    setPolicy,
    verifyPackageHash,
    verifyPackageSignature,
    verifyLatestYmlAndPackage,
    scheduleSwapOnRestart,
    pendingSwapStatus,
    applyPendingSwap,
    sha256File,
    parseLatestYml
  };
}

module.exports = {
  createAutoUpdateLane,
  sha256File,
  parseLatestYml
};