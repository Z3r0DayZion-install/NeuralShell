#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
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

function toAbs(root, relPath) {
  return path.isAbsolute(relPath) ? relPath : path.resolve(root, relPath);
}

function buildDecommissionChecklist(profile) {
  return [
    `Freeze ${profile.profileId} runtime policy and disable update apply.`,
    "Export support diagnostics and trust-chain snapshot.",
    "Revoke associated certificates and update CRL.",
    "Wipe storage using approved secure erase policy.",
    "Record retirement attestation and courier transfer hash.",
  ];
}

function buildProvisioningChecklist(profile) {
  return [
    "Apply sealed-network baseline policy profile.",
    "Bind appliance role and operator identity.",
    "Verify trust chain and update pack signature state.",
    "Run first-boot diagnostics and record hardware fingerprint.",
    `Confirm profile diagnostics scope: ${profile.supportDiagnostics.join(", ")}`,
  ];
}

function deterministicHash(value) {
  const crypto = require("crypto");
  return crypto.createHash("sha256").update(stableStringify(value)).digest("hex");
}

function main() {
  const root = process.cwd();
  const args = parseArgs(process.argv.slice(2));
  const profilePath = toAbs(root, String(args.profiles || "appliance/hardware/hardwareProfiles.json"));
  const outputRoot = toAbs(root, String(args["output-root"] || "release/hardware-appliance"));
  const generatedAt = String(args["generated-at"] || new Date().toISOString());
  const requestedProfiles = String(args.profileIds || "")
    .split(",")
    .map((entry) => String(entry || "").trim())
    .filter(Boolean);

  if (!fs.existsSync(profilePath)) {
    throw new Error(`Missing hardware profile catalog: ${profilePath}`);
  }

  const profiles = JSON.parse(fs.readFileSync(profilePath, "utf8"));
  const allProfiles = Array.isArray(profiles) ? profiles : [];
  const selected = requestedProfiles.length
    ? allProfiles.filter((entry) => requestedProfiles.includes(String(entry.profileId || "")))
    : allProfiles;
  if (selected.length < 3) {
    throw new Error("At least 3 appliance profiles are required for generation.");
  }

  const stamp = generatedAt.replace(/[:.]/g, "-");
  const outDir = path.join(outputRoot, `hardware-build-${stamp}`);
  fs.mkdirSync(outDir, { recursive: true });

  const generatedProfiles = [];
  selected.forEach((profile) => {
    const safe = profile && typeof profile === "object" ? profile : {};
    const profileId = String(safe.profileId || `profile-${generatedProfiles.length + 1}`);
    const profileDir = path.join(outDir, profileId);
    fs.mkdirSync(profileDir, { recursive: true });
    const buildManifest = {
      schema: "neuralshell_hardware_appliance_build_v1",
      generatedAt,
      profileId,
      title: String(safe.title || profileId),
      roleClass: String(safe.roleClass || "operator"),
      hardware: {
        cpu: String(safe.cpu || "x64_2c"),
        memoryGb: Number(safe.memoryGb || 8),
        storageGb: Number(safe.storageGb || 256),
        networkMode: String(safe.networkMode || "sealed_lan"),
      },
      provisioningChecklist: buildProvisioningChecklist(safe),
      supportDiagnostics: Array.isArray(safe.supportDiagnostics) ? safe.supportDiagnostics : [],
      decommissionChecklist: buildDecommissionChecklist(safe),
    };
    const supportBundleProfile = {
      schema: "neuralshell_appliance_support_profile_v1",
      profileId,
      diagnostics: buildManifest.supportDiagnostics,
      excludes: [
        "unrelated_fleet_nodes",
        "customer_chat_content",
        "external_provider_tokens",
      ],
    };
    writeJson(path.join(profileDir, "build_manifest.json"), buildManifest);
    writeJson(path.join(profileDir, "support_bundle_profile.json"), supportBundleProfile);
    writeJson(path.join(profileDir, "decommission_checklist.json"), {
      profileId,
      checklist: buildManifest.decommissionChecklist,
    });
    generatedProfiles.push({
      profileId,
      title: buildManifest.title,
      hash: deterministicHash(buildManifest),
    });
  });

  const reproducibilityDigest = deterministicHash({
    generatedAt: "normalized",
    profiles: generatedProfiles,
  });

  writeJson(path.join(outDir, "manifest.json"), {
    generatedAt,
    profileCount: generatedProfiles.length,
    profiles: generatedProfiles,
    reproducibilityDigest,
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
