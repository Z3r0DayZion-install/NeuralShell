const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { test, expect } = require("@playwright/test");
const { _electron: electron } = require("playwright");

const repoRoot = path.resolve(__dirname, "..");
const paletteShortcut = process.platform === "darwin" ? "Meta+K" : "Control+K";

function mkUserDataDir(label) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `neuralshell-e2e-${label}-`));
}

function mkWorkspaceDir(label) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `neuralshell-workspace-${label}-`));
  fs.writeFileSync(
    path.join(dir, "package.json"),
    JSON.stringify({ name: `workspace-${label}`, private: true }, null, 2),
    "utf8"
  );
  fs.writeFileSync(path.join(dir, "README.md"), `# ${label}\n`, "utf8");
  fs.mkdirSync(path.join(dir, "docs"), { recursive: true });
  fs.mkdirSync(path.join(dir, "scripts"), { recursive: true });
  fs.writeFileSync(
    path.join(dir, "docs", "release-audit.md"),
    "# Release Audit\n\n- Pending verification\n- Pending packaging\n",
    "utf8"
  );
  return dir;
}

function rmUserDataDir(dir) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {
    // Ignore cleanup failures in CI and local locked-file conditions.
  }
}

async function launchApp(userDataDir) {
  const app = await electron.launch({
    args: ["."],
    cwd: repoRoot,
    env: {
      ...process.env,
      NEURAL_USER_DATA_DIR: userDataDir
    }
  });
  const page = await app.firstWindow();
  await page.waitForSelector("#statusLabel", { state: "attached", timeout: 20000 });
  await page.waitForSelector("#onboardingOverlay", { state: "attached", timeout: 20000 });
  return { app, page };
}

async function expectOnboardingOpen(page, open) {
  await expect(page.locator("#onboardingOverlay")).toHaveAttribute(
    "aria-hidden",
    open ? "false" : "true"
  );
}

async function closeOnboardingViaSkip(page) {
  await expectOnboardingOpen(page, true);
  await page.click("#onboardingSkipBtn");
  await expectOnboardingOpen(page, false);
}

async function openSettingsMenu(page) {
  const panel = page.locator("#settingsMenuPanel");
  const backdrop = page.locator("#settingsMenuBackdrop");
  if (await panel.getAttribute("aria-hidden") !== "false") {
    await page.locator("#settingsMenuOpenBtn").click({ force: true });
  }
  if (await panel.getAttribute("aria-hidden") !== "false") {
    await page.keyboard.press("Control+,");
  }
  await expect(panel).toHaveAttribute("aria-hidden", "false");
  await expect(backdrop).toHaveAttribute("aria-hidden", "false");
}

async function closeSettingsMenu(page) {
  const panel = page.locator("#settingsMenuPanel");
  const backdrop = page.locator("#settingsMenuBackdrop");
  if (await panel.getAttribute("aria-hidden") !== "true") {
    await page.locator("#settingsMenuCloseBtn").click({ force: true });
  }
  if (await panel.getAttribute("aria-hidden") !== "true") {
    await page.keyboard.press("Escape");
  }
  await expect(panel).toHaveAttribute("aria-hidden", "true");
  await expect(backdrop).toHaveAttribute("aria-hidden", "true");
}

async function readTheme(page) {
  return page.evaluate(() => {
    return String(document.documentElement.getAttribute("data-theme") || "");
  });
}

async function seedWorkflowWorkspaceAndArtifact(page, workspaceRoot = repoRoot) {
  await page.click('#workflowQuickActions button[data-workflow-id="release_audit"]');
  await expect(page.locator("#workflowTitleText")).toContainText("Release Audit");
  await page.selectOption("#outputModeSelect", "checklist");
  await page.evaluate(async ({ workspaceRoot }) => {
    const summary = await window.api.workspace.summarize(workspaceRoot);
    await window.NeuralShellRenderer.setWorkspaceAttachment(summary, {
      persist: false,
      announce: false
    });
    window.NeuralShellRenderer.renderChat([
      { role: "user", content: "Audit the current release state." },
      { role: "assistant", content: "1. Verify runtime logs.\n2. Verify checksums.\n3. Verify offline bridge posture." }
    ]);
  }, { workspaceRoot });
  await expect(page.locator("#workspaceSummaryText")).toContainText(path.basename(workspaceRoot));
  await expect(page.locator("#artifactPreview")).toContainText("Verify runtime logs");
  await expect(page.locator("#operatorRail")).toContainText("Preview Markdown Report");
  await expect(page.locator("#operatorRail")).toContainText("Export Evidence Bundle");
  await expect(page.locator("#missionControlGrid")).toContainText("Workflow Lane");
  await expect(page.locator("#missionControlGrid")).toContainText("Release Lane");
  await expect(page.locator("#workspaceActionList")).toContainText("Local only");
  await expect(page.locator("#workspaceActionList")).toContainText("Writes file");
}

test("settings menu opens, shows status cards, and closes with escape", async () => {
  const userDataDir = mkUserDataDir("settings-drawer");
  let app = null;
  try {
    const { app: runningApp, page } = await launchApp(userDataDir);
    app = runningApp;
    await closeOnboardingViaSkip(page);
    await openSettingsMenu(page);
    await expect(page.locator("#bridgeStatusText")).toHaveText(/.+/);
    await expect(page.locator("#workspaceModeText")).toHaveText(/.+/);
    await page.keyboard.press("Escape");
    await expect(page.locator("#settingsMenuPanel")).toHaveAttribute("aria-hidden", "true");
    await expect(page.locator("#settingsMenuBackdrop")).toHaveAttribute("aria-hidden", "true");
  } finally {
    if (app) await app.close();
    rmUserDataDir(userDataDir);
  }
});

