#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { writeJson, stableStringify } = require("./lib/signed_artifacts.cjs");

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

function hashStable(value) {
  return crypto.createHash("sha256").update(stableStringify(value)).digest("hex");
}

function main() {
  const root = process.cwd();
  const args = parseArgs(process.argv.slice(2));
  const profileCatalogPath = toAbs(root, String(args.profiles || "demo/demoProfiles.json"));
  const outputRoot = toAbs(root, String(args["output-root"] || "release/demo-bundles"));
  const packageJson = JSON.parse(fs.readFileSync(path.resolve(root, "package.json"), "utf8"));
  const version = String(args.version || packageJson.version || "0.0.0");
  const generatedAt = String(args["generated-at"] || new Date().toISOString());
  const requestedProfile = String(args.profile || "").trim();

  if (!fs.existsSync(profileCatalogPath)) {
    throw new Error(`Missing demo profile catalog: ${profileCatalogPath}`);
  }
  const profiles = JSON.parse(fs.readFileSync(profileCatalogPath, "utf8"));
  const profileList = Array.isArray(profiles) ? profiles : [];
  if (!profileList.length) {
    throw new Error("No demo profiles available.");
  }

  const profile = requestedProfile
    ? profileList.find((entry) => String(entry && entry.profileId ? entry.profileId : "") === requestedProfile)
    : profileList[0];
  if (!profile) {
    throw new Error(`Requested demo profile not found: ${requestedProfile}`);
  }

  const stamp = generatedAt.replace(/[:.]/g, "-");
  const outDir = path.join(outputRoot, `demo-${String(profile.profileId || "profile")}-${stamp}`);
  fs.mkdirSync(outDir, { recursive: true });

  const payload = {
    schema: "neuralshell_demo_bundle_v1",
    generatedAt,
    version,
    profileId: String(profile.profileId || ""),
    title: String(profile.title || "Demo Profile"),
    description: String(profile.description || ""),
    presenterFlow: Array.isArray(profile.presenterFlow) ? profile.presenterFlow : [],
    seedLocalStorage: profile.seedLocalStorage && typeof profile.seedLocalStorage === "object"
      ? profile.seedLocalStorage
      : {},
    resetKeys: Array.isArray(profile.resetKeys) ? profile.resetKeys : [],
    safeMode: {
      demoModeEnabled: true,
      disableLiveCustomerState: true,
      allowOutboundNetwork: false,
      resetSupported: true,
    },
  };

  const reproducibilityDigest = hashStable({
    ...payload,
    generatedAt: "normalized",
  });

  const manifest = {
    generatedAt,
    version,
    profileId: payload.profileId,
    reproducibilityDigest,
    files: ["demo_bundle.json", "manifest.json", "PRESENTER_FLOW.md"],
  };

  writeJson(path.join(outDir, "demo_bundle.json"), {
    ...payload,
    reproducibilityDigest,
  });
  writeJson(path.join(outDir, "manifest.json"), manifest);
  fs.writeFileSync(
    path.join(outDir, "PRESENTER_FLOW.md"),
    [
      `# Demo Flow: ${payload.title}`,
      "",
      `Generated: ${generatedAt}`,
      "",
      ...payload.presenterFlow.map((step, index) => (
        `${index + 1}. **${String(step.title || step.panelId || "Step")}** (${String(step.panelId || "")})\n   - ${String(step.talkTrack || "")}`
      )),
      "",
      "Reset guidance:",
      "- Enable demo mode badge before presentation.",
      "- Apply seeded profile state.",
      "- Run reset after presentation handoff.",
      "",
    ].join("\n"),
    "utf8"
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
