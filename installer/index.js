#!/usr/bin/env node

const fs = require("fs");
const os = require("os");
const path = require("path");
const https = require("https");
const crypto = require("crypto");
const { spawnSync } = require("child_process");

const DEFAULT_REPO = "Z3r0DayZion-install/NeuralShell";

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = String(argv[i] || "");
    if (!token.startsWith("--")) continue;
    const eq = token.indexOf("=");
    if (eq > -1) {
      out[token.slice(2, eq)] = token.slice(eq + 1);
      continue;
    }
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next && !String(next).startsWith("--")) {
      out[key] = String(next);
      i += 1;
    } else {
      out[key] = "true";
    }
  }
  return out;
}

function requestJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      {
        method: "GET",
        headers: {
          "User-Agent": "neuralshell-installer",
          Accept: "application/vnd.github+json",
        },
      },
      (res) => {
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode} from ${url}`));
            return;
          }
          try {
            resolve(JSON.parse(body));
          } catch (error) {
            reject(new Error(`Failed to parse JSON from ${url}: ${error.message}`));
          }
        });
      }
    );
    req.on("error", reject);
    req.end();
  });
}

function downloadFile(url, destinationPath) {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
    const file = fs.createWriteStream(destinationPath);
    const req = https.request(
      url,
      {
        method: "GET",
        headers: {
          "User-Agent": "neuralshell-installer",
          Accept: "application/octet-stream",
        },
      },
      (res) => {
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode} downloading ${url}`));
          return;
        }
        res.pipe(file);
        file.on("finish", () => {
          file.close(() => resolve(destinationPath));
        });
      }
    );
    req.on("error", (error) => {
      reject(error);
    });
    req.end();
  });
}

function sha256File(filePath) {
  const hash = crypto.createHash("sha256");
  const data = fs.readFileSync(filePath);
  hash.update(data);
  return hash.digest("hex");
}

function parseChecksums(text) {
  const out = [];
  const lines = String(text || "").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = String(line || "").trim();
    if (!trimmed) continue;

    const ps = trimmed.match(/^@\{Hash=([A-Fa-f0-9]{64});\s*Path=(.+)\}$/);
    if (ps) {
      out.push({
        sha256: ps[1].toLowerCase(),
        path: String(ps[2] || "").trim().replace(/\\/g, "/"),
      });
      continue;
    }

    const std = trimmed.match(/^([A-Fa-f0-9]{64})\s+(.+)$/);
    if (std) {
      out.push({
        sha256: std[1].toLowerCase(),
        path: String(std[2] || "").trim().replace(/\\/g, "/"),
      });
    }
  }
  return out;
}

function selectAssetByPlatform(assets, platform) {
  const byName = (regex) => assets.find((asset) => regex.test(String(asset.name || "")));
  if (platform === "win32") {
    return (
      byName(/win.*\.zip$/i)
      || byName(/windows.*\.zip$/i)
      || byName(/portable.*\.zip$/i)
      || byName(/^NeuralShell[ ._-]?Setup[ ._-].+\.exe$/i)
      || byName(/\.exe$/i)
    );
  }
  if (platform === "darwin") {
    return byName(/mac.*\.zip$/i) || byName(/\.dmg$/i) || byName(/darwin.*\.zip$/i);
  }
  return byName(/linux.*\.zip$/i) || byName(/\.AppImage$/i);
}

function selectManifestAsset(assets) {
  return (
    assets.find((asset) => /^checksums\.txt$/i.test(String(asset.name || "")))
    || assets.find((asset) => /^SHA256SUMS\.txt$/i.test(String(asset.name || "")))
  );
}

function resolveInstallDir(overrides) {
  if (overrides) return path.resolve(overrides);
  if (process.platform === "win32") {
    const programFiles = process.env.ProgramFiles || "C:\\Program Files";
    const preferred = path.join(programFiles, "NeuralShell");
    try {
      fs.mkdirSync(preferred, { recursive: true });
      return preferred;
    } catch {
      return path.join(os.homedir(), "Applications", "NeuralShell");
    }
  }
  return path.join(os.homedir(), "Applications", "NeuralShell");
}