test("runtime trays stage diagnostics and focus the active output surface", async () => {
  const userDataDir = mkUserDataDir("runtime-trays");
  let app = null;
  try {
    const { app: runningApp, page } = await launchApp(userDataDir);
    app = runningApp;
    await closeOnboardingViaSkip(page);

    await page.click("#runtimeTraceTrayBtn");
    await expect(page.locator("#runtimeTraceTray")).toBeVisible();

    await page.click("#runtimeDiagnosticsTrayBtn");
    await page.click("#runButtonAuditBtn");
    await expect(page.locator("#runtimeOutputTray")).toBeVisible();
    await expect(page.locator("#runtimeAuditOutputPanel")).toBeVisible();
    await expect(page.locator("#buttonAuditOutput")).toContainText("\"total\"");

    await page.click("#runtimeChatLogsOutputBtn");
    await expect(page.locator("#runtimeChatLogsOutputPanel")).toBeVisible();
  } finally {
    if (app) await app.close();
    rmUserDataDir(userDataDir);
  }
});

test("session and command trays keep primary actions visible while staging admin surfaces", async () => {
  const userDataDir = mkUserDataDir("session-command-trays");
  let app = null;
  try {
    const { app: runningApp, page } = await launchApp(userDataDir);
    app = runningApp;
    await closeOnboardingViaSkip(page);

    await expect(page.locator("#saveSessionBtn")).toBeVisible();
    await expect(page.locator("#loadSessionBtn")).toBeVisible();

    await page.click("#sessionInspectTrayBtn");
    await expect(page.locator("#sessionInspectTray")).toBeVisible();

    await page.click("#commandRoutingTrayBtn");
    await expect(page.locator("#commandRoutingTray")).toBeVisible();

    await page.click("#commandBusPaletteBtn");
    await expect(page.locator("#commandPaletteOverlay")).toHaveAttribute("aria-hidden", "false");
    await page.click("#commandPaletteCloseBtn");
    await expect(page.locator("#commandPaletteOverlay")).toHaveAttribute("aria-hidden", "true");
  } finally {
    if (app) await app.close();
    rmUserDataDir(userDataDir);
  }
});

test("intel trays keep the operator brief visible while staging feed and capability detail", async () => {
  const userDataDir = mkUserDataDir("intel-trays");
  let app = null;
  try {
    const { app: runningApp, page } = await launchApp(userDataDir);
    app = runningApp;
    await closeOnboardingViaSkip(page);

    await page.evaluate(() => {
      const panel = document.querySelector(".panel-intel");
      if (panel) {
        panel.scrollIntoView({ block: "start" });
      }
    });

    await expect(page.locator("#intelBriefTray")).toBeVisible();
    await expect(page.locator("#intelFocusText")).toContainText("Release Audit");

    await page.click("#intelKnowledgeTrayBtn");
    await expect(page.locator("#intelKnowledgeTray")).toBeVisible();
    await expect(page.locator("#knowledgeFeed")).toContainText("Workflow Surface");

    await page.click("#intelCapabilityTrayBtn");
    await expect(page.locator("#intelCapabilityTray")).toBeVisible();
    await expect(page.locator("#capabilityGraph")).toContainText("Workspace Context");
    await expect(page.locator("#capabilityGraph")).toContainText("Verification Lane");
  } finally {
    if (app) await app.close();
    rmUserDataDir(userDataDir);
  }
});

test("onboarding is remembered and can be reset", async () => {
  const userDataDir = mkUserDataDir("onboarding");
  let app = null;
  try {
    let page;
    ({ app, page } = await launchApp(userDataDir));
    await closeOnboardingViaSkip(page);
    await app.close();
    app = null;

    ({ app, page } = await launchApp(userDataDir));
    await expectOnboardingOpen(page, false);
    await openSettingsMenu(page);
    await page.click("#onboardingResetBtn");
    await expectOnboardingOpen(page, true);
  } finally {
    if (app) await app.close();
    rmUserDataDir(userDataDir);
  }
});

test("command palette toggles theme and closes cleanly", async () => {
  const userDataDir = mkUserDataDir("palette");
  let app = null;
  try {
    const { app: runningApp, page } = await launchApp(userDataDir);
    app = runningApp;
    await closeOnboardingViaSkip(page);

    const initialTheme = await readTheme(page);
    const expectedNextTheme = initialTheme === "dark" ? "light" : "dark";

    await page.keyboard.press(paletteShortcut);
    await expect(page.locator("#commandPaletteOverlay")).toHaveAttribute("aria-hidden", "false");

    await page.fill("#commandPaletteInput", "Toggle Theme");
    await expect(page.locator("#commandPaletteList")).toContainText("Toggle Theme");
    await page.keyboard.press("Enter");

    await expect(page.locator("#commandPaletteOverlay")).toHaveAttribute("aria-hidden", "true");
    await expect.poll(async () => readTheme(page)).toBe(expectedNextTheme);
    await expect(page.locator("#themeSelect")).toHaveValue(expectedNextTheme);
  } finally {
    if (app) await app.close();
    rmUserDataDir(userDataDir);
  }
});

