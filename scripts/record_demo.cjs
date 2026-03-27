const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const SOURCE_VIDEO = path.join(ROOT, "release", "proof-video-walkthrough.webm");
const TARGETS = [
  path.join(ROOT, "static", "video", "proof_walkthrough.webm"),
  path.join(ROOT, "docs", "static", "video", "proof_walkthrough.webm"),
];
const GIF_TARGETS = [
  path.join(ROOT, "static", "video", "proof_walkthrough.gif"),
  path.join(ROOT, "docs", "static", "video", "proof_walkthrough.gif"),
];

function runRecorder() {
  const recorder = path.join(ROOT, "scripts", "record_walkthrough_video.js");
  const result = spawnSync(process.execPath, [recorder], {
    cwd: ROOT,
    stdio: "inherit",
  });
  if (result.status !== 0) {
    throw new Error(`record_walkthrough_video.js failed with exit code ${result.status}`);
  }
}

function copyVideo() {
  if (!fs.existsSync(SOURCE_VIDEO)) {
    throw new Error(`Walkthrough video missing: ${SOURCE_VIDEO}`);
  }
  const copied = [];
  for (const targetPath of TARGETS) {
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.copyFileSync(SOURCE_VIDEO, targetPath);
    copied.push(path.relative(ROOT, targetPath).replace(/\\/g, "/"));
  }
  return copied;
}

function createGif(sourceVideoPath) {
  const ffmpegProbe = spawnSync("ffmpeg", ["-version"], { cwd: ROOT, stdio: "ignore" });
  if (ffmpegProbe.status !== 0) {
    throw new Error("ffmpeg is required for --gif mode but was not found in PATH.");
  }

  const primaryGif = GIF_TARGETS[0];
  fs.mkdirSync(path.dirname(primaryGif), { recursive: true });

  const ffmpegArgs = [
    "-y",
    "-i",
    sourceVideoPath,
    "-vf",
    "fps=12,scale=960:-1:flags=lanczos",
    "-loop",
    "0",
    primaryGif,
  ];
  const result = spawnSync("ffmpeg", ffmpegArgs, {
    cwd: ROOT,
    stdio: "inherit",
  });
  if (result.status !== 0) {
    throw new Error(`ffmpeg GIF conversion failed with exit code ${result.status}`);
  }

  const copied = [];
  for (const targetPath of GIF_TARGETS) {
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    if (path.resolve(targetPath) !== path.resolve(primaryGif)) {
      fs.copyFileSync(primaryGif, targetPath);
    }
    copied.push(path.relative(ROOT, targetPath).replace(/\\/g, "/"));
  }
  return copied;
}

function run() {
  const args = new Set(process.argv.slice(2));
  const skipRecord = args.has("--skip-record");
  const generateGif = args.has("--gif");
  if (!skipRecord) {
    runRecorder();
  }
  const copied = copyVideo();
  const gifTargets = generateGif ? createGif(SOURCE_VIDEO) : [];
  console.log(
    JSON.stringify(
      {
        ok: true,
        source: path.relative(ROOT, SOURCE_VIDEO).replace(/\\/g, "/"),
        targets: copied,
        gifTargets,
      },
      null,
      2
    )
  );
}

run();