function runExtract(archivePath, installDir) {
  fs.mkdirSync(installDir, { recursive: true });
  if (/\.zip$/i.test(archivePath)) {
    if (process.platform === "win32") {
      const command = `Expand-Archive -Path "${archivePath}" -DestinationPath "${installDir}" -Force`;
      const result = spawnSync("powershell", ["-NoProfile", "-Command", command], { stdio: "inherit" });
      if (result.status !== 0) {
        throw new Error(`Expand-Archive failed with exit code ${result.status}`);
      }
      return;
    }

    const unzipResult = spawnSync("unzip", ["-o", archivePath, "-d", installDir], { stdio: "inherit" });
    if (unzipResult.status === 0) return;

    const tarResult = spawnSync("tar", ["-xf", archivePath, "-C", installDir], { stdio: "inherit" });
    if (tarResult.status !== 0) {
      throw new Error(`Failed to extract archive (unzip:${unzipResult.status} tar:${tarResult.status})`);
    }
    return;
  }

  const targetName = path.basename(archivePath);
  fs.copyFileSync(archivePath, path.join(installDir, targetName));
}

function writeRuntimeMode(installDir, licenseKey) {
  const mode = licenseKey ? "operator" : "auditor";
  const lines = [`LICENSE_MODE=${mode}`];
  if (licenseKey) {
    lines.push(`NEURALSHELL_LICENSE_KEY=${String(licenseKey).trim()}`);
  }
  const envPath = path.join(installDir, "NeuralShell.runtime.env");
  fs.writeFileSync(envPath, `${lines.join("\n")}\n`, "utf8");
  return { mode, envPath };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const repo = String(args.repo || DEFAULT_REPO).trim();
  const releaseUrl = `https://api.github.com/repos/${repo}/releases/latest`;

  console.log(`[installer] Resolving latest release from ${repo}...`);
  const release = await requestJson(releaseUrl);
  const assets = Array.isArray(release.assets) ? release.assets : [];
  if (!assets.length) {
    throw new Error("Release has no assets.");
  }

  const appAsset = selectAssetByPlatform(assets, process.platform);
  if (!appAsset) {
    throw new Error(`No installable asset found for platform ${process.platform}.`);
  }
  const checksumAsset = selectManifestAsset(assets);
  if (!checksumAsset) {
    throw new Error("No checksums asset found in release (checksums.txt or SHA256SUMS.txt).");
  }

  console.log(`[installer] Selected asset: ${appAsset.name}`);
  console.log(`[installer] Selected checksum manifest: ${checksumAsset.name}`);

  if (args["dry-run"] === "true") {
    console.log(
      JSON.stringify(
        {
          ok: true,
          dryRun: true,
          release: release.tag_name,
          asset: appAsset.name,
          checksumManifest: checksumAsset.name,
        },
        null,
        2
      )
    );
    return;
  }

  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "neuralshell-installer-"));
  const assetPath = path.join(tempRoot, appAsset.name);
  const checksumPath = path.join(tempRoot, checksumAsset.name);

  console.log("[installer] Downloading release asset...");
  await downloadFile(appAsset.browser_download_url, assetPath);
  console.log("[installer] Downloading checksum manifest...");
  await downloadFile(checksumAsset.browser_download_url, checksumPath);

  const checksumText = fs.readFileSync(checksumPath, "utf8");
  const checksumEntries = parseChecksums(checksumText);
  const expected = checksumEntries.find((entry) => path.basename(entry.path).toLowerCase() === appAsset.name.toLowerCase());
  if (!expected) {
    throw new Error(`Checksum entry for ${appAsset.name} not found in ${checksumAsset.name}.`);
  }

  const actual = sha256File(assetPath);
  if (actual.toLowerCase() !== expected.sha256.toLowerCase()) {
    throw new Error(`SHA-256 mismatch for ${appAsset.name}: expected ${expected.sha256}, got ${actual}`);
  }
  console.log("[installer] SHA-256 verification passed.");

  const installDir = resolveInstallDir(args["install-dir"]);
  console.log(`[installer] Installing to ${installDir}...`);
  runExtract(assetPath, installDir);

  const licenseKey = String(args["license-key"] || process.env.NEURALSHELL_LICENSE_KEY || "").trim();
  const modeResult = writeRuntimeMode(installDir, licenseKey);

  console.log(
    JSON.stringify(
      {
        ok: true,
        release: release.tag_name,
        asset: appAsset.name,
        installDir,
        runtimeMode: modeResult.mode,
        runtimeEnv: modeResult.envPath,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(`[installer] ${error && error.message ? error.message : String(error)}`);
  process.exit(1);
});