test("profile editor and settings persist across restart", async () => {
  const userDataDir = mkUserDataDir("settings");
  let app = null;
  try {
    let page;
    ({ app, page } = await launchApp(userDataDir));
    await closeOnboardingViaSkip(page);
    await openSettingsMenu(page);

    await page.click("#profileNewBtn");
    await page.fill("#profileNameInput", "E2E Profile");
    await page.fill("#profileBaseUrlInput", "http://127.0.0.1:11434");
    await page.fill("#profileTimeoutInput", "18000");
    await page.fill("#profileRetryInput", "3");
    await page.click("#profileSaveBtn");
    await page.click("#profileUseBtn");

    await page.selectOption("#themeSelect", "light");
    await page.fill("#tokenBudgetInput", "2048");
    await page.fill("#autosaveNameInput", "e2e-autosave");
    await page.fill("#autosaveIntervalInput", "12");
    await page.check("#autosaveEnabledInput");
    await page.check("#connectOnStartupInput");
    await page.uncheck("#allowRemoteBridgeInput");
    await page.click("#applySettingsBtn");
    await expect(page.locator("#statusLabel")).toContainText("Settings applied.");
    await closeSettingsMenu(page);

    await app.close();
    app = null;

    ({ app, page } = await launchApp(userDataDir));
    await expectOnboardingOpen(page, false);
    await openSettingsMenu(page);
    await expect(page.locator("#themeSelect")).toHaveValue("light");
    await expect(page.locator("#tokenBudgetInput")).toHaveValue("2048");
    await expect(page.locator("#autosaveNameInput")).toHaveValue("e2e-autosave");
    await expect(page.locator("#autosaveIntervalInput")).toHaveValue("12");
    await expect(page.locator("#autosaveEnabledInput")).toBeChecked();
    await expect(page.locator("#connectOnStartupInput")).toBeChecked();
    await expect(page.locator("#allowRemoteBridgeInput")).not.toBeChecked();
    await expect(page.locator("#profileNameInput")).toHaveValue("E2E Profile");
    await expect(page.locator("#profileTimeoutInput")).toHaveValue("18000");
    await expect(page.locator("#profileRetryInput")).toHaveValue("3");
    await expect(page.locator("#workspaceModeText")).toContainText("Local-only bridge");

    const profileOptions = await page.locator("#profileSelect option").allTextContents();
    expect(profileOptions.some((text) => String(text).includes("E2E Profile"))).toBeTruthy();
  } finally {
    if (app) await app.close();
    rmUserDataDir(userDataDir);
  }
});

test("workflow state, workspace attachment, evidence export, and guarded apply deck work together", async () => {
  const userDataDir = mkUserDataDir("workflow-bundle");
  const workspaceDir = mkWorkspaceDir("apply-deck");
  let app = null;
  try {
    const { app: runningApp, page } = await launchApp(userDataDir);
    app = runningApp;
    await closeOnboardingViaSkip(page);
    await seedWorkflowWorkspaceAndArtifact(page, workspaceDir);

    await page.fill("#sessionName", "workflow-evidence");
    await page.fill("#sessionPass", "EvidencePass123");
    await page.click("#saveSessionBtn");
    await expect(page.locator("#statusLabel")).toContainText("Session saved");

    await page.click("#newChatBtn");
    await expect(page.locator("#artifactPreview")).toContainText("No artifact yet");

    await page.click("#loadSessionBtn");
    await expect(page.locator("#workflowTitleText")).toContainText("Release Audit");
    await expect(page.locator("#workspaceSummaryText")).toContainText(path.basename(workspaceDir));
    await expect(page.locator("#artifactPreview")).toContainText("Verify runtime logs");

    await page.click("#exportEvidenceBundleBtn");
    await expect(page.locator("#statusLabel")).toContainText("Evidence bundle exported");

    await page.fill("#workspaceEditPathInput", "docs/release-audit.md");
    await page.fill(
      "#workspaceEditContentInput",
      "# Release Audit\n\n- Renderer and IPC guards verified\n- Offline bridge posture healthy\n"
    );
    await page.click("#previewWorkspaceEditBtn");
    await expect(page.locator("#workspaceActionPreviewMeta")).toContainText("Diff preview");
    await expect(page.locator("#operatorRail")).toContainText("Apply Previewed Action");
    await expect(page.locator("#workspaceActionList")).toContainText("Preview first");
    const previewText = await page.locator("#workspaceActionPreview").textContent();
    expect(String(previewText || "")).toContain("--- a/docs/release-audit.md");
    expect(String(previewText || "")).toContain("- Pending verification");
    expect(String(previewText || "")).toContain("+- Renderer and IPC guards verified");
    const targetPathMatch = String(previewText || "").match(/^Path:\s+(.+?)\r?\n/m);
    expect(targetPathMatch).not.toBeNull();

    await page.click("#applyWorkspaceActionBtn");
    await expect(page.locator("#statusLabel")).toContainText("Workspace write applied");

    const targetPath = String(targetPathMatch[1] || "");
    expect(fs.existsSync(targetPath)).toBeTruthy();
    expect(fs.readFileSync(targetPath, "utf8")).toContain("Offline bridge posture healthy");

    const bundle = await page.evaluate(async () => {
      const filename = window.NeuralShellRenderer.getEvidenceBundleFilename();
      const payload = await window.NeuralShellRenderer.buildEvidenceBundle();
      return { filename, payload };
    });

    expect(bundle.filename).toContain("evidence-bundle");
    expect(bundle.payload.workflowId).toBe("release_audit");
    expect(bundle.payload.outputMode).toBe("checklist");
    expect(bundle.payload.workspaceAttachment.label).toContain(path.basename(workspaceDir));
    expect(Array.isArray(bundle.payload.chat)).toBeTruthy();
    expect(Array.isArray(bundle.payload.recentLogs)).toBeTruthy();
    expect(Array.isArray(bundle.payload.recentChatLogs)).toBeTruthy();
    expect(String((bundle.payload.artifact || {}).content || "")).toContain("Verify runtime logs");
  } finally {
    if (app) await app.close();
    rmUserDataDir(userDataDir);
    rmUserDataDir(workspaceDir);
  }
});

