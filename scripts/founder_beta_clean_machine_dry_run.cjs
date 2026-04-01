const fs = require("fs");
const os = require("os");
const path = require("path");
const { _electron: electron } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
const packageVersion = String(pkg.version || "0.0.0");

function resolveBetaRoot() {
  const overrideDir = String(process.env.NEURAL_BETA_DIR || "").trim();
  if (overrideDir) {
    const resolved = path.isAbsolute(overrideDir) ? overrideDir : path.join(ROOT, overrideDir);
    if (!fs.existsSync(resolved)) {
      throw new Error(`NEURAL_BETA_DIR does not exist: ${resolved}`);
    }
    const base = path.basename(resolved);
    const extracted = /^founder-beta-v(.+)$/i.exec(base);
    return { betaRoot: resolved, betaVersion: extracted ? extracted[1] : "custom" };
  }

  const overrideVersion = String(process.env.NEURAL_BETA_VERSION || "").trim();
  if (overrideVersion) {
    const explicit = path.join(ROOT, "beta", `founder-beta-v${overrideVersion}`);
    if (!fs.existsSync(explicit)) {
      throw new Error(`NEURAL_BETA_VERSION folder missing: ${explicit}`);
    }
    return { betaRoot: explicit, betaVersion: overrideVersion };
  }

  const preferred = path.join(ROOT, "beta", `founder-beta-v${packageVersion}`);
  if (fs.existsSync(preferred)) {
    return { betaRoot: preferred, betaVersion: packageVersion };
  }

  const betaParent = path.join(ROOT, "beta");
  const candidates = fs.existsSync(betaParent)
    ? fs.readdirSync(betaParent, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && /^founder-beta-v.+$/i.test(entry.name))
      .map((entry) => entry.name)
    : [];

  if (!candidates.length) {
    throw new Error(`No founder-beta package found under ${betaParent}`);
  }

  candidates.sort((a, b) => b.localeCompare(a, undefined, { numeric: true, sensitivity: "base" }));
  const chosen = candidates[0];
  const extracted = /^founder-beta-v(.+)$/i.exec(chosen);
  return { betaRoot: path.join(betaParent, chosen), betaVersion: extracted ? extracted[1] : chosen };
}

const { betaRoot, betaVersion } = resolveBetaRoot();
const quickstartDoc = path.join(betaRoot, "docs", "FOUNDER_BETA_QUICKSTART.md");
const exePath = path.join(ROOT, "dist", "win-unpacked", "NeuralShell.exe");
const outDir = path.join(ROOT, "release", "founder-beta-dry-run");
const shots = {
  shell: path.join(outDir, "dryrun_shell_loaded.png"),
  proof: path.join(outDir, "dryrun_proof_state.png"),
  roi: path.join(outDir, "dryrun_roi_state.png"),
  unlocked: path.join(outDir, "dryrun_unlock_restored.png"),
};
const reportPath = path.join(ROOT, "release", "founder-beta-dry-run-report.json");

const PROOF_TRIGGERS = [
  '[data-testid="quickstart-proof-btn"]',
  '[data-testid="card-proof"]',
  '[data-testid="run-proof-btn"]',
];
const ROI_TRIGGERS = [
  '[data-testid="quickstart-roi-btn"]',
  '[data-testid="card-roi"]',
  '[data-testid="run-roi-btn"]',
];

function rel(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

async function waitFor(page, selector, timeout = 20000) {
  await page.locator(selector).first().waitFor({ state: "visible", timeout });
}

async function visible(page, selector) {
  return page.locator(selector).first().isVisible().catch(() => false);
}

async function runCommand(page, command) {
  await page.getByTestId("chat-input").fill(command);
  await page.getByRole("button", { name: "Execute Command" }).click();
}

async function waitForChatContains(page, text, timeout = 20000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    const rows = await page.locator('[data-testid="chat-message"]').allTextContents();
    if (rows.some((row) => row.includes(text))) {
      return;
    }
    await page.waitForTimeout(160);
  }
  throw new Error(`Timed out waiting for chat content: ${text}`);
}

async function clickAny(page, selectors, fallbackCommand) {
  for (const selector of selectors) {
    if (await visible(page, selector)) {
      await page.locator(selector).first().click();
      return selector;
    }
  }
  await runCommand(page, fallbackCommand);
  return `command:${fallbackCommand}`;
}

async function waitForRailStatus(page, text, timeout = 15000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    const status = await page.getByTestId("session-rail-status").textContent().catch(() => "");
    if ((status || "").includes(text)) {
      return;
    }
    await page.waitForTimeout(160);
  }
  throw new Error(`Timed out waiting for session status: ${text}`);
}

