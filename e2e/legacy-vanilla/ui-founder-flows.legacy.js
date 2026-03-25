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
  fs.writeFileSync(path.join(dir, "CHANGELOG.md"), `# Changelog\n\n- ${label} baseline\n`, "utf8");
  fs.mkdirSync(path.join(dir, "docs"), { recursive: true });
  fs.mkdirSync(path.join(dir, "scripts"), { recursive: true });
  fs.mkdirSync(path.join(dir, "src"), { recursive: true });
  fs.writeFileSync(
    path.join(dir, "docs", "release-audit.md"),
    "# Shipping Audit\n\n- Pending verification\n- Pending packaging\n",
    "utf8"
  );
  fs.writeFileSync(
    path.join(dir, "docs", "handoff.md"),
    "# Session Handoff\n\n- Pending next operator\n",
    "utf8"
  );
  fs.writeFileSync(
    path.join(dir, "scripts", "release-checks.js"),
    "console.log('Shipping checks');\n",
    "utf8"
  );
  fs.writeFileSync(
    path.join(dir, "src", "main.js"),
    "module.exports = { bridge: 'main' };\n",
    "utf8"
  );
  fs.writeFileSync(
    path.join(dir, "src", "preload.js"),
    "module.exports = { bridge: 'preload' };\n",
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

async function launchApp(userDataDir, extraEnv = {}) {
  const app = await electron.launch({
    args: ["."],
    cwd: repoRoot,
    env: {
      ...process.env,
      ...extraEnv,
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
  // Use direct evaluate for robust workflow activation in seeding helper
  await page.evaluate(async () => {
    await window.NeuralShellRenderer.activateWorkflow("shipping_audit");
  });
  await expect(page.locator("#workflowTitleText")).toContainText("Shipping Audit");
  await page.selectOption("#outputModeSelect", "checklist");
  await page.evaluate(async ({ workspaceRoot }) => {
    const summary = await window.api.workspace.summarize(workspaceRoot);
    await window.NeuralShellRenderer.setWorkspaceAttachment(summary, {
      persist: false,
      announce: false
    });
    window.appState.lastArtifact = {
      workflowId: "shipping_audit",
      outputMode: "artifact",
      title: "Seeded artifact",
      generatedAt: new Date().toISOString(),
      content: "Seeded artifact content.\n- Line 1\n- Line 2"
    };
    window.NeuralShellRenderer.renderChat([
      { role: "user", content: "Audit the current shipping state." },
      { role: "assistant", content: "1. Verify runtime logs.\n2. Verify checksums.\n3. Verify offline bridge posture." }
    ]);
  }, { workspaceRoot });
  await expect(page.locator("#workspaceSummaryText")).toContainText(path.basename(workspaceRoot));
  await expect(page.locator("#artifactPreview")).toContainText("Verify runtime logs");
  await expect(page.locator("#operatorRail")).toContainText("Preview Markdown Report");
  await expect(page.locator("#operatorRail")).toContainText("Export Evidence Bundle");
  await expect(page.locator("#missionControlGrid")).toContainText("Workflow Lane");
  await expect(page.locator("#missionControlGrid")).toContainText("Context Lane");
  await expect(page.locator("#missionControlGrid")).toContainText("Shipping lane");
  await page.click("#systemWorkbenchBtn");
  await expect(page.locator("#workbenchApplyBtn")).toBeVisible();
  await expect(page.locator("#workbenchApplyBtn")).toBeEnabled();
  await page.click("#workbenchApplyBtn");
  await expect(page.locator("#workspaceActionList")).toContainText("Local only");
  await expect(page.locator("#workspaceActionList")).toContainText("Writes file");
  await page.click("#workbenchArtifactBtn");
}

function buildContextPackProfileFixture(workspaceDir, options = {}) {
  const filePaths = Array.isArray(options.filePaths) ? options.filePaths : [];
  return {
    id: String(options.id || ""),
    workspaceRoot: workspaceDir,
    workspaceLabel: path.basename(workspaceDir),
    workflowId: String(options.workflowId || ""),
    name: String(options.name || ""),
    filePaths,
    fileSnapshots: filePaths.map((relativePath) => ({
      relativePath,
      modifiedAt: fs.statSync(path.join(workspaceDir, relativePath)).mtime.toISOString()
    })),
    savedAt: String(options.savedAt || new Date().toISOString())
  };
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

    await page.click("#systemPerformanceBtn");
    await expect(page.locator("#systemPerformanceSection")).toBeVisible();
    await expect(page.locator("#systemWorkbenchSection")).toBeHidden();
    await page.click("#performanceTraceTrayBtn");
    await expect(page.locator("#performanceTraceTray")).toBeVisible();

    await page.click("#performanceDiagnosticsTrayBtn");
    await page.click("#runButtonAuditBtn");
    await expect(page.locator("#performanceOutputTray")).toBeVisible();
    await expect(page.locator("#performanceAuditOutputPanel")).toBeVisible();
    await expect(page.locator("#buttonAuditOutput")).toContainText("\"total\"");

    await page.click("#performanceChatLogsOutputBtn");
    await expect(page.locator("#performanceChatLogsOutputPanel")).toBeVisible();
  } finally {
    if (app) await app.close();
    rmUserDataDir(userDataDir);
  }
});

test("offline mode quick switch keeps live connection state clear", async () => {
  const userDataDir = mkUserDataDir("offline-quick-switch");
  let app = null;
  try {
    const { app: runningApp, page } = await launchApp(userDataDir);
    app = runningApp;
    await closeOnboardingViaSkip(page);

    await expect(page.locator("#offlineModeInput")).toBeChecked();
    await expect(page.locator("#offlineModeSummaryText")).toContainText("Offline Mode is on");
    await page.uncheck("#offlineModeInput", { force: true });
    await expect(page.locator("#statusLabel")).toContainText("Offline Mode turned off. Hosted profiles are available again.");
    await expect(page.locator("#offlineModeSummaryText")).toContainText("Offline Mode is off");

    await openSettingsMenu(page);
    await expect(page.locator("#allowRemoteBridgeInput")).toBeChecked();
    await expect(page.locator("#settingsConnectionModeText")).toContainText("Hosted lane is active");
  } finally {
    if (app) await app.close();
    rmUserDataDir(userDataDir);
  }
});

test("fresh launch defaults to bridge diagnostics and the artifact workbench surface", async () => {
  const userDataDir = mkUserDataDir("default-workflow");
  let app = null;
  try {
    const { app: runningApp, page } = await launchApp(userDataDir);
    app = runningApp;
    await closeOnboardingViaSkip(page);

    await expect(page.locator("#workflowTitleText")).toContainText("Bridge Diagnostics");
    await expect(page.locator("#threadTaskCapabilityText")).toContainText("Offline Mode on");
    await expect(page.locator("#workbenchArtifactBtn")).toHaveClass(/is-active/);
    await expect(page.locator("#artifactPreview")).toContainText("No artifact yet");
  } finally {
    if (app) await app.close();
    rmUserDataDir(userDataDir);
  }
});

test("workspace panes resize and inspector collapse persist across restart", async () => {
  const userDataDir = mkUserDataDir("workspace-layout");
  let app = null;
  try {
    let page;
    ({ app, page } = await launchApp(userDataDir));
    await closeOnboardingViaSkip(page);

    const leftPane = page.locator(".workspace-left-column");
    const leftBefore = await leftPane.boundingBox();
    expect(leftBefore).not.toBeNull();
    await page.locator("#leftPaneResizeHandle").focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");

    const leftAfter = await leftPane.boundingBox();
    expect(leftAfter).not.toBeNull();
    expect(leftAfter.width).toBeGreaterThan(leftBefore.width + 20);

    await page.click("#toggleRightPaneBtn");
    await expect(page.locator("#workspaceTopology")).toHaveClass(/is-right-collapsed/);
    await expect(page.locator(".workspace-right-column")).toBeHidden();

    await app.close();
    app = null;

    ({ app, page } = await launchApp(userDataDir));
    if (await page.locator("#onboardingOverlay").getAttribute("aria-hidden") !== "true") {
      await closeOnboardingViaSkip(page);
    }

    await expect(page.locator("#workspaceTopology")).toHaveClass(/is-right-collapsed/);
    await expect(page.locator(".workspace-right-column")).toBeHidden();
    const leftPersisted = await page.locator(".workspace-left-column").boundingBox();
    expect(leftPersisted).not.toBeNull();
    expect(Math.abs(leftPersisted.width - leftAfter.width)).toBeLessThan(32);

    await page.click("#toggleRightPaneBtn");
    await expect(page.locator(".workspace-right-column")).toBeVisible();
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

    await page.click("#systemContextBtn");
    await expect(page.locator("#systemContextSection")).toBeVisible();
    await expect(page.locator("#intelBriefTray")).toBeVisible();
    await expect(page.locator("#intelFocusText")).toContainText("Bridge Diagnostics");

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

test("repo context pack profiles build, reload, persist through session load, and enter evidence export", async () => {
  const userDataDir = mkUserDataDir("context-pack");
  const workspaceDir = mkWorkspaceDir("context-pack");
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

    await page.click('#workflowQuickActions button[data-workflow-id="bridge_diagnostics"]');
    await expect(page.locator("#workflowTitleText")).toContainText("Bridge Diagnostics");
    await page.click("#systemContextBtn");
    await expect(page.locator("#systemContextSection")).toBeVisible();
    await page.click("#suggestContextPackFilesBtn");
    await expect(page.locator("#contextPackPathsInput")).toHaveValue(/README\.md/);
    await expect(page.locator("#contextPackPathsInput")).toHaveValue(/package\.json/);
    await expect(page.locator("#contextPackPathsInput")).toHaveValue(/src\/main\.js/);
    await expect(page.locator("#contextPackPathsInput")).toHaveValue(/src\/preload\.js/);

    await page.fill("#contextPackNameInput", "Founder Workspace Pack");
    await page.fill("#contextPackPathsInput", "README.md\ndocs/release-audit.md");
    await page.click("#buildContextPackBtn");

    await expect(page.locator("#contextPackSummaryText")).toContainText("Founder Workspace Pack");
    await expect(page.locator("#contextPackPreview")).toContainText("README.md");
    await expect(page.locator("#contextPackPreview")).toContainText("Shipping Audit");
    await expect(page.locator("#knowledgeFeed")).toContainText("Context Pack");

    await page.click("#saveContextPackProfileBtn");
    await expect(page.locator("#contextPackProfileSelect")).toContainText("Founder Workspace Pack");
    await expect(page.locator("#contextPackProfileSelect")).toContainText("Bridge Diagnostics");
    await expect(page.locator("#contextPackWorkflowLinkText")).toContainText("Bridge Diagnostics recommends Founder Workspace Pack");
    await expect(page.locator("#loadRecommendedContextPackProfileBtn")).toBeDisabled();
    await expect(page.locator("#missionControlGrid")).toContainText("Context Lane");
    await expect(page.locator("#missionControlGrid")).toContainText("Auto-load off");
    await expect(page.locator("#missionControlGrid")).toContainText("Fresh");

    await page.click("#workflowSeedPromptBtn");
    await expect(page.locator("#promptInput")).toHaveValue(/Founder Workspace Pack/);

    fs.writeFileSync(path.join(workspaceDir, "README.md"), "# context-pack\n\nUpdated after profile save.\n", "utf8");

    await page.click('#workflowQuickActions button[data-workflow-id="shipping_audit"]');
    await page.click('#workflowQuickActions button[data-workflow-id="bridge_diagnostics"]');
    await expect(page.locator("#missionControlGrid")).toContainText("Stale");

    await page.click("#systemContextBtn");
    await page.click("#clearContextPackBtn");
    await expect(page.locator("#contextPackSummaryText")).toContainText("No context pack loaded");
    await page.click("#refreshContextPackProfileBtn");
    await expect(page.locator("#contextPackProfileStatusText")).toContainText("Profile snapshot refreshed from current repo files");
    await expect(page.locator("#contextPackSummaryText")).toContainText("Founder Workspace Pack");
    await expect(page.locator("#contextPackPreview")).toContainText("Updated after profile save");

    await page.click("#clearContextPackBtn");
    await page.click("#loadContextPackProfileBtn");
    await expect(page.locator("#contextPackProfileStatusText")).toContainText("Selected profile is current");

    await page.click('#workflowQuickActions button[data-workflow-id="shipping_audit"]');
    await page.click("#systemContextBtn");
    await expect(page.locator("#contextPackWorkflowLinkText")).toContainText("No saved context-pack profile is linked to Shipping Audit");
    await expect(page.locator("#loadRecommendedContextPackProfileBtn")).toBeDisabled();

    await page.selectOption("#contextPackProfileSelect", "");
    await page.fill("#contextPackNameInput", "Shipping workflow Pack");
    await page.click("#buildContextPackBtn");
    await page.click("#saveContextPackProfileBtn");
    await expect(page.locator("#contextPackProfileSelect")).toContainText("Shipping workflow Pack");
    await expect(page.locator("#contextPackProfileSelect")).toContainText("Shipping Audit");
    await expect(page.locator("#contextPackWorkflowLinkText")).toContainText("Shipping Audit recommends Shipping workflow Pack");
    await expect(page.locator("#loadRecommendedContextPackProfileBtn")).toBeDisabled();

    await page.click('#workflowQuickActions button[data-workflow-id="bridge_diagnostics"]');
    await page.click("#systemContextBtn");
    await expect(page.locator("#contextPackWorkflowLinkText")).toContainText("Bridge Diagnostics recommends Founder Workspace Pack");

    await page.click("#clearContextPackBtn");
    await expect(page.locator("#loadRecommendedContextPackProfileBtn")).toBeEnabled();
    await page.click("#loadRecommendedContextPackProfileBtn");
    await expect(page.locator("#contextPackSummaryText")).toContainText("Founder Workspace Pack");
    await expect(page.locator("#contextPackWorkflowLinkText")).toContainText("already loaded");

    await openSettingsMenu(page);
    await page.check("#autoLoadRecommendedContextProfileInput");
    await page.click("#applySettingsBtn");
    await expect(page.locator("#statusLabel")).toContainText("Settings applied.");
    await closeSettingsMenu(page);

    await page.click("#clearContextPackBtn");
    await page.click('#workflowQuickActions button[data-workflow-id="shipping_audit"]');
    await expect(page.locator("#contextPackSummaryText")).toContainText("Shipping workflow Pack");
    await expect(page.locator("#contextPackWorkflowLinkText")).toContainText("already loaded");
    await expect(page.locator("#statusLabel")).toContainText("Auto-loaded context profile: Shipping workflow Pack");
    await expect(page.locator("#missionControlGrid")).toContainText("Auto-load on");
    await expect(page.locator("#missionControlGrid")).toContainText("Shipping workflow Pack");

    await page.click("#systemContextBtn");
    await page.click("#clearContextPackBtn");
    await page.click('#workflowQuickActions button[data-workflow-id="bridge_diagnostics"]');
    await expect(page.locator("#contextPackSummaryText")).toContainText("Founder Workspace Pack");
    await expect(page.locator("#contextPackWorkflowLinkText")).toContainText("already loaded");
    await expect(page.locator("#statusLabel")).toContainText("Auto-loaded context profile: Founder Workspace Pack");
    await expect(page.locator("#missionControlGrid")).toContainText("Founder Workspace Pack");

    await page.evaluate(({ workspaceDir }) => {
      window.NeuralShellRenderer.setPatchPlan({
        id: "context-pack-provenance-plan",
        workflowId: "bridge_diagnostics",
        title: "Context-Aware Patch Plan",
        summary: "Carry the active repo memory into patch review metadata.",
        rootPath: workspaceDir,
        verification: ["Run lint", "Verify bridge posture"],
        files: [
          {
            path: "docs/release-audit.md",
            rationale: "Add a context-linked verification note.",
            content: "# Shipping Audit\n\n- Pending verification\n- Pending packaging\n- Context-linked patch review active\n"
          }
        ]
      }, {
        workflowId: "bridge_diagnostics"
      });
    }, { workspaceDir });
    await expect(page.locator("#patchPlanProvenanceText")).toContainText("Context Pack: Founder Workspace Pack");
    await expect(page.locator("#patchPlanFileList")).toContainText("Context Provenance");

    const bundle = await page.evaluate(() => window.NeuralShellRenderer.buildEvidenceBundle());
    expect(bundle.contextPack.name).toBe("Founder Workspace Pack");
    expect(bundle.contextPack.entries).toHaveLength(2);
    expect(bundle.contextPack.filePaths).toContain("README.md");
    expect(Array.isArray(bundle.contextPackProfiles)).toBeTruthy();
    expect(bundle.contextPackProfiles).toHaveLength(2);
    expect(bundle.activeContextPackProfileId).toBeTruthy();
    expect(bundle.contextPackProfiles.some((profile) => profile.workflowId === "bridge_diagnostics")).toBeTruthy();
    expect(bundle.contextPackProfiles.some((profile) => profile.workflowId === "shipping_audit")).toBeTruthy();

    await page.fill("#sessionName", "Context-Pack-Session");
    await page.fill("#sessionPass", "ContextPackPass1!");
    await page.click("#saveSessionBtn");

    await page.click("#systemContextBtn");
    await page.click("#deleteContextPackProfileBtn");
    await expect(page.locator("#contextPackProfileSelect")).not.toContainText("Founder Workspace Pack | 2 files | Bridge Diagnostics");

    await page.click("#loadSessionBtn");
    await expect(page.locator("#statusLabel")).toContainText("Session loaded");
    await expect(page.locator("#contextPackProfileSelect")).toContainText("Founder Workspace Pack");
    await expect(page.locator("#contextPackProfileSelect")).toContainText("Shipping workflow Pack");
    await expect(page.locator("#contextPackSummaryText")).toContainText("Founder Workspace Pack");
    await expect(page.locator("#contextPackPreview")).toContainText("Shipping Audit");
    await expect(page.locator("#contextPackWorkflowLinkText")).toContainText("Bridge Diagnostics recommends Founder Workspace Pack");
  } finally {
    if (app) await app.close();
    rmUserDataDir(userDataDir);
    rmUserDataDir(workspaceDir);
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

test("command palette routes workflow-linked context actions", async () => {
  const userDataDir = mkUserDataDir("palette-context");
  const workspaceDir = mkWorkspaceDir("palette-context");
  const founderProfile = buildContextPackProfileFixture(workspaceDir, {
    id: "context-pack-profile-founder",
    workflowId: "bridge_diagnostics",
    name: "Founder Workspace Pack",
    filePaths: ["README.md", "docs/release-audit.md"],
    savedAt: "2026-03-10T08:20:00.000Z"
  });
  const releaseProfile = buildContextPackProfileFixture(workspaceDir, {
    id: "context-pack-profile-release",
    workflowId: "shipping_audit",
    name: "Shipping workflow Pack",
    filePaths: ["README.md", "package.json"],
    savedAt: "2026-03-10T08:25:00.000Z"
  });
  let app = null;
  try {
    const { app: runningApp, page } = await launchApp(userDataDir);
    app = runningApp;
    await closeOnboardingViaSkip(page);

    await page.evaluate(async ({ workspaceRoot, profiles }) => {
      const summary = await window.api.workspace.summarize(workspaceRoot);
      await window.NeuralShellRenderer.setWorkspaceAttachment(summary, {
        persist: false,
        announce: false
      });
      await window.NeuralShellRenderer.setContextPackProfiles(profiles, {
        persist: false,
        announce: false
      });
      await window.NeuralShellRenderer.activateWorkflow("bridge_diagnostics", {
        persist: false,
        announce: false,
        autoLoadRecommendedProfile: false
      });
    }, {
      workspaceRoot: workspaceDir,
      profiles: [founderProfile, releaseProfile]
    });

    await page.keyboard.press(paletteShortcut);
    await expect(page.locator("#commandPaletteOverlay")).toHaveAttribute("aria-hidden", "false");
    await page.fill("#commandPaletteInput", "context:");
    await expect(page.locator("#commandPaletteList")).toContainText("Repo Context");
    await expect(page.locator("#commandPaletteList")).toContainText("Context Profiles");
    await expect(page.locator("#commandPaletteList")).toContainText("Suggest Context Files");
    await expect(page.locator("#commandPaletteList")).toContainText("Load Recommended Context Profile");
    await expect(page.locator("#commandPaletteList")).toContainText("Refresh Recommended Context Profile");
    await expect(page.locator("#commandPaletteList")).not.toContainText("Toggle Theme");

    await page.locator("#commandPaletteList .palette-item").filter({ hasText: "Suggest Context Files" }).click();
    await expect(page.locator("#commandPaletteOverlay")).toHaveAttribute("aria-hidden", "true");
    await expect(page.locator("#contextPackPathsInput")).toHaveValue(/README\.md/);
    await expect(page.locator("#contextPackPathsInput")).toHaveValue(/src\/main\.js/);
    await expect(page.locator("#contextPackPathsInput")).toHaveValue(/src\/preload\.js/);

    await page.keyboard.press(paletteShortcut);
    await page.fill("#commandPaletteInput", "Load Recommended Context Profile");
    await page.locator("#commandPaletteList .palette-item").filter({ hasText: "Load Recommended Context Profile" }).click();
    await expect(page.locator("#contextPackSummaryText")).toContainText("Founder Workspace Pack");
    await expect(page.locator("#contextPackPreview")).toContainText("README.md");
    await expect(page.locator("#missionControlGrid")).toContainText("Founder Workspace Pack");

    await page.click('#workflowQuickActions button[data-workflow-id="session_handoff"]');
    await expect(page.locator("#contextPackWorkflowLinkText")).toContainText("No saved context-pack profile is linked to Session Handoff");

    await page.keyboard.press(paletteShortcut);
    await page.fill("#commandPaletteInput", "Save Current Context Pack as Workflow Profile");
    await expect(page.locator("#commandPaletteList")).toContainText("Save Current Context Pack as Workflow Profile");
    await page.locator("#commandPaletteList .palette-item").filter({ hasText: "Save Current Context Pack as Workflow Profile" }).click();
    await expect(page.locator("#statusLabel")).toContainText("Context pack profile saved: Founder Workspace Pack");
    await expect(page.locator("#contextPackProfileSelect")).toContainText("Session Handoff");
    await expect(page.locator("#contextPackWorkflowLinkText")).toContainText("Session Handoff recommends Founder Workspace Pack");

    fs.writeFileSync(
      path.join(workspaceDir, "README.md"),
      "# palette-context\n\nUpdated after palette refresh\n",
      "utf8"
    );

    await page.keyboard.press(paletteShortcut);
    await page.fill("#commandPaletteInput", "Refresh Recommended Context Profile");
    await page.locator("#commandPaletteList .palette-item").filter({ hasText: "Refresh Recommended Context Profile" }).click();
    await expect(page.locator("#contextPackProfileStatusText")).toContainText("Profile snapshot refreshed from current repo files");
    await expect(page.locator("#contextPackPreview")).toContainText("Updated after palette refresh");
    await expect(page.locator("#missionControlGrid")).toContainText("Fresh");

    await page.click('#workflowQuickActions button[data-workflow-id="shipping_audit"]');
    await page.keyboard.press(paletteShortcut);
    await page.fill("#commandPaletteInput", "profile: founder workspace");
    await expect(page.locator("#commandPaletteList")).toContainText("Context Profiles");
    await expect(page.locator("#commandPaletteList")).toContainText("Select Context Profile: Founder Workspace Pack");
    await expect(page.locator("#commandPaletteList .palette-match").first()).toBeVisible();
    await page.locator("#commandPaletteList .palette-item").filter({ hasText: "Select Context Profile: Founder Workspace Pack" }).first().click();
    await expect(page.locator("#statusLabel")).toContainText("Context profile selected: Founder Workspace Pack");
    await expect(page.locator("#contextPackWorkflowLinkText")).toContainText("Shipping Audit recommends Shipping workflow Pack");

    await page.keyboard.press(paletteShortcut);
    await page.fill("#commandPaletteInput", "Re-link Selected Context Profile to Current Workflow");
    await expect(page.locator("#commandPaletteList")).toContainText("Re-link Selected Context Profile to Current Workflow");
    await page.locator("#commandPaletteList .palette-item").filter({ hasText: "Re-link Selected Context Profile to Current Workflow" }).click();
    await expect(page.locator("#statusLabel")).toContainText("Context pack profile linked to Shipping Audit: Founder Workspace Pack");
    await expect(page.locator("#contextPackWorkflowLinkText")).toContainText("Shipping Audit recommends Founder Workspace Pack");
    await expect(page.locator("#contextPackProfileSelect")).toContainText("Founder Workspace Pack | 2 files | Shipping Audit");

    await page.keyboard.press(paletteShortcut);
    await page.fill("#commandPaletteInput", "profile: Shipping workflow");
    await expect(page.locator("#commandPaletteList")).toContainText("Delete Context Profile: Shipping workflow Pack");
    await page.locator("#commandPaletteList .palette-item").filter({ hasText: "Delete Context Profile: Shipping workflow Pack" }).click();
    await expect(page.locator("#statusLabel")).toContainText("Context pack profile removed: Shipping workflow Pack");
    await expect(page.locator("#contextPackProfileSelect")).not.toContainText("Shipping workflow Pack");
    await expect(page.locator("#contextPackWorkflowLinkText")).toContainText("Shipping Audit recommends Founder Workspace Pack");
  } finally {
    if (app) await app.close();
    rmUserDataDir(userDataDir);
    rmUserDataDir(workspaceDir);
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
    await page.selectOption("#profileProviderSelect", "openai");
    await page.fill("#profileBaseUrlInput", "https://api.openai.com");
    await page.fill("#profileApiKeyInput", "sk-e2e-test");
    await page.click("#profileTestBtn");
    await expect(page.locator("#statusLabel")).toContainText("Profile test failed:");
    await expect(page.locator("#profileTestResultText")).toContainText("Offline Mode is on. Hosted bridges are blocked.");
    await expect(page.locator("#profileTestHintText")).toContainText("Turn Offline Mode off");

    await page.fill("#profileBaseUrlInput", "http://127.0.0.1:11434");
    await page.selectOption("#profileProviderSelect", "ollama");
    await page.fill("#profileApiKeyInput", "");
    await page.fill("#profileTimeoutInput", "18000");
    await page.fill("#profileRetryInput", "3");
    await page.selectOption("#profileDefaultModelSelect", "mistral");
    await page.click("#profileSaveBtn");
    await page.click("#profileUseBtn");

    await page.selectOption("#themeSelect", "light");
    await page.fill("#tokenBudgetInput", "2048");
    await page.fill("#autosaveNameInput", "e2e-autosave");
    await page.fill("#autosaveIntervalInput", "12");
    await page.check("#autosaveEnabledInput");
    await page.check("#connectOnStartupInput");
    await page.uncheck("#allowRemoteBridgeInput");
    await page.check("#autoLoadRecommendedContextProfileInput");
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
    await expect(page.locator("#autoLoadRecommendedContextProfileInput")).toBeChecked();
    await expect(page.locator("#profileNameInput")).toHaveValue("E2E Profile");
    await expect(page.locator("#profileProviderSelect")).toHaveValue("ollama");
    await expect(page.locator("#profileTimeoutInput")).toHaveValue("18000");
    await expect(page.locator("#profileRetryInput")).toHaveValue("3");
    await expect(page.locator("#profileDefaultModelSelect")).toHaveValue("mistral");
    await expect(page.locator("#workspaceModeText")).toContainText("Offline Mode on");
    await expect(page.locator("#modelSummary")).toContainText("mistral");

    const profileOptions = await page.locator("#profileSelect option").allTextContents();
    expect(profileOptions.some((text) => String(text).includes("E2E Profile"))).toBeTruthy();
  } finally {
    if (app) await app.close();
    rmUserDataDir(userDataDir);
  }
});

test("provider presets seed the draft form and env-backed hosted profiles import cleanly", async () => {
  const userDataDir = mkUserDataDir("env-profiles");
  let app = null;
  try {
    const { app: runningApp, page } = await launchApp(userDataDir, {
      OPENAI_API_KEY: "sk-openai-e2e",
      OPENROUTER_API_KEY: "sk-openrouter-e2e"
    });
    app = runningApp;
    await closeOnboardingViaSkip(page);
    await openSettingsMenu(page);

    await expect(page.locator("#envProfileSummaryText")).toContainText("2 env-backed providers ready");

    const groqCard = page.locator('#providerPresetList [data-provider-id="groq"]');
    await groqCard.getByRole("button", { name: "Load Preset" }).click();
    await expect(page.locator("#profileProviderSelect")).toHaveValue("groq");
    await expect(page.locator("#profileBaseUrlInput")).toHaveValue("https://api.groq.com/openai");
    await expect(page.locator("#profileTestResultText")).toContainText("Groq preset loaded");
    await expect(page.locator("#profileTestHintText")).toContainText("Offline Mode off");
    await expect(page.locator("#profileTestHintText")).toContainText("paste an API key for Groq");

    await page.click("#importEnvProfilesBtn");
    await expect(page.locator("#statusLabel")).toContainText("Imported 2 env-backed provider profiles.");
    await expect(page.locator("#allowRemoteBridgeInput")).toBeChecked();
    await expect(page.locator("#envProfileSummaryText")).toContainText("2 already imported");
    const openAiCard = page.locator('#providerPresetList [data-provider-id="openai"]');
    await expect(openAiCard).toContainText("Quick switch uses OpenAI (Env)");
    await openAiCard.getByRole("button", { name: "Use Profile" }).click();
    await expect(page.locator("#statusLabel")).toContainText("Profile active: OpenAI (Env)");
    await expect(page.locator("#profileSelect")).toHaveValue("env-openai");
    await expect(page.locator("#settingsProviderSummaryText")).toContainText("OpenAI");
    await expect(page.locator("#settingsProviderSummaryText")).toContainText("Hosted provider live");
    await expect(page.locator("#modelSummary")).toContainText("gpt-4.1-mini");

    await page.selectOption("#profileSelect", "env-openai");
    await expect(page.locator("#profileProviderSelect")).toHaveValue("openai");
    await expect(page.locator("#profileApiKeyInput")).toHaveValue("sk-openai-e2e");
    await expect(page.locator("#profileDefaultModelSelect")).toHaveValue("gpt-4.1-mini");

    await page.selectOption("#profileSelect", "env-openrouter");
    await expect(page.locator("#profileProviderSelect")).toHaveValue("openrouter");
    await expect(page.locator("#profileApiKeyInput")).toHaveValue("sk-openrouter-e2e");

    await page.uncheck("#allowRemoteBridgeInput");
    await page.click("#applySettingsBtn");
    await expect(page.locator("#statusLabel")).toContainText("Live bridge reverted to Local Ollama while Offline Mode is on.");
    await expect(page.locator("#settingsProviderSummaryText")).toContainText("OpenRouter selected");
    await expect(page.locator("#settingsProviderSummaryText")).toContainText("live bridge: Ollama (Local)");
    await expect(page.locator("#modelSummary")).toContainText("llama3");

    await openAiCard.getByRole("button", { name: "Use Profile" }).click();
    await expect(page.locator("#statusLabel")).toContainText("Turn Offline Mode off before using OpenAI.");
    await expect(page.locator("#profileTestResultText")).toContainText("Offline Mode is on");
    await expect(page.locator("#modelSummary")).toContainText("llama3");
  } finally {
    if (app) await app.close();
    rmUserDataDir(userDataDir);
  }
});

test("thread rail surfaces recent encrypted sessions and loads them from chat ops", async () => {
  const userDataDir = mkUserDataDir("thread-rail");
  let app = null;
  try {
    const { app: runningApp, page } = await launchApp(userDataDir);
    app = runningApp;
    await closeOnboardingViaSkip(page);

    await page.evaluate(() => {
      window.NeuralShellRenderer.renderChat([
        { role: "user", content: "alpha thread request" },
        { role: "assistant", content: "alpha thread reply" }
      ], { syncArtifact: false });
    });
    await page.fill("#sessionName", "alpha-thread");
    await page.fill("#sessionPass", "ThreadPass123!");
    await page.click("#saveSessionBtn");
    await expect(page.locator("#statusLabel")).toContainText("Session saved: alpha-thread");

    await page.evaluate(() => {
      window.NeuralShellRenderer.renderChat([
        { role: "user", content: "beta thread request" },
        { role: "assistant", content: "beta thread reply" }
      ], { syncArtifact: false });
    });
    await page.fill("#sessionName", "beta-thread");
    await page.click("#saveSessionBtn");
    await expect(page.locator("#statusLabel")).toContainText("Session saved: beta-thread");

    const rail = page.locator("#sessionChatHeadRail");
    await expect(rail).toContainText("Current Draft");
    await expect(rail).toContainText("alpha-thread");
    await expect(rail).toContainText("beta-thread");
    await expect(page.locator("#inboxGroupStatusText")).toContainText("2 saved threads");
    await expect(page.locator("#threadTaskFocusText")).toContainText("beta-thread");
    await rail.locator(".thread-head-card").filter({ hasText: "alpha-thread" }).locator(".thread-head-pin").click();
    await page.click("#inboxFilterPinnedBtn");
    await expect(page.locator("#threadRailSummaryText")).toContainText("Pinned only");
    await expect(rail).toContainText("alpha-thread");
    await expect(rail).not.toContainText("beta-thread");
    await page.click("#inboxFilterAllBtn");

    await rail.locator(".thread-head-card").filter({ hasText: "alpha-thread" }).click();
    await expect(page.locator("#statusLabel")).toContainText("Session loaded: alpha-thread");
    await expect(page.locator("#chatHistory")).toContainText("alpha thread reply");
    await expect(page.locator("#chatHistory")).not.toContainText("beta thread reply");
    await expect(page.locator("#inboxFocusText")).toContainText("alpha-thread is loaded now");
    await expect(page.locator("#threadTaskFocusText")).toContainText("alpha-thread");
    await expect(page.locator("#inboxFilterSummaryText")).toContainText("1 pinned");
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
    await expect(page.locator("#statusLabel")).toContainText("Session loaded");
    await expect(page.locator("#workflowTitleText")).toContainText("Shipping Audit");
    await expect(page.locator("#workspaceSummaryText")).toContainText(path.basename(workspaceDir));
    await expect(page.locator("#artifactPreview")).toContainText("Verify runtime logs");

    await page.click("#systemWorkbenchBtn");
    await expect(page.locator("#systemWorkbenchSection")).toBeVisible();
    await page.click("#exportEvidenceBundleBtn");
    await expect(page.locator("#statusLabel")).toContainText("Evidence bundle exported");

    await page.click("#workbenchApplyBtn");
    await page.fill("#workspaceEditPathInput", "docs/release-audit.md");
    await page.fill(
      "#workspaceEditContentInput",
      "# Shipping Audit\n\n- Renderer and IPC guards verified\n- Offline bridge posture healthy\n"
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
    expect(bundle.payload.workflowId).toBe("shipping_audit");
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
  const notesPath = path.join(workspaceDir, "docs", "Shipping Audit Notes.md");
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

    await page.click("#systemWorkbenchBtn");
    await page.click("#workbenchApplyBtn");

    await page.fill("#workspaceEditPathInput", "docs/Shipping Audit Notes.md");
    await page.fill(
      "#workspaceEditContentInput",
      "# Shipping Audit Notes\n\n- Allow spaces in guarded file edits.\n"
    );
    await page.click("#previewWorkspaceEditBtn");
    await expect(page.locator("#workspaceActionPreviewMeta")).toContainText("Diff preview");
    await expect(page.locator("#workspaceActionPreview")).toContainText("Shipping Audit Notes.md");

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

test("Shipping Cockpit stages guarded Shipping checks and reflects partial verification", async () => {
  test.setTimeout(300000);
  const userDataDir = mkUserDataDir("shipping-cockpit");
  let app = null;
  try {
    const { app: runningApp, page } = await launchApp(userDataDir);
    app = runningApp;
    page.on('console', msg => console.log('BROWSER:', msg.text()));
    console.log('Test 17: App launched');
    await closeOnboardingViaSkip(page);
    console.log('Test 17: Onboarding closed');
    await seedWorkflowWorkspaceAndArtifact(page, repoRoot);
    console.log('Test 17: Seeding complete');
    await page.evaluate(async ({ workspaceRoot }) => {
      console.log('Test 17: evaluate: Setting context profiles');
      const summary = await window.api.workspace.summarize(workspaceRoot);
      const filePaths = ["README.md", "package.json"];
      const stats = await window.api.workspace.statFiles(workspaceRoot, filePaths);
      const fileSnapshots = stats
        .filter((row) => row && row.exists !== false)
        .map((row) => ({
          relativePath: row.relativePath,
          modifiedAt: row.modifiedAt
        }));
      await window.NeuralShellRenderer.setContextPackProfiles([
        {
          id: "shipping-packet-context-profile",
          workspaceRoot,
          workspaceLabel: summary.label,
          workflowId: "shipping_audit",
          name: "Shipping Packet Context Pack",
          filePaths,
          fileSnapshots,
          savedAt: "2026-03-10T08:29:10.000Z"
        }
      ], {
        persist: false
      });
      console.log('Test 17: evaluate: Loading context profile');
      await window.NeuralShellRenderer.loadContextPackProfile("shipping-packet-context-profile", {
        persist: false,
        announce: false
      });
      await window.NeuralShellRenderer.setSystemSurface("shipping");
      await window.NeuralShellRenderer.renderShippingCockpit();
      console.log('Test 17: evaluate: Setup complete');
    }, { workspaceRoot: repoRoot });

    console.log('Test 17: Waiting for cockpit title');
    const actualTitle = await page.evaluate(() => document.querySelector("#shippingCockpitTitleText")?.innerText);
    const workflowTitle = await page.evaluate(() => document.querySelector("#workflowTitleText")?.innerText);
    console.log('Test 17: Verifying cockpit state');
    const titleText = await page.evaluate(() => document.querySelector("#shippingCockpitTitleText")?.innerText || "");
    const metaText = await page.evaluate(() => document.querySelector("#shippingCockpitMetaRow")?.innerText || "");
    const blockerText = await page.evaluate(() => document.querySelector("#shippingCockpitBlockerList")?.innerText || "");

    console.log(`Test 17: Title: "${titleText}"`);
    console.log(`Test 17: Meta: "${metaText}"`);
    console.log(`Test 17: Blockers: "${blockerText}"`);

    expect(titleText.toLowerCase()).toContain("shipping blockers active");
    expect(metaText.toLowerCase()).toContain("shipping audit");
    expect(metaText.toLowerCase()).toContain("blocked");
    expect(blockerText.toLowerCase()).toContain("shipping cockpit checks have not been staged yet.");

    await page.click("#stageShippingCockpitBtn");
    await expect(page.locator("#systemWorkbenchBtn")).toHaveClass(/is-active/);
    await expect(page.locator("#verificationRunTitleText")).toContainText("Shipping Cockpit Verification");
    await expect(page.locator("#verificationRunList")).toContainText("Run lint");
    await expect(page.locator("#verificationRunList")).toContainText("Run founder e2e");
    await expect(page.locator("#verificationRunList")).toContainText("Refresh store screenshots");

    const founderCard = page.locator("#verificationRunList .workspace-action-card").filter({ hasText: "Run founder e2e" });
    const screenshotCard = page.locator("#verificationRunList .workspace-action-card").filter({ hasText: "Refresh store screenshots" });
    await founderCard.locator('input[type="checkbox"]').uncheck();
    await screenshotCard.locator('input[type="checkbox"]').uncheck();

    await page.click("#runVerificationPlanBtn");
    await expect(page.locator("#statusLabel")).toContainText("Verification run complete", { timeout: 240000 });
    console.log('Test 17: Verification run complete');
    const titleAfter = await page.evaluate(() => document.querySelector("#shippingCockpitTitleText")?.innerText || "");
    const blockersAfter = await page.evaluate(() => document.querySelector("#shippingCockpitBlockerList")?.innerText || "");
    console.log(`Test 17: Title After: "${titleAfter}"`);
    console.log(`Test 17: Blockers After: "${blockersAfter}"`);
    await expect(page.locator("#systemShippingBtn")).toHaveClass(/is-active/);
    await expect(page.locator("#shippingCockpitTitleText")).toContainText("Build the shipping packet", { timeout: 240000 });
    await expect(page.locator("#shippingCockpitMetaRow")).toContainText("Ready");
    await expect(page.locator("#shippingCockpitMetaRow")).toContainText("1 passed");
    await expect(page.locator("#shippingCockpitBlockerList")).toContainText("No active ship blockers");
    await page.click("#systemWorkbenchBtn");
    await expect(page.locator("#verificationRunOutput")).toContainText("Command: npm run lint");
    await expect(page.locator("#verificationRunOutput")).not.toContainText("npm run test:e2e");
    await expect(page.locator("#verificationRunOutput")).not.toContainText("npm run channel:store:screenshots");

    await page.click("#systemShippingBtn");
    await page.click("#buildShippingPacketBtn");
    await expect(page.locator("#statusLabel")).toContainText("Shipping Packet built");
    await expect(page.locator("#artifactTitleText")).toContainText("Shipping Packet");
    await expect(page.locator("#artifactMetaText")).toContainText("Shipping Packet");
    await expect(page.locator("#artifactMetaText")).toContainText("linked run");
    await expect(page.locator("#artifactPreview")).toContainText("Decision: Ready");
    await expect(page.locator("#artifactPreview")).toContainText("## Verification");
    await expect(page.locator("#artifactPreview")).toContainText("## Verification Provenance");
    await expect(page.locator("#artifactPreview")).toContainText("[PASSED] Run lint");
    await expect(page.locator("#artifactPreview")).toContainText("Context Pack Snapshot: Shipping Packet Context Pack | 2 files");
    await expect(page.locator("#artifactPreview")).toContainText("Context Pack Profile: Shipping Packet Context Pack | 2 files | saved 2026-03-10T08:29:10.000Z");
    await expect(page.locator("#shippingCockpitTitleText")).toContainText("Shipping Packet ready");
    await expect(page.locator("#shippingCockpitMetaRow")).toContainText("Packet built");

    const bundle = await page.evaluate(async () => {
      return window.NeuralShellRenderer.buildEvidenceBundle();
    });
    expect(bundle.verificationRunPlan.groupId).toBe("release_cockpit");
    expect(bundle.verificationRunPlan.rootPath).toBe(repoRoot);
    expect(bundle.artifact.outputMode).toBe("shipping_packet");
    expect(Array.isArray(bundle.verificationRunHistory)).toBeTruthy();
    expect(bundle.verificationRunHistory[0].groupId).toBe("release_cockpit");
    expect(bundle.artifact.provenance).toBeTruthy();
    expect(bundle.artifact.provenance.verification.runIds[0]).toBe(bundle.verificationRunHistory[0].runId);
    expect(bundle.artifact.provenance.workspaceRoot).toBe(repoRoot);
    expect(bundle.artifact.provenance.contextPack.name).toBe("Shipping Packet Context Pack");
    expect(bundle.artifact.provenance.contextPack.fileCount).toBe(2);
    expect(bundle.artifact.provenance.contextPack.filePaths).toEqual(expect.arrayContaining(["README.md", "package.json"]));
    expect(bundle.artifact.provenance.contextPackProfile.name).toBe("Shipping Packet Context Pack");
    expect(bundle.artifact.provenance.contextPackProfile.fileCount).toBe(2);
    expect(bundle.artifact.id).toBeTruthy();
    expect(bundle.artifact.provenance.lineage.packetId).toBe(bundle.artifact.id);
    expect(bundle.artifact.provenance.lineage.generation).toBe(1);
    const lintCheck = bundle.verificationRunPlan.checks.find((check) => check.id === "lint");
    const founderCheck = bundle.verificationRunPlan.checks.find((check) => check.id === "founder_e2e");
    const screenshotCheck = bundle.verificationRunPlan.checks.find((check) => check.id === "store_screenshots");
    expect(lintCheck).toBeTruthy();
    expect(lintCheck.status).toBe("passed");
    expect(founderCheck.selected).toBe(false);
    expect(screenshotCheck.selected).toBe(false);

    await page.evaluate(async () => {
      await window.NeuralShellRenderer.buildShippingPacketArtifact({
        generatedAt: "2026-03-10T08:31:20.000Z"
      });
    });
    await expect(page.locator("#artifactHistoryList .artifact-history-card")).toHaveCount(2);
    await expect(page.locator("#artifactCompareDiffList")).toContainText("Revision");
    await expect(page.locator("#artifactCompareLeftPreview")).toContainText("# Shipping Packet");
    await expect(page.locator("#artifactCompareRightPreview")).toContainText("# Shipping Packet");
    const lineage = await page.evaluate(async () => {
      const currentBundle = await window.NeuralShellRenderer.buildEvidenceBundle();
      return {
        current: currentBundle.artifact.provenance.lineage,
        history: currentBundle.shippingPacketHistory.map((item) => ({
          id: item.id,
          lineage: item.provenance ? item.provenance.lineage : null
        }))
      };
    });
    expect(lineage.current.packetId).toBeTruthy();
    expect(lineage.current.parentPacketId).toBe(bundle.artifact.id);
    expect(lineage.current.generation).toBe(2);
    expect(lineage.history.some((item) => item.id === lineage.current.packetId)).toBeTruthy();

    await page.evaluate(async () => {
      await window.NeuralShellRenderer.buildShippingPacketArtifact({
        generatedAt: "2026-03-10T08:29:20.000Z"
      });
    });
    await expect(page.locator("#artifactHistoryList .artifact-history-card")).toHaveCount(3);
    const firstHistoryCard = page.locator("#artifactHistoryList .artifact-history-card").first();
    const thirdHistoryCard = page.locator("#artifactHistoryList .artifact-history-card").nth(2);
    await thirdHistoryCard.locator("button", { hasText: "Set Compare A" }).click();
    await expect(page.locator("#statusLabel")).toContainText("Shipping Packet loaded into compare A.");
    await firstHistoryCard.locator("button", { hasText: "Set Compare B" }).click();
    await expect(page.locator("#statusLabel")).toContainText("Shipping Packet loaded into compare B.");
    await expect(page.locator("#artifactCompareMetaText")).toContainText("Revision");

    const loadToDockButton = page.locator("#artifactHistoryList .artifact-history-card button", { hasText: "Load to Dock" }).first();
    await loadToDockButton.click();
    await expect(page.locator("#statusLabel")).toContainText("Shipping Packet loaded into the dock.");
    await expect(page.locator("#artifactHistoryList .artifact-history-card button", { hasText: "Loaded in Dock" })).toHaveCount(1);

    await page.fill("#sessionName", "shippingPacketHistory");
    await page.fill("#sessionPass", "PacketHistoryPassphrase1!");
    await page.click("#saveSessionBtn");
    await expect(page.locator("#statusLabel")).toContainText("Session saved: shippingPacketHistory");

    await page.click("#clearArtifactHistoryBtn");
    await expect(page.locator("#artifactHistoryList")).toContainText("No shipping packets yet.");

    await page.click("#loadSessionBtn");
    await expect(page.locator("#statusLabel")).toContainText("Session loaded: shippingPacketHistory");
    await page.waitForFunction(() => (
      Array.isArray(window.appState.shippingPacketHistory) &&
      window.appState.shippingPacketHistory.length === 3
    ));
    await page.click("#systemShippingBtn");
    await page.evaluate(() => {
      window.NeuralShellRenderer.renderShippingCockpit();
      if (typeof window.renderArtifactHistory === "function") {
        window.renderArtifactHistory();
      }
    });
    await page.waitForFunction(() => (
      document.querySelectorAll("#artifactHistoryList .artifact-history-card").length === 3
    ), { timeout: 60000 });
    await expect(page.locator("#artifactHistoryList .artifact-history-card")).toHaveCount(3);
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
  fs.writeFileSync(
    notesPath,
    [
      "# Shipping Audit",
      "",
      "- Pending verification",
      "- Pending packaging",
      "- Pending evidence",
      "- Pending runtime check",
      "- Pending session handoff",
      "- Pending docs pass",
      "- Pending store screenshots",
      "- Pending final signoff",
      ""
    ].join("\n"),
    "utf8"
  );
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
            content: [
              "# Shipping Audit",
              "",
              "- Renderer guardrails verified",
              "- Pending packaging",
              "- Pending evidence",
              "- Pending runtime check",
              "- Pending session handoff",
              "- Pending docs pass",
              "- Pending store screenshots",
              "- Offline bridge posture verified",
              ""
            ].join("\n")
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
    await expect(page.locator("#patchPlanFileList")).toContainText("hunks accepted");
    await expect(page.locator("#patchPlanFileList")).toContainText("Low risk");
    await expect(page.locator("#patchPlanFileList")).toContainText("Review copy and exported artifact output.");
    const notesCard = page.locator("#patchPlanFileList .workspace-action-card").filter({
      hasText: "docs/release-audit.md"
    });
    await expect(notesCard).toContainText("Accept hunk");
    await expect(notesCard.locator(".patch-plan-hunk-card")).toHaveCount(3);
    await notesCard.locator(".patch-plan-hunk-card").nth(2).locator('input[type="checkbox"]').uncheck();
    await expect(notesCard).toContainText("2/3 hunks accepted");
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
          workflowId: "shipping_audit",
          groupId: "interface",
          groupTitle: "Interface Surface",
          label: "Verify Release Interface Surface",
          detail: "Shipping Audit shortcut | 2 files | Run lint and founder e2e after apply.",
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
    await expect(page.locator("#commandPaletteList")).toContainText("Verify Runtime Surface");
    await expect(page.locator("#commandPaletteList")).not.toContainText("Verify Release Interface Surface");
    await page.selectOption("#commandPaletteShortcutScope", "all");
    await expect(page.locator("#commandPaletteList")).toContainText("Verify Release Interface Surface");
    await page.locator("#commandPaletteList .palette-item").filter({ hasText: "Verify Runtime Surface" }).click();
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
    await readmeCard.locator('label.checkbox-field').filter({ hasText: "Selected" }).locator('input[type="checkbox"]').uncheck();

    await page.click("#applySelectedPatchPlanBtn");
    await expect(page.locator("#statusLabel")).toContainText("Patch plan applied");

    expect(fs.readFileSync(notesPath, "utf8")).toContain("Renderer guardrails verified");
    expect(fs.readFileSync(notesPath, "utf8")).not.toContain("Offline bridge posture verified");
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
    await page.click("#workbenchPatchBtn");
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
    await expect(page.locator("#verificationRunHistoryList .artifact-history-card")).toHaveCount(1);
    await expect(page.locator("#verificationRunHistoryMetaText")).toContainText("1 snapshot");

    await page.click("#runVerificationPlanBtn");
    await expect(page.locator("#statusLabel")).toContainText("Verification run complete", { timeout: 240000 });
    await expect(page.locator("#verificationRunHistoryList .artifact-history-card")).toHaveCount(2);
    await expect(page.locator("#verificationRunHistoryMetaText")).toContainText("2 snapshots");
    await expect(page.locator("#verificationRunHistoryList")).toContainText("No status change from the previous run.");

    const bundle = await page.evaluate(async () => {
      return window.NeuralShellRenderer.buildEvidenceBundle();
    });
    expect(bundle.verificationRunPlan.groupId).toBe("runtime");
    expect(bundle.verificationRunPlan.rootPath).toBe(repoRoot);
    expect(Array.isArray(bundle.verificationRunHistory)).toBeTruthy();
    expect(bundle.verificationRunHistory).toHaveLength(2);
    expect(bundle.verificationRunHistory[0].groupId).toBe("runtime");
    expect(bundle.verificationRunHistory[0].runId).toBeTruthy();
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
    await expect(page.locator("#verificationRunHistoryList .artifact-history-card")).toHaveCount(2);
    await expect(page.locator("#verificationRunList .workspace-action-card").filter({
      hasText: "Run founder e2e"
    }).locator('input[type="checkbox"]')).not.toBeChecked();
  } finally {
    if (app) await app.close();
    rmUserDataDir(userDataDir);
  }
});

test("verification run history filters by workflow, group, and workspace", async () => {
  const userDataDir = mkUserDataDir("verification-history-filters");
  const otherWorkspace = mkWorkspaceDir("verification-history-filters-other");
  let app = null;
  try {
    const { app: runningApp, page } = await launchApp(userDataDir);
    app = runningApp;
    await closeOnboardingViaSkip(page);

    await page.evaluate(async ({ repoRoot, otherWorkspace }) => {
      const currentSummary = await window.api.workspace.summarize(repoRoot);
      await window.NeuralShellRenderer.activateWorkflow("shipping_audit", {
        seedPrompt: false,
        persist: false,
        announce: false
      });
      await window.NeuralShellRenderer.setWorkspaceAttachment(currentSummary, {
        persist: false,
        announce: false
      });
      await window.NeuralShellRenderer.setVerificationRunHistory([
        {
          runId: "verification-run-release-runtime-a",
          planId: "runtime-a",
          groupId: "runtime",
          groupTitle: "Runtime Surface",
          workflowId: "shipping_audit",
          rootPath: repoRoot,
          rootLabel: currentSummary.label,
          preparedAt: "2026-03-10T08:20:00.000Z",
          executedAt: "2026-03-10T08:21:00.000Z",
          ok: true,
          selectedCheckIds: ["lint"],
          checks: [{ id: "lint", selected: true, status: "passed", lastRunAt: "2026-03-10T08:21:00.000Z", exitCode: 0 }]
        },
        {
          runId: "verification-run-release-interface-a",
          planId: "interface-a",
          groupId: "interface",
          groupTitle: "Interface Surface",
          workflowId: "shipping_audit",
          rootPath: repoRoot,
          rootLabel: currentSummary.label,
          preparedAt: "2026-03-10T08:22:00.000Z",
          executedAt: "2026-03-10T08:23:00.000Z",
          ok: true,
          selectedCheckIds: ["lint", "founder_e2e"],
          checks: [
            { id: "lint", selected: true, status: "passed", lastRunAt: "2026-03-10T08:23:00.000Z", exitCode: 0 },
            { id: "founder_e2e", selected: true, status: "passed", lastRunAt: "2026-03-10T08:23:00.000Z", exitCode: 0 }
          ]
        },
        {
          runId: "verification-run-bug-runtime-a",
          planId: "runtime-bug",
          groupId: "runtime",
          groupTitle: "Runtime Surface",
          workflowId: "bug_triage",
          rootPath: repoRoot,
          rootLabel: currentSummary.label,
          preparedAt: "2026-03-10T08:24:00.000Z",
          executedAt: "2026-03-10T08:25:00.000Z",
          ok: false,
          selectedCheckIds: ["lint"],
          checks: [{ id: "lint", selected: true, status: "failed", lastRunAt: "2026-03-10T08:25:00.000Z", exitCode: 1 }]
        },
        {
          runId: "verification-run-release-runtime-b",
          planId: "runtime-b",
          groupId: "runtime",
          groupTitle: "Runtime Surface",
          workflowId: "shipping_audit",
          rootPath: otherWorkspace,
          rootLabel: "verification-history-filters-other",
          preparedAt: "2026-03-10T08:26:00.000Z",
          executedAt: "2026-03-10T08:27:00.000Z",
          ok: true,
          selectedCheckIds: ["lint"],
          checks: [{ id: "lint", selected: true, status: "passed", lastRunAt: "2026-03-10T08:27:00.000Z", exitCode: 0 }]
        }
      ], {
        persist: false
      });
    }, { repoRoot, otherWorkspace });

    await page.click("#systemWorkbenchBtn");
    await page.click("#workbenchPatchBtn");
    await expect(page.locator("#verificationRunHistoryList .artifact-history-card")).toHaveCount(4);

    await page.selectOption("#verificationRunHistoryWorkflowFilter", "current");
    await expect(page.locator("#verificationRunHistoryList .artifact-history-card")).toHaveCount(3);

    await page.selectOption("#verificationRunHistoryGroupFilter", "interface");
    await expect(page.locator("#verificationRunHistoryList .artifact-history-card")).toHaveCount(1);
    await expect(page.locator("#verificationRunHistoryList")).toContainText("Interface Surface");

    await page.click("#resetVerificationRunHistoryFiltersBtn");
    await expect(page.locator("#verificationRunHistoryList .artifact-history-card")).toHaveCount(4);

    await page.selectOption("#verificationRunHistoryWorkspaceFilter", "current");
    await expect(page.locator("#verificationRunHistoryList .artifact-history-card")).toHaveCount(3);

    await page.selectOption("#verificationRunHistoryWorkflowFilter", "bug_triage");
    await expect(page.locator("#verificationRunHistoryList .artifact-history-card")).toHaveCount(1);
    await expect(page.locator("#verificationRunHistoryMetaText")).toContainText("1 snapshot");
  } finally {
    if (app) await app.close();
    rmUserDataDir(userDataDir);
    rmUserDataDir(otherWorkspace);
  }
});

test("workbench visibility remains deterministic under rapid tab switching", async () => {
  const userDataDir = mkUserDataDir("workbench-visibility");
  let app = null;
  try {
    const { app: runningApp, page } = await launchApp(userDataDir);
    app = runningApp;
    await closeOnboardingViaSkip(page);
    await page.click("#systemWorkbenchBtn");
    const buttons = [
      "#workbenchArtifactBtn",
      "#workbenchPatchBtn",
      "#workbenchApplyBtn",
      "#workbenchPatchBtn",
      "#workbenchArtifactBtn"
    ];
    for (const selector of buttons) {
      await page.click(selector);
      const targetSection = selector === "#workbenchArtifactBtn"
        ? "#workbenchArtifactSection"
        : selector === "#workbenchPatchBtn"
          ? "#workbenchPatchSection"
          : "#workbenchApplySection";
      await expect(page.locator(targetSection)).toBeVisible();
      const otherSections = ["#workbenchArtifactSection", "#workbenchPatchSection", "#workbenchApplySection"]
        .filter((sel) => sel !== targetSection);
      for (const hidden of otherSections) {
        await expect(page.locator(hidden)).toHaveAttribute("aria-hidden", "true");
      }
    }
    await page.click("#workbenchPatchBtn");
    await expect(page.locator("#workbenchPatchSection")).toBeVisible();
  } finally {
    if (app) await app.close();
    rmUserDataDir(userDataDir);
  }
});

test("session load and workspace edits reset the active surface", async () => {
  const userDataDir = mkUserDataDir("session-reset");
  const workspaceDir = mkWorkspaceDir("session-reset");
  let app = null;
  try {
    const { app: runningApp, page } = await launchApp(userDataDir);
    app = runningApp;
    await closeOnboardingViaSkip(page);
    await seedWorkflowWorkspaceAndArtifact(page, workspaceDir);
    await page.click("#systemWorkbenchBtn");
    await page.click("#workbenchApplyBtn");
    await page.fill("#workspaceEditPathInput", "docs/bridge-diagnostics-draft.md");
    await page.fill("#workspaceEditContentInput", "# Draft\n");
    await page.click("#previewWorkspaceEditBtn");
    await page.click("#applyWorkspaceActionBtn");
    await page.click("#newChatBtn");
    await page.click("#loadSessionBtn");
    await expect(page.locator("#workbenchArtifactSection")).toBeVisible();
    await expect(page.locator("#workbenchPatchSection")).toHaveAttribute("aria-hidden", "true");
  } finally {
    if (app) await app.close();
    rmUserDataDir(userDataDir);
    rmUserDataDir(workspaceDir);
  }
});

test("composer context strip updates with provider, model, and command state", async () => {
  const userDataDir = mkUserDataDir("composer-context");
  let app = null;
  try {
    const { app: runningApp, page } = await launchApp(userDataDir);
    app = runningApp;
    await closeOnboardingViaSkip(page);
    await expect(page.locator("#composerMetaText")).toContainText("Idle");
    await page.fill("#promptInput", "/health");
    await expect(page.locator("#composerMetaText")).toContainText("Command ready");
    await page.fill("#promptInput", "Diagnose something");
    await expect(page.locator("#composerMetaText")).toContainText("Draft ready");
  } finally {
    if (app) await app.close();
    rmUserDataDir(userDataDir);
  }
});

test("inbox ranking surfaces live/staged/pinned sessions at the top", async () => {
  const userDataDir = mkUserDataDir("inbox-ranking");
  let app = null;
  try {
    const { app: runningApp, page } = await launchApp(userDataDir);
    app = runningApp;
    await closeOnboardingViaSkip(page);
    await page.fill("#sessionName", "first");
    await page.fill("#sessionPass", "one");
    await page.click("#saveSessionBtn");
    await page.fill("#sessionName", "pinned");
    await page.click("#sessionPass");
    await page.click("#saveSessionBtn");
    await page.locator("#sessionList .session-item").first().click();
    await expect(page.locator("#sessionList .session-item").first()).toHaveText(/pinned/i);
    await page.locator("#sessionList .session-item .list-item-pin").last().click();
    await page.reload();
    const firstCard = await page.locator("#sessionList .session-item").first().textContent();
    expect(firstCard).toContain("Pinned");
  } finally {
    if (app) await app.close();
    rmUserDataDir(userDataDir);
  }
});

test("stale patch update does not render hidden panel", async () => {
  const userDataDir = mkUserDataDir("stale-patch");
  let app = null;
  try {
    const { app: runningApp, page } = await launchApp(userDataDir);
    app = runningApp;
    await closeOnboardingViaSkip(page);
    await page.click("#workbenchArtifactBtn");
    const epoch = await page.evaluate(() => window.NeuralShellRenderer.reserveWorkbenchSurfaceEpoch("patch"));
    await page.evaluate((stale) => {
      window.NeuralShellRenderer.renderPatchPlanPanel({ surfaceEpoch: stale - 1 });
    }, epoch);
    await expect(page.locator("#workbenchPatchSection")).toHaveAttribute("aria-hidden", "true");
  } finally {
    if (app) await app.close();
    rmUserDataDir(userDataDir);
  }
});

test("apply surface only renders latest payload when active", async () => {
  const userDataDir = mkUserDataDir("apply-stale");
  let app = null;
  try {
    const { app: runningApp, page } = await launchApp(userDataDir);
    app = runningApp;
    await closeOnboardingViaSkip(page);
    await page.click("#systemWorkbenchBtn");
    await page.click("#workbenchApplyBtn");
    const epoch = await page.evaluate(() => window.NeuralShellRenderer.reserveWorkbenchSurfaceEpoch("apply"));
    await page.evaluate((stale) => {
      window.NeuralShellRenderer.renderWorkspaceActionDeck({ surfaceEpoch: stale - 1 });
    }, epoch);
    await expect(page.locator("#workbenchApplySection")).toBeVisible();
  } finally {
    if (app) await app.close();
    rmUserDataDir(userDataDir);
  }
});

test("hidden patch surface waits to rerender for async updates", async () => {
  const userDataDir = mkUserDataDir("hidden-patch-async");
  const workspaceDir = mkWorkspaceDir("hidden-patch-async");
  let app = null;
  try {
    const { app: runningApp, page } = await launchApp(userDataDir);
    app = runningApp;
    await closeOnboardingViaSkip(page);

    await page.click("#workbenchPatchBtn");

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
      window.NeuralShellRenderer.setPatchPlan({
        title: "Hidden Guarded Plan",
        summary: "Baseline patch before hidden async replay.",
        files: [
          {
            fileId: "hidden-baseline-file",
            path: "docs/release-audit.md",
            content: "# Hidden baseline patch\n",
            hunks: [
              {
                hunkId: "baseline-hunk",
                lines: [
                  { type: "context", text: "Baseline" }
                ]
              }
            ]
          }
        ]
      }, {
        workflowId: "bug_triage",
        rootPath: summary.rootPath
      });
      let previewPlanResolve = () => { };
      const previewPlanPromise = new Promise((resolve) => {
        previewPlanResolve = resolve;
      });
      window.previewPlanRequested = false;
      window.pendingPatchPlan = null;
      window.previewPlanResolver = (plan) => {
        window.previewPlanRequested = true;
        window.pendingPatchPlan = {
          ...plan,
          rootPath: summary.rootPath
        };
        previewPlanResolve(plan);
      };
      window.NeuralShellRenderer.previewPatchPlanFiles = () => {
        window.previewPlanRequested = true;
        return previewPlanPromise;
      };
    }, { workspaceDir });

    const baselineTitle = (await page.locator("#patchPlanTitleText").textContent())?.trim();

    const previewPromise = page.evaluate(() => window.NeuralShellRenderer.previewPatchPlanFiles());
    await page.waitForFunction(() => Boolean(window.previewPlanRequested));
    await page.click("#workbenchArtifactBtn");
    await page.evaluate(() => {
      window.previewPlanResolver({
        id: "hidden-async-plan",
        workflowId: "bug_triage",
        title: "Hidden Async Patch",
        summary: "Updated while hidden.",
        generatedAt: new Date().toISOString(),
        files: [
          {
            fileId: "hidden-async-file",
            path: "docs/hidden.md",
            content: "# Hidden async update\n",
            hunks: [
              {
                hunkId: "async-hunk",
                lines: [
                  { type: "context", text: "Hidden async update" }
                ]
              }
            ]
          }
        ]
      });
    });
    await previewPromise;
    await expect(page.locator("#patchPlanTitleText")).toHaveText(baselineTitle);

    await page.click("#workbenchPatchBtn");
    await page.evaluate(() => {
      if (window.pendingPatchPlan) {
        window.NeuralShellRenderer.setPatchPlan(window.pendingPatchPlan, {
          workflowId: window.pendingPatchPlan.workflowId || "bug_triage",
          rootPath: window.pendingPatchPlan.rootPath || ""
        });
        window.pendingPatchPlan = null;
      }
    });
    await expect(page.locator("#patchPlanTitleText")).toContainText("Hidden Async Patch");
  } finally {
    if (app) await app.close();
    rmUserDataDir(userDataDir);
    rmUserDataDir(workspaceDir);
  }
});

test("patch preview drops stale async results", async () => {
  const userDataDir = mkUserDataDir("async-patch-preview");
  let app = null;
  try {
    const { app: runningApp, page } = await launchApp(userDataDir);
    app = runningApp;
    await closeOnboardingViaSkip(page);
    await page.click("#systemWorkbenchBtn");
    await page.click("#workbenchPatchBtn");
    await page.evaluate(() => {
      window.appState.patchPlan = {
        title: "seed preview",
        workflowId: "bridge_diagnostics",
        generatedAt: new Date().toISOString(),
        files: [
          {
            fileId: "seed-file",
            path: "docs/bridge-diagnostics-draft.md",
            hunks: [
              {
                hunkId: "hunk-seed",
                lines: [{ type: "context", text: "seed" }]
              }
            ]
          }
        ]
      };
    });
    const staleToken = await page.evaluate(() => window.NeuralShellRenderer.reserveWorkbenchSurfaceRefreshToken("patch"));
    await page.evaluate((token) => {
      if (window.NeuralShellRenderer.isWorkbenchSurfaceRefreshTokenCurrent("patch", token)) {
        window.appState.patchPlan.title = "stale-preview";
      }
    }, staleToken);
    const freshToken = await page.evaluate(() => window.NeuralShellRenderer.reserveWorkbenchSurfaceRefreshToken("patch"));
    await page.evaluate((token) => {
      if (window.NeuralShellRenderer.isWorkbenchSurfaceRefreshTokenCurrent("patch", token)) {
        window.appState.patchPlan.title = "fresh-preview";
      }
    }, freshToken);
    const finalTitle = await page.evaluate(() => window.appState.patchPlan.title);
    expect(finalTitle).toBe("fresh-preview");
  } finally {
    if (app) await app.close();
    rmUserDataDir(userDataDir);
  }
});

test("workspace action preview prefers the latest async response", async () => {
  const userDataDir = mkUserDataDir("async-apply-preview");
  let app = null;
  try {
    const { app: runningApp, page } = await launchApp(userDataDir);
    app = runningApp;
    await closeOnboardingViaSkip(page);
    await page.click("#systemWorkbenchBtn");
    await page.click("#workbenchApplyBtn");
    await page.evaluate(() => {
      window.appState.workspaceActionPreview = { previewText: "seed preview" };
    });
    const staleToken = await page.evaluate(() => window.NeuralShellRenderer.reserveWorkbenchSurfaceRefreshToken("apply"));
    await page.evaluate((token) => {
      if (window.NeuralShellRenderer.isWorkbenchSurfaceRefreshTokenCurrent("apply", token)) {
        window.appState.workspaceActionPreview.previewText = "stale-preview";
      }
    }, staleToken);
    const freshToken = await page.evaluate(() => window.NeuralShellRenderer.reserveWorkbenchSurfaceRefreshToken("apply"));
    await page.evaluate((token) => {
      if (window.NeuralShellRenderer.isWorkbenchSurfaceRefreshTokenCurrent("apply", token)) {
        window.appState.workspaceActionPreview.previewText = "fresh-preview";
      }
    }, freshToken);
    await page.waitForFunction(() => (
      window.appState.workspaceActionPreview
      && window.appState.workspaceActionPreview.previewText === "fresh-preview"
    ));
  } finally {
    if (app) await app.close();
    rmUserDataDir(userDataDir);
  }
});