test("workspace edits support filenames with spaces", async () => {
  const userDataDir = mkUserDataDir("workspace-spaces");
  const workspaceDir = mkWorkspaceDir("workspace-spaces");
  const notesPath = path.join(workspaceDir, "docs", "Release Audit Notes.md");
  let app = null;
  try {
    const { app: runningApp, page } = await launchApp(userDataDir);
    app = runningApp;
    await closeOnboardingViaSkip(page);

    await page.evaluate(async ({ workspaceDir }) => {
      const summary = await window.api.workspace.summarize(workspaceDir);
      await window.NeuralShellRenderer.setWorkspaceAttachment(summary, {
        persist: false,
        announce: false
      });
    }, { workspaceDir });

    await page.fill("#workspaceEditPathInput", "docs/Release Audit Notes.md");
    await page.fill(
      "#workspaceEditContentInput",
      "# Release Audit Notes\n\n- Allow spaces in guarded file edits.\n"
    );
    await page.click("#previewWorkspaceEditBtn");
    await expect(page.locator("#workspaceActionPreviewMeta")).toContainText("Diff preview");
    await expect(page.locator("#workspaceActionPreview")).toContainText("Release Audit Notes.md");

    await page.click("#applyWorkspaceActionBtn");
    await expect(page.locator("#statusLabel")).toContainText("Workspace write applied");
    expect(fs.existsSync(notesPath)).toBeTruthy();
    expect(fs.readFileSync(notesPath, "utf8")).toContain("Allow spaces in guarded file edits");
  } finally {
    if (app) await app.close();
    rmUserDataDir(userDataDir);
    rmUserDataDir(workspaceDir);
  }
});

test("release cockpit stages guarded release checks and reflects partial verification", async () => {
  const userDataDir = mkUserDataDir("release-cockpit");
  let app = null;
  try {
    const { app: runningApp, page } = await launchApp(userDataDir);
    app = runningApp;
    await closeOnboardingViaSkip(page);
    await seedWorkflowWorkspaceAndArtifact(page, repoRoot);

    await expect(page.locator("#releaseCockpitTitleText")).toContainText("Stage release verification");
    await expect(page.locator("#releaseCockpitMetaRow")).toContainText("Release Audit");
    await expect(page.locator("#releaseCockpitChecklist")).toContainText("Stage lint, founder e2e, and store screenshot refresh");

    await page.click("#stageReleaseCockpitBtn");
    await expect(page.locator("#verificationRunTitleText")).toContainText("Release Cockpit Verification");
    await expect(page.locator("#verificationRunList")).toContainText("Run lint");
    await expect(page.locator("#verificationRunList")).toContainText("Run founder e2e");
    await expect(page.locator("#verificationRunList")).toContainText("Refresh store screenshots");
    await expect(page.locator("#releaseCockpitStatusList")).toContainText("Refresh store screenshots");

    const founderCard = page.locator("#verificationRunList .workspace-action-card").filter({ hasText: "Run founder e2e" });
    const screenshotCard = page.locator("#verificationRunList .workspace-action-card").filter({ hasText: "Refresh store screenshots" });
    await founderCard.locator('input[type="checkbox"]').uncheck();
    await screenshotCard.locator('input[type="checkbox"]').uncheck();

    await page.click("#runReleaseCockpitBtn");
    await expect(page.locator("#statusLabel")).toContainText("Verification run complete", { timeout: 240000 });
    await expect(page.locator("#releaseCockpitTitleText")).toContainText("Build the release packet", { timeout: 240000 });
    await expect(page.locator("#releaseCockpitMetaRow")).toContainText("1 passed");
    await expect(page.locator("#verificationRunOutput")).toContainText("Command: npm run lint");
    await expect(page.locator("#verificationRunOutput")).not.toContainText("npm run test:e2e");
    await expect(page.locator("#verificationRunOutput")).not.toContainText("npm run channel:store:screenshots");

    await page.click("#buildReleasePacketBtn");
    await expect(page.locator("#statusLabel")).toContainText("Release packet built");
    await expect(page.locator("#artifactTitleText")).toContainText("Release Packet");
    await expect(page.locator("#artifactMetaText")).toContainText("Release Packet");
    await expect(page.locator("#artifactPreview")).toContainText("Decision: Ready");
    await expect(page.locator("#artifactPreview")).toContainText("## Verification");
    await expect(page.locator("#artifactPreview")).toContainText("[PASSED] Run lint");
    await expect(page.locator("#releaseCockpitTitleText")).toContainText("Release packet ready");
    await expect(page.locator("#releaseCockpitMetaRow")).toContainText("Packet built");

    const bundle = await page.evaluate(async () => {
      return window.NeuralShellRenderer.buildEvidenceBundle();
    });
    expect(bundle.verificationRunPlan.groupId).toBe("release_cockpit");
    expect(bundle.verificationRunPlan.rootPath).toBe(repoRoot);
    expect(bundle.artifact.outputMode).toBe("release_packet");
    const lintCheck = bundle.verificationRunPlan.checks.find((check) => check.id === "lint");
    const founderCheck = bundle.verificationRunPlan.checks.find((check) => check.id === "founder_e2e");
    const screenshotCheck = bundle.verificationRunPlan.checks.find((check) => check.id === "store_screenshots");
    expect(lintCheck).toBeTruthy();
    expect(lintCheck.status).toBe("passed");
    expect(founderCheck.selected).toBe(false);
    expect(screenshotCheck.selected).toBe(false);

    await page.evaluate(async () => {
      await window.NeuralShellRenderer.buildReleasePacketArtifact({
        generatedAt: "2026-03-10T08:31:20.000Z"
      });
    });
    await expect(page.locator("#artifactHistoryList .artifact-history-card")).toHaveCount(2);

    const loadToDockButton = page.locator("#artifactHistoryList .artifact-history-card button", { hasText: "Load to Dock" }).first();
    await loadToDockButton.click();
    await expect(page.locator("#statusLabel")).toContainText("Release packet loaded into the dock.");
    await expect(page.locator("#artifactHistoryList .artifact-history-card button", { hasText: "Loaded in Dock" })).toHaveCount(1);

    await page.fill("#sessionName", "ReleasePacketHistory");
    await page.fill("#sessionPass", "PacketHistoryPassphrase1!");
    await page.click("#saveSessionBtn");
    await expect(page.locator("#statusLabel")).toContainText("Session saved: ReleasePacketHistory");

    await page.click("#clearArtifactHistoryBtn");
    await expect(page.locator("#artifactHistoryList")).toContainText("No release packets yet.");

    await page.click("#loadSessionBtn");
    await expect(page.locator("#statusLabel")).toContainText("Session loaded: ReleasePacketHistory");
    await expect(page.locator("#artifactHistoryList .artifact-history-card")).toHaveCount(2);
  } finally {
    if (app) await app.close();
    rmUserDataDir(userDataDir);
  }
});

