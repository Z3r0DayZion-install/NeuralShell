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
  const tracksPath = toAbs(root, String(args.tracks || "training/delivery/trainingTracks.json"));
  const outRoot = toAbs(root, String(args["output-root"] || "release/training-bundles"));
  const generatedAt = String(args["generated-at"] || new Date().toISOString());

  if (!fs.existsSync(tracksPath)) {
    throw new Error(`Missing training track catalog: ${tracksPath}`);
  }
  const parsed = JSON.parse(fs.readFileSync(tracksPath, "utf8"));
  const tracks = Array.isArray(parsed && parsed.tracks) ? parsed.tracks : [];
  const labs = Array.isArray(parsed && parsed.labs) ? parsed.labs : [];
  if (!tracks.length) throw new Error("Training bundle requires at least one track.");

  const stamp = generatedAt.replace(/[:.]/g, "-");
  const outDir = path.join(outRoot, `training-${stamp}`);
  fs.mkdirSync(outDir, { recursive: true });

  tracks.forEach((track) => {
    const trackId = String(track && track.trackId ? track.trackId : "track");
    const safeModules = Array.isArray(track && track.modules) ? track.modules : [];
    const trackDir = path.join(outDir, trackId);
    fs.mkdirSync(trackDir, { recursive: true });
    writeJson(path.join(trackDir, "track_manifest.json"), {
      generatedAt,
      trackId,
      title: String(track.title || trackId),
      durationMinutes: Number(track.durationMinutes || 120),
      modules: safeModules,
      offlineReady: true,
    });
    fs.writeFileSync(
      path.join(trackDir, "learner_workbook.md"),
      [
        `# ${String(track.title || trackId)} Workbook`,
        "",
        `Duration: ${Number(track.durationMinutes || 120)} minutes`,
        "",
        ...safeModules.map((entry, index) => `${index + 1}. ${String(entry)}`),
        "",
        "Lab evidence capture:",
        "- Record operator actions and outcomes.",
        "- Export evidence bundle at completion.",
      ].join("\n"),
      "utf8"
    );
  });

  writeJson(path.join(outDir, "scenario_labs.json"), {
    generatedAt,
    labs,
    guidance: "Run labs using demo profile seeded data for deterministic outcomes.",
  });
  writeJson(path.join(outDir, "exam_export_manifest.json"), {
    generatedAt,
    sessionExportSchema: "neuralshell_training_exam_session_v1",
    certificateVerification: "Use signed artifact verification path with public key fingerprint checks.",
  });
  writeJson(path.join(outDir, "manifest.json"), {
    generatedAt,
    trackCount: tracks.length,
    labCount: labs.length,
    offlineReady: true,
    files: fs.readdirSync(outDir).sort(),
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
