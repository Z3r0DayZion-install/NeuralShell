#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { writeJson } = require("./lib/signed_artifacts.cjs");

function parseArgs(argv) {
  const out = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = String(argv[index] || "").trim();
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[index + 1];
    if (next && !String(next).startsWith("--")) {
      out[key] = next;
      index += 1;
    } else {
      out[key] = "1";
    }
  }
  return out;
}

function toAbs(root, inputPath) {
  return path.isAbsolute(inputPath) ? inputPath : path.resolve(root, inputPath);
}

function main() {
  const root = process.cwd();
  const args = parseArgs(process.argv.slice(2));
  const profileCatalogPath = toAbs(root, String(args.profiles || "demo/demoProfiles.json"));
  const outputRoot = toAbs(root, String(args["output-root"] || "release/demo-reset"));
  const generatedAt = String(args["generated-at"] || new Date().toISOString());
  const requestedProfile = String(args.profile || "").trim();

  if (!fs.existsSync(profileCatalogPath)) {
    throw new Error(`Missing demo profile catalog: ${profileCatalogPath}`);
  }

  const profiles = JSON.parse(fs.readFileSync(profileCatalogPath, "utf8"));
  const profileList = Array.isArray(profiles) ? profiles : [];
  if (!profileList.length) throw new Error("No demo profiles available.");

  const profile = requestedProfile
    ? profileList.find((entry) => String(entry && entry.profileId ? entry.profileId : "") === requestedProfile)
    : profileList[0];
  if (!profile) throw new Error(`Requested demo profile not found: ${requestedProfile}`);

  const resetPayload = {
    generatedAt,
    profileId: String(profile.profileId || ""),
    clearKeys: Array.isArray(profile.resetKeys) ? profile.resetKeys : [],
    applySeedState: profile.seedLocalStorage && typeof profile.seedLocalStorage === "object"
      ? profile.seedLocalStorage
      : {},
    notes: [
      "Apply clearKeys first to prevent stale presenter state.",
      "Then apply seeded state map in a single transaction.",
      "Confirm demo mode badge and air-gap posture before presenting.",
    ],
  };

  const stamp = generatedAt.replace(/[:.]/g, "-");
  const outDir = path.join(outputRoot, `demo-reset-${String(profile.profileId || "profile")}-${stamp}`);
  fs.mkdirSync(outDir, { recursive: true });

  writeJson(path.join(outDir, "demo_reset_plan.json"), resetPayload);
  writeJson(path.join(outDir, "manifest.json"), {
    generatedAt,
    profileId: resetPayload.profileId,
    files: ["demo_reset_plan.json", "manifest.json"],
  });

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