test("switching workspaces clears stale patch plans and verification runs", async () => {
  const userDataDir = mkUserDataDir("workspace-switch");
  const workspaceA = mkWorkspaceDir("workspace-switch-a");
  const workspaceB = mkWorkspaceDir("workspace-switch-b");
  let app = null;
  try {
    const { app: runningApp, page } = await launchApp(userDataDir);
    app = runningApp;
    await closeOnboardingViaSkip(page);

    await page.evaluate(async ({ workspaceA }) => {
      const summary = await window.api.workspace.summarize(workspaceA);
      await window.NeuralShellRenderer.setWorkspaceAttachment(summary, {
        persist: false,
        announce: false
      });
      await window.NeuralShellRenderer.activateWorkflow("bug_triage", {
        seedPrompt: false,
        persist: false,
        announce: false
      });
      await window.NeuralShellRenderer.setOutputMode("patch_plan", { persist: false });
      await window.NeuralShellRenderer.setPatchPlan({
        title: "Bound Patch Plan",
        summary: "This plan should be cleared when the attached workspace root changes.",
        rootPath: summary.rootPath,
        files: [
          {
            path: "docs/release-audit.md",
            rationale: "Patch is intentionally bound to the first workspace.",
            content: "# Workspace Switch\n"
          }
        ]
      }, {
        workflowId: "bug_triage",
        rootPath: summary.rootPath
      });
      window.NeuralShellRenderer.setVerificationRunPlan({
        id: "verification-bug-triage-runtime",
        groupId: "runtime",
        groupTitle: "Runtime Surface",
        workflowId: "bug_triage",
        rootPath: summary.rootPath,
        rootLabel: summary.label,
        checks: [{ id: "lint", selected: true }]
      }, {
        workflowId: "bug_triage"
      });
    }, { workspaceA });

    await expect(page.locator("#patchPlanTitleText")).toContainText("Bound Patch Plan");
    await expect(page.locator("#verificationRunTitleText")).toContainText("Runtime Surface Verification");

    await page.evaluate(async ({ workspaceB }) => {
      const summary = await window.api.workspace.summarize(workspaceB);
      await window.NeuralShellRenderer.setWorkspaceAttachment(summary, {
        persist: false,
        announce: false
      });
    }, { workspaceB });

    await expect(page.locator("#workspaceSummaryText")).toContainText(path.basename(workspaceB));
    await expect(page.locator("#patchPlanTitleText")).toContainText("No patch plan loaded");
    await expect(page.locator("#verificationRunTitleText")).toContainText("No verification run plan staged");
  } finally {
    if (app) await app.close();
    rmUserDataDir(userDataDir);
    rmUserDataDir(workspaceA);
    rmUserDataDir(workspaceB);
  }
});

