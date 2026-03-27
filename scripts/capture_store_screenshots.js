const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { PNG } = require("pngjs");
const { _electron: electron } = require("playwright");

const repoRoot = path.resolve(__dirname, "..");
const outputDir = path.join(
  repoRoot,
  "release",
  "store-assets",
  "microsoft-store",
  "v1.2.1-OMEGA"
);
const viewport = { width: 1440, height: 900 };

const screenshotPlan = [
  {
    filename: "01-onboarding-safe-defaults.png",
    title: "Quickstart safe defaults",
    caption: "React shell loaded with local-first defaults and integrity status visible."
  },
  {
    filename: "02-main-workspace.png",
    title: "Main workspace",
    caption: "Active workflow with command execution and visible chat history."
  },
  {
    filename: "03-session-management.png",
    title: "Session management",
    caption: "Multiple sessions with lock state and switching controls in the thread rail."
  },
  {
    filename: "04-settings-and-profiles.png",
    title: "Settings and profiles",
    caption: "Settings drawer open with provider and profile controls."
  },
  {
    filename: "05-runtime-and-integrity.png",
    title: "Runtime and integrity",
    caption: "Operational shell with telemetry and integrity-oriented runtime feedback."
  },
  {
    filename: "06-command-palette.png",
    title: "Command palette",
    caption: "Keyboard-driven command palette surface over the active workspace."
  }
];

const sessionPassphrase = "StoreCapturePassphrase1!";

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function mkUserDataDir(label) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `neuralshell-store-${label}-`));
}

function rmUserDataDir(dir) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {
    // Ignore local cleanup failures.
  }
}

function readPngDimensions(filePath) {
  const image = PNG.sync.read(fs.readFileSync(filePath));
  return {
    width: image.width,
    height: image.height
  };
}

async function waitForTestId(page, testId, timeout = 20000) {
  await page.getByTestId(testId).first().waitFor({ state: "visible", timeout });
}

async function launchApp(userDataDir) {
  const app = await electron.launch({
    args: ["."],
    cwd: repoRoot,
    env: {
      ...process.env,
      NEURAL_USER_DATA_DIR: userDataDir,
      NEURAL_IGNORE_INTEGRITY: "1"
    }
  });
  const page = await app.firstWindow();
  await waitForTestId(page, "top-status-bar");
  await waitForTestId(page, "workspace-panel");
  await page.setViewportSize(viewport);
  await app.evaluate(({ BrowserWindow }, bounds) => {
    const win = BrowserWindow.getAllWindows()[0];
    if (!win) return false;
    win.setContentSize(bounds.width, bounds.height);
    win.center();
    return true;
  }, viewport);
  await wait(300);
  return { app, page };
}

async function submitCreateSession(page, name, passphrase) {
  await page.getByTestId("new-thread-btn").click();
  await waitForTestId(page, "session-modal");
  await page.getByTestId("session-modal-name-input").fill(name);
  await page.getByTestId("session-modal-pass-input").fill(passphrase);
  await page.getByTestId("session-modal-submit-btn").click();
  await page.waitForTimeout(700);
  const modalVisible = await page.getByTestId("session-modal").isVisible().catch(() => false);
  if (modalVisible) {
    const maybeError = await page.getByTestId("session-modal-error").textContent().catch(() => "");
    throw new Error(`Create session modal remained open: ${maybeError || "unknown error"}`);
  }
}

async function sendSlashCommand(page, command) {
  await page.getByTestId("chat-input").fill(command);
  await page.getByRole("button", { name: "Execute Command" }).click();
  await page.waitForTimeout(1200);
}

async function captureViewport(page, filename) {
  const filePath = path.join(outputDir, filename);
  await page.screenshot({ path: filePath });
  return filePath;
}

async function captureShots(page) {
  const artifacts = [];

  await page.evaluate(() => globalThis.scrollTo(0, 0));
  await wait(200);
  artifacts.push(await captureViewport(page, screenshotPlan[0].filename));

  await submitCreateSession(page, "Release_Audit", sessionPassphrase);
  await sendSlashCommand(page, "/help");
  await page.evaluate(() => globalThis.scrollTo(0, 0));
  artifacts.push(await captureViewport(page, screenshotPlan[1].filename));

  await submitCreateSession(page, "Offline_RedTeam", sessionPassphrase);
  await sendSlashCommand(page, "/guard");
  await page.getByTestId("session-item-Release_Audit").click();
  await page.waitForTimeout(900);
  await page.getByTestId("lock-active-session-btn").click();
  await page.waitForTimeout(600);
  await page.getByTestId("session-item-Offline_RedTeam").click();
  await page.waitForTimeout(900);
  artifacts.push(await captureViewport(page, screenshotPlan[2].filename));

  await page.getByTestId("settings-open-btn").click();
  await waitForTestId(page, "settings-drawer");
  await page.getByTestId("settings-provider-select").selectOption("ollama");
  await wait(250);
  artifacts.push(await captureViewport(page, screenshotPlan[3].filename));
  await page.getByTestId("settings-close-btn").click();
  await page.waitForTimeout(350);

  await sendSlashCommand(page, "/status");
  await page.evaluate(() => globalThis.scrollTo(0, 0));
  await wait(150);
  artifacts.push(await captureViewport(page, screenshotPlan[4].filename));

  await page.getByTestId("command-palette-btn").click();
  await waitForTestId(page, "command-palette");
  await wait(150);
  artifacts.push(await captureViewport(page, screenshotPlan[5].filename));
  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);

  return artifacts;
}

function writeManifest(files) {
  const shots = files.map((filePath, index) => {
    const dims = readPngDimensions(filePath);
    return {
      order: index + 1,
      ...screenshotPlan[index],
      relativePath: path.relative(repoRoot, filePath).replace(/\\/g, "/"),
      width: dims.width,
      height: dims.height
    };
  });

  const payload = {
    generatedAt: new Date().toISOString(),
    viewport,
    outputDir: path.relative(repoRoot, outputDir).replace(/\\/g, "/"),
    shots
  };

  fs.writeFileSync(
    path.join(outputDir, "manifest.json"),
    `${JSON.stringify(payload, null, 2)}\n`,
    "utf8"
  );

  const markdown = [
    "# Microsoft Store Screenshot Set",
    "",
    `Generated: \`${payload.generatedAt}\``,
    "",
    `Viewport: \`${viewport.width}x${viewport.height}\``,
    "",
    "## Files",
    "",
    ...shots.flatMap((shot) => [
      `### ${shot.order}. ${shot.title}`,
      "",
      `- File: \`${shot.relativePath}\``,
      `- Size: \`${shot.width}x${shot.height}\``,
      `- Caption: ${shot.caption}`,
      ""
    ])
  ].join("\n");

  fs.writeFileSync(
    path.join(outputDir, "README.md"),
    `${markdown}\n`,
    "utf8"
  );

  return payload;
}

async function main() {
  ensureDir(outputDir);
  const userDataDir = mkUserDataDir("capture");
  let app;
  try {
    const launched = await launchApp(userDataDir);
    app = launched.app;
    const files = await captureShots(launched.page);
    const manifest = writeManifest(files);
    console.log(JSON.stringify({ ok: true, outputDir, files: manifest.shots }, null, 2));
  } finally {
    if (app) {
      await app.close();
    }
    rmUserDataDir(userDataDir);
  }
}

main().catch((error) => {
  console.error(error && error.stack ? error.stack : String(error));
  process.exitCode = 1;
});