async function createSession(page, name, passphrase) {
  await page.getByTestId("new-thread-btn").click();
  await waitFor(page, '[data-testid="session-modal"]');
  await page.getByTestId("session-modal-name-input").fill(name);
  await page.getByTestId("session-modal-pass-input").fill(passphrase);
  await page.getByTestId("session-modal-submit-btn").click();
  await page.waitForTimeout(800);
  const stillOpen = await page.getByTestId("session-modal").isVisible().catch(() => false);
  if (stillOpen) {
    const modalError = await page.getByTestId("session-modal-error").textContent().catch(() => "");
    throw new Error(`Session modal stayed open: ${modalError || "unknown error"}`);
  }
}

async function run() {
  if (!fs.existsSync(exePath)) {
    throw new Error(`Packaged executable missing: ${exePath}`);
  }
  if (!fs.existsSync(quickstartDoc)) {
    throw new Error(`Quickstart doc missing: ${quickstartDoc}`);
  }
  fs.mkdirSync(outDir, { recursive: true });
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "neuralshell-founder-dryrun-"));
  const report = {
    generatedAt: new Date().toISOString(),
    version: packageVersion,
    betaPackageVersion: betaVersion,
    betaRoot: rel(betaRoot),
    mode: "packaged-clean-machine-dry-run",
    usingDocs: [rel(quickstartDoc)],
    launchTarget: rel(exePath),
    userDataIsolation: true,
    steps: [],
    artifacts: {
      screenshots: Object.fromEntries(Object.entries(shots).map(([k, v]) => [k, rel(v)])),
      report: rel(reportPath),
    },
    passed: false,
  };

  const step = (name, pass, details = "") => {
    report.steps.push({ name, pass: Boolean(pass), details });
  };

  let app;
  try {
    app = await electron.launch({
      executablePath: exePath,
      env: {
        ...process.env,
        CI: "1",
        NEURAL_USER_DATA_DIR: userDataDir,
        NEURAL_IGNORE_INTEGRITY: "1",
      },
    });

    const page = await app.firstWindow();
    await waitFor(page, '[data-testid="top-status-bar"]', 25000);
    await waitFor(page, '[data-testid="workspace-panel"]', 25000);
    await page.screenshot({ path: shots.shell, fullPage: true });
    step("shell_loaded", true, "Top status and workspace panel rendered.");

    await runCommand(page, "/clear");
    await page.waitForTimeout(450);

    const proofPath = await clickAny(page, PROOF_TRIGGERS, "/proof");
    await waitForChatContains(page, "90-Second Value Proof");
    await page.screenshot({ path: shots.proof, fullPage: true });
    step("proof_flow", true, `Triggered via ${proofPath}.`);

    const roiPath = await clickAny(page, ROI_TRIGGERS, "/roi");
    await waitForChatContains(page, "ROI Snapshot");
    await page.screenshot({ path: shots.roi, fullPage: true });
    step("roi_flow", true, `Triggered via ${roiPath}.`);

    const sessionName = `DryRun_${Date.now().toString(36).toUpperCase()}`;
    const passphrase = "founder-dry-run-pass";
    await createSession(page, sessionName, passphrase);
    await runCommand(page, "/guard");
    await waitForChatContains(page, "Security Guard: ACTIVE");
    await page.getByTestId("save-active-session-btn").click();
    await waitForRailStatus(page, "Saved");
    await page.getByTestId("lock-active-session-btn").click();
    await waitFor(page, '[data-testid="session-lock-banner"]');
    await page.getByTestId("session-lock-unlock-btn").click();
    await waitFor(page, '[data-testid="session-modal"]');
    await page.getByTestId("session-modal-pass-input").fill(passphrase);
    await page.getByTestId("session-modal-submit-btn").click();
    await waitForChatContains(page, "Security Guard: ACTIVE");
    await page.screenshot({ path: shots.unlocked, fullPage: true });
    step("session_continuity", true, "Save/lock/unlock/restore verified.");

    report.passed = report.steps.every((row) => row.pass);
  } catch (err) {
    step("dry_run_exception", false, err && err.message ? err.message : String(err));
    report.passed = false;
  } finally {
    if (app) {
      await app.close();
    }
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup failures
    }
    fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  }

  console.log(JSON.stringify(report, null, 2));
  if (!report.passed) {
    process.exitCode = 1;
  }
}

run().catch((err) => {
  console.error(err && err.stack ? err.stack : err);
  process.exitCode = 1;
});