test("patch plans preview, apply selected files, and persist across session reload", async () => {
  const userDataDir = mkUserDataDir("patch-plan");
  const workspaceDir = mkWorkspaceDir("patch-plan");
  const notesPath = path.join(workspaceDir, "docs", "release-audit.md");
  const readmePath = path.join(workspaceDir, "README.md");
  let app = null;
  try {
    const { app: runningApp, page } = await launchApp(userDataDir);
    app = runningApp;
    await closeOnboardingViaSkip(page);

    await page.evaluate(async ({ workspaceDir }) => {
      const summary = await window.api.workspace.summarize(workspaceDir);
      await window.NeuralShellRenderer.setWorkspaceAttachment(summary, {
        persist: false,
        announce: false
      });
      await window.NeuralShellRenderer.activateWorkflow("bug_triage", {
        seedPrompt: false,
        persist: false,
        announce: false
      });
      await window.NeuralShellRenderer.setOutputMode("patch_plan", { persist: false });
      const plan = {
        title: "Guarded Bug Fix Patch Plan",
        summary: "Update the release notes and README after confirming the smallest safe fix path.",
        verification: ["Run lint", "Run founder e2e"],
        files: [
          {
            path: "docs/release-audit.md",
            rationale: "Reflect the verified renderer and bridge posture.",
            content: "# Release Audit\n\n- Renderer guardrails verified\n- Offline bridge posture verified\n"
          },
          {
            path: "README.md",
            rationale: "Refresh the repo tagline for the updated product loop.",
            content: "# patch-plan\n\nNeuralShell now ships guarded patch-plan previews.\n"
          }
        ]
      };
      window.NeuralShellRenderer.renderChat([
        { role: "user", content: "Build the smallest safe patch plan for the current bug triage." },
        { role: "assistant", content: JSON.stringify(plan, null, 2) }
      ]);
    }, { workspaceDir });

    await expect(page.locator("#patchPlanTitleText")).toContainText("Guarded Bug Fix Patch Plan");
    await expect(page.locator("#patchPlanFileList")).toContainText("docs/release-audit.md");
    await expect(page.locator("#patchPlanFileList")).toContainText("README.md");

    await page.click("#previewPatchPlanBtn");
    await expect(page.locator("#patchPlanMetaText")).toContainText("2 files");
    await expect(page.locator("#patchPlanPreview")).toContainText("--- a/docs/release-audit.md");
    await expect(page.locator("#operatorRail")).toContainText("Apply Selected Patch Files");
    await expect(page.locator("#patchPlanFileList")).toContainText("Documentation Surface");
    await expect(page.locator("#patchPlanFileList")).toContainText("Select group");
    await expect(page.locator("#patchPlanFileList")).toContainText("Load Checks");
    await expect(page.locator("#patchPlanFileList")).toContainText("Explicit apply");
    await expect(page.locator("#patchPlanFileList")).toContainText("Reviewed diff");
    await expect(page.locator("#patchPlanFileList")).toContainText("Low risk");
    await expect(page.locator("#patchPlanFileList")).toContainText("Review copy and exported artifact output.");
    await page.locator(".patch-plan-group-shell").filter({ hasText: "Documentation Surface" }).locator("button", { hasText: "Load Checks" }).click();
    await expect(page.locator("#promptInput")).toHaveValue(/Verify the documentation and narrative surfaces/);
    await page.locator(".patch-plan-group-shell").filter({ hasText: "Documentation Surface" }).locator("button", { hasText: /Promote to Palette|Update Shortcut/ }).click();
    await expect(page.locator("#patchPlanFileList")).toContainText("Palette shortcut");
    await expect(page.locator("#patchPlanShortcutList")).toContainText("Verify Documentation Surface");

    await page.evaluate(async () => {
      await window.NeuralShellRenderer.setPromotedPaletteActions([
        {
          id: "shortcut-bug-triage-documentation",
          workflowId: "bug_triage",
          groupId: "documentation",
          groupTitle: "Documentation Surface",
          label: "Verify Documentation Surface",
          detail: "Bug Triage shortcut | 2 files | Review copy and exported artifact output.",
          promptLead: "Verify the documentation and narrative surfaces for clarity, accuracy, and store-facing consistency.",
          checks: [
            "Review copy and exported artifact output.",
            "Refresh screenshots only if store-visible wording changed."
          ],
          filePaths: [
            "docs/release-audit.md",
            "README.md"
          ]
        },
        {
          id: "shortcut-bug-triage-runtime",
          workflowId: "bug_triage",
          groupId: "runtime",
          groupTitle: "Runtime Surface",
          label: "Verify Runtime Surface",
          detail: "Bug Triage shortcut | 2 files | Run lint and founder e2e after apply.",
          promptLead: "Verify the runtime and guarded execution surfaces for safety, bridge health, and regression risk.",
          checks: [
            "Run lint and founder e2e after apply.",
            "Verify bridge, IPC, and guarded local-write behavior manually."
          ],
          filePaths: [
            "src/main.js",
            "src/preload.js"
          ]
        },
        {
          id: "shortcut-release-audit-interface",
          workflowId: "release_audit",
          groupId: "interface",
          groupTitle: "Interface Surface",
          label: "Verify Release Interface Surface",
          detail: "Release Audit shortcut | 2 files | Run lint and founder e2e after apply.",
          promptLead: "Verify the interface changes for layout quality, interaction safety, and visual regressions.",
          checks: [
            "Run lint and founder e2e after apply.",
            "Verify workflow, patch-plan, and apply surfaces in the desktop UI."
          ],
          filePaths: [
            "src/renderer.html",
            "src/style.css"
          ]
        }
      ], {
        persist: false
      });
    });
    await expect(page.locator("#patchPlanShortcutList")).toContainText("Verify Runtime Surface");
    await page.locator("#patchPlanShortcutList .patch-plan-shortcut-card").filter({ hasText: "Verify Runtime Surface" }).locator("button", { hasText: "Move Up" }).click();
    await expect(page.locator("#patchPlanShortcutList .patch-plan-shortcut-card").first()).toContainText("Verify Runtime Surface");

    await page.click("#commandPaletteOpenBtn");
    await expect(page.locator("#commandPaletteShortcutScope")).toHaveValue("workflow");
    await page.fill("#commandPaletteInput", "Verify");
    await expect(page.locator("#commandPaletteList")).toContainText("shortcut");
    await expect(page.locator("#commandPaletteList .palette-item").first()).toContainText("Verify Runtime Surface");
    await expect(page.locator("#commandPaletteList")).not.toContainText("Verify Release Interface Surface");
    await page.selectOption("#commandPaletteShortcutScope", "all");
    await expect(page.locator("#commandPaletteList")).toContainText("Verify Release Interface Surface");
    await page.keyboard.press("Enter");
    await expect(page.locator("#promptInput")).toHaveValue(/Verify the runtime and guarded execution surfaces/);

    await page.locator("#patchPlanShortcutList .patch-plan-shortcut-card").filter({ hasText: "Verify Documentation Surface" }).locator("button", { hasText: "Remove" }).click();
    await expect(page.locator("#patchPlanShortcutList")).not.toContainText("Verify Documentation Surface");
    await page.click("#commandPaletteOpenBtn");
    await page.fill("#commandPaletteInput", "Verify Documentation Surface");
    await expect(page.locator("#commandPaletteList")).not.toContainText("Verify Documentation Surface");
    await page.keyboard.press("Escape");

    const readmeCard = page.locator("#patchPlanFileList .workspace-action-card").filter({
      hasText: "README.md"
    });
    await readmeCard.locator('input[type="checkbox"]').uncheck();

    await page.click("#applySelectedPatchPlanBtn");
    await expect(page.locator("#statusLabel")).toContainText("Patch plan applied");

    expect(fs.readFileSync(notesPath, "utf8")).toContain("Renderer guardrails verified");
    expect(fs.readFileSync(readmePath, "utf8")).toBe("# patch-plan\n");

    await page.fill("#sessionName", "patch-plan-session");
    await page.fill("#sessionPass", "PatchPlanPass123");
    await page.click("#saveSessionBtn");
    await expect(page.locator("#statusLabel")).toContainText("Session saved");

    await page.click("#newChatBtn");
    await page.click("#loadSessionBtn");
    await expect(page.locator("#patchPlanTitleText")).toContainText("Guarded Bug Fix Patch Plan");
    await expect(page.locator("#outputModeSelect")).toHaveValue("patch_plan");
    await expect(page.locator("#patchPlanFileList")).toContainText("README.md");
    await expect(page.locator("#patchPlanShortcutList")).toContainText("Verify Runtime Surface");
    await page.click("#commandPaletteOpenBtn");
    await expect(page.locator("#commandPaletteShortcutScope")).toHaveValue("all");
    await page.fill("#commandPaletteInput", "Verify Runtime Surface");
    await expect(page.locator("#commandPaletteList")).toContainText("Verify Runtime Surface");
    await page.fill("#commandPaletteInput", "Verify Release Interface Surface");
    await expect(page.locator("#commandPaletteList")).toContainText("Verify Release Interface Surface");
  } finally {
    if (app) await app.close();
    rmUserDataDir(userDataDir);
    rmUserDataDir(workspaceDir);
  }
});

