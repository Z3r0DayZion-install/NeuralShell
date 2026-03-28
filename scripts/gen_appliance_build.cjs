#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { writeJson } = require("./lib/signed_artifacts.cjs");

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = String(argv[i] || "").trim();
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next && !String(next).startsWith("--")) {
      out[key] = next;
      i += 1;
    } else {
      out[key] = "1";
    }
  }
  return out;
}

function toAbs(root, rel) {
  return path.isAbsolute(rel) ? rel : path.resolve(root, rel);
}

function writeText(filePath, text) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${String(text || "").trim()}\n`, "utf8");
}

function main() {
  const root = process.cwd();
  const args = parseArgs(process.argv.slice(2));
  const configPath = toAbs(root, String(args.config || "config/appliance_mode.json"));
  const outputRoot = toAbs(root, String(args["output-root"] || "release/appliance-build"));

  if (!fs.existsSync(configPath)) {
    throw new Error(`Missing appliance config: ${configPath}`);
  }
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  const profileId = String(config && config.profileId ? config.profileId : "appliance-profile");
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outDir = path.join(outputRoot, `${profileId}-${stamp}`);
  fs.mkdirSync(outDir, { recursive: true });

  const runtimeProfile = {
    schema: "neuralshell_appliance_runtime_v1",
    generatedAt: new Date().toISOString(),
    sourceConfig: path.relative(root, configPath),
    profileId,
    displayName: String(config && config.displayName ? config.displayName : "Appliance Mode"),
    defaults: config && config.generatedDefaults && typeof config.generatedDefaults === "object"
      ? config.generatedDefaults
      : {},
    allowedModules: Array.isArray(config && config.allowedModules) ? config.allowedModules : [],
  };

  writeJson(path.join(outDir, "config", "appliance.runtime.json"), runtimeProfile);
  writeJson(path.join(outDir, "manifest.json"), {
    generatedAt: new Date().toISOString(),
    profileId,
    files: [
      "config/appliance.runtime.json",
      "proof/appliance_profile_proof.json",
      "README.md",
      "manifest.json",
    ],
  });
  writeJson(path.join(outDir, "proof", "appliance_profile_proof.json"), {
    event: "appliance_profile_generated",
    at: new Date().toISOString(),
    profileId,
    allowedModules: runtimeProfile.allowedModules,
    defaults: runtimeProfile.defaults,
  });

  writeText(
    path.join(outDir, "README.md"),
    [
      `# Appliance Build Artifact: ${runtimeProfile.displayName}`,
      "",
      `- Profile ID: ${profileId}`,
      `- Generated: ${runtimeProfile.generatedAt}`,
      "- This profile constrains runtime behavior for relay/control appliance deployments.",
      "",
      "## Included",
      "1. `config/appliance.runtime.json`",
      "2. `proof/appliance_profile_proof.json`",
      "3. `manifest.json`",
    ].join("\n"),
  );

  process.stdout.write(`${outDir}\n`);
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    process.stderr.write(`${err && err.message ? err.message : String(err)}\n`);
    process.exit(1);
  }
}