test("session load drops mismatched workspace-bound patch and verification state", async () => {
  const userDataDir = mkUserDataDir("session-root-mismatch");
  const workspaceA = mkWorkspaceDir("session-root-a");
  const workspaceB = mkWorkspaceDir("session-root-b");
  let app = null;
  try {
    const { app: runningApp, page } = await launchApp(userDataDir);
    app = runningApp;
    await closeOnboardingViaSkip(page);

    await page.evaluate(async ({ workspaceA, workspaceB }) => {
      const [summaryA, summaryB] = await Promise.all([
        window.api.workspace.summarize(workspaceA),
        window.api.workspace.summarize(workspaceB)
      ]);
      await window.api.session.save("mismatch-root-session", {
        model: "llama3",
        chat: [{ role: "user", content: "Restore the stale workspace-bound state." }],
        workflowId: "bug_triage",
        outputMode: "patch_plan",
        workspaceAttachment: summaryB,
        patchPlan: {
          title: "Stale Root Patch Plan",
          workflowId: "bug_triage",
          outputMode: "patch_plan",
          rootPath: summaryA.rootPath,
          files: [
            {
              path: "docs/release-audit.md",
              rationale: "This should be cleared when the session root does not match.",
              content: "# Stale Root\n"
            }
          ]
        },
        verificationRunPlan: {
          id: "verification-bug-triage-runtime",
          groupId: "runtime",
          groupTitle: "Runtime Surface",
          workflowId: "bug_triage",
          rootPath: summaryA.rootPath,
          rootLabel: summaryA.label,
          checks: [{ id: "lint", selected: true }]
        }
      }, "MismatchPass123");
    }, { workspaceA, workspaceB });

    await page.fill("#sessionName", "mismatch-root-session");
    await page.fill("#sessionPass", "MismatchPass123");
    await page.click("#loadSessionBtn");

    await expect(page.locator("#statusLabel")).toContainText("Session loaded: mismatch-root-session");
    await expect(page.locator("#workspaceSummaryText")).toContainText(path.basename(workspaceB));
    await expect(page.locator("#patchPlanTitleText")).toContainText("No patch plan loaded");
    await expect(page.locator("#verificationRunTitleText")).toContainText("No verification run plan staged");
  } finally {
    if (app) await app.close();
    rmUserDataDir(userDataDir);
    rmUserDataDir(workspaceA);
    rmUserDataDir(workspaceB);
  }
});

test("verification run plans stage, execute selected checks, and persist across session reload", async () => {
  const userDataDir = mkUserDataDir("verification-plan");
  let app = null;
  try {
    const { app: runningApp, page } = await launchApp(userDataDir);
    app = runningApp;
    await closeOnboardingViaSkip(page);

    await page.evaluate(async ({ repoRoot }) => {
      const summary = await window.api.workspace.summarize(repoRoot);
      await window.NeuralShellRenderer.setWorkspaceAttachment(summary, {
        persist: false,
        announce: false
      });
      await window.NeuralShellRenderer.activateWorkflow("bug_triage", {
        seedPrompt: false,
        persist: false,
        announce: false
      });
      await window.NeuralShellRenderer.setOutputMode("patch_plan", { persist: false });
      window.NeuralShellRenderer.renderChat([
        { role: "user", content: "Prepare the smallest safe verification plan for the runtime surface." },
        { role: "assistant", content: "Use the runtime patch group, run lint first, and keep e2e explicit." }
      ]);
      window.NeuralShellRenderer.setPatchPlan({
        title: "Verification Runtime Patch Plan",
        summary: "Guard the verification IPC path and preload bridge surface before running local checks.",
        verification: ["Run lint", "Run founder e2e"],
        files: [
          {
            path: "src/main.js",
            rationale: "Tighten the verification runner IPC and audit path.",
            content: "const verificationRuntime = true;\n"
          },
          {
            path: "src/preload.js",
            rationale: "Expose the guarded verification surface to the renderer.",
            content: "const verificationBridge = true;\n"
          }
        ]
      }, {
        workflowId: "bug_triage",
        generatedAt: "2026-03-10T10:30:00.000Z"
      });
    }, { repoRoot });

    const runtimeGroup = page.locator(".patch-plan-group-shell").filter({ hasText: "Runtime Surface" });
    await runtimeGroup.locator("button", { hasText: "Stage Run Plan" }).click();

    await expect(page.locator("#verificationRunTitleText")).toContainText("Runtime Surface Verification");
    await expect(page.locator("#verificationRunMetaText")).toContainText(path.basename(repoRoot));
    await expect(page.locator("#verificationRunList")).toContainText("Run lint");
    await expect(page.locator("#verificationRunList")).toContainText("Run founder e2e");
    await expect(page.locator("#copyVerificationCommandsBtn")).toBeEnabled();

    const founderCard = page.locator("#verificationRunList .workspace-action-card").filter({
      hasText: "Run founder e2e"
    });
    await founderCard.locator('input[type="checkbox"]').uncheck();
    await expect(page.locator("#verificationRunMetaText")).toContainText("1/2 selected");

    await page.click("#runVerificationPlanBtn");
    await expect(page.locator("#statusLabel")).toContainText("Verification run complete", { timeout: 240000 });
    await expect(page.locator("#verificationRunOutput")).toContainText("[PASSED] Run lint", { timeout: 240000 });
    await expect(page.locator("#verificationRunOutput")).toContainText("Command: npm run lint");
    await expect(page.locator("#verificationRunOutput")).not.toContainText("npm run test:e2e");

    const lintCard = page.locator("#verificationRunList .workspace-action-card").filter({
      hasText: "Run lint"
    });
    await expect(lintCard).toContainText("Passed");
    await expect(founderCard).toContainText("Ready");

    const bundle = await page.evaluate(async () => {
      return window.NeuralShellRenderer.buildEvidenceBundle();
    });
    expect(bundle.verificationRunPlan.groupId).toBe("runtime");
    expect(bundle.verificationRunPlan.rootPath).toBe(repoRoot);
    const lintCheck = bundle.verificationRunPlan.checks.find((check) => check.id === "lint");
    const founderCheck = bundle.verificationRunPlan.checks.find((check) => check.id === "founder_e2e");
    expect(lintCheck).toBeTruthy();
    expect(lintCheck.status).toBe("passed");
    expect(lintCheck.exitCode).toBe(0);
    expect(founderCheck).toBeTruthy();
    expect(founderCheck.selected).toBe(false);

    await page.fill("#sessionName", "verification-run-session");
    await page.fill("#sessionPass", "VerificationRunPass123");
    await page.click("#saveSessionBtn");
    await expect(page.locator("#statusLabel")).toContainText("Session saved");

    await page.click("#newChatBtn");
    await page.click("#loadSessionBtn");
    await expect(page.locator("#verificationRunTitleText")).toContainText("Runtime Surface Verification");
    await expect(page.locator("#verificationRunOutput")).toContainText("[PASSED] Run lint");
    await expect(page.locator("#verificationRunList .workspace-action-card").filter({
      hasText: "Run founder e2e"
    }).locator('input[type="checkbox"]')).not.toBeChecked();
  } finally {
    if (app) await app.close();
    rmUserDataDir(userDataDir);
  }
});
