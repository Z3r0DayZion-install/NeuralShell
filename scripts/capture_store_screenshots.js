/* global document, window */

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
const sessionPassphrase = "StoreCapturePassphrase1!";

const sampleChat = [
  {
    role: "system",
    content:
      "Session objective: keep the workstation local-first, verify release provenance, and maintain strict IPC validation."
  },
  {
    role: "user",
    content:
      "Prepare the Windows beta release checklist and keep the workflow offline-first."
  },
  {
    role: "assistant",
    content:
      "Release checklist:\n1. Validate renderer and IPC guards.\n2. Verify installer hash and provenance artifacts.\n3. Confirm session recovery, audit chain, and runtime health panels.\n4. Ship the signed Windows installer."
  },
  {
    role: "user",
    content:
      "What is active in the current profile?"
  },
  {
    role: "assistant",
    content:
      "Profile: Local Guarded Bridge\nBase URL: http://127.0.0.1:11434\nTheme: dark\nToken budget: 2048\nAutosave: enabled every 12 minutes"
  }
];

const sampleSessions = [
  {
    name: "Release-Audit",
    updatedAt: "2026-03-10T08:30:00.000Z",
    chat: sampleChat
  },
  {
    name: "Offline-RedTeam",
    updatedAt: "2026-03-10T09:05:00.000Z",
    chat: [
      {
        role: "user",
        content: "List renderer abuse cases that must remain blocked."
      },
      {
        role: "assistant",
        content:
          "Blocked classes include arbitrary navigation, remote fetch from the renderer, unrestricted IPC invocation, and unsafe file import paths."
      }
    ]
  },
  {
    name: "Founder-Handoff",
    updatedAt: "2026-03-10T09:22:00.000Z",
    chat: [
      {
        role: "user",
        content: "Summarize the current beta channel status."
      },
      {
        role: "assistant",
        content:
          "WinGet PR is open, Microsoft Store assets are staged, and outreach automation is operating with guarded inbox triage."
      }
    ]
  }
];

const screenshotPlan = [
  {
    filename: "01-onboarding-safe-defaults.png",
    title: "Onboarding and safe defaults",
    caption: "Guided first-run overlay with the operator console visible underneath."
  },
  {
    filename: "02-main-workspace.png",
    title: "Main workspace",
    caption: "Mission control, the Intel command deck, workflow-ranked repo context-pack suggestions, workflow-linked saved profiles with freshness and auto-load posture, context-linked grouped patch review with hunk acceptance, filtered verification run history, release packet history, and trust-scoped apply surfaces."
  },
  {
    filename: "03-session-management.png",
    title: "Session management",
    caption: "Saved encrypted sessions with staged maintenance controls and on-demand metadata inspection."
  },
  {
    filename: "04-settings-and-profiles.png",
    title: "Settings and profiles",
    caption: "Settings drawer with LLM setup, bridge profiles, workflow-linked context defaults, model selection, and guarded workspace controls."
  },
  {
    filename: "05-runtime-and-integrity.png",
    title: "Runtime and integrity",
    caption: "Runtime telemetry with the release cockpit, staged diagnostics trays, focused output surfaces, blocker tracking, and packet history."
  },
  {
    filename: "06-command-palette.png",
    title: "Command palette",
    caption: "Keyboard-driven workflow actions, sectioned prefix-routed repo-context and workflow-profile controls, workflow-scoped shortcut filters, operator routing, and guarded preview/apply controls."
  }
];

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readPngDimensions(filePath) {
  const image = PNG.sync.read(fs.readFileSync(filePath));
  return {
    width: image.width,
    height: image.height
  };
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
  await page.setViewportSize(viewport);
  await app.evaluate(({ BrowserWindow }, bounds) => {
    const win = BrowserWindow.getAllWindows()[0];
    if (!win) return false;
    win.setContentSize(bounds.width, bounds.height);
    win.center();
    return true;
  }, viewport);
  await page.evaluate(() => {
    document.documentElement.setAttribute("data-theme", "dark");
  });
  await wait(400);
  return { app, page };
}

async function seedWorkspace(page) {
  await page.evaluate(
    async ({ chat, sessions, sessionPass, repoRoot }) => {
      const setText = (id, value) => {
        const node = document.getElementById(id);
        if (node) {
          node.textContent = value;
        }
      };

      const setHtml = (id, value) => {
        const node = document.getElementById(id);
        if (node) {
          node.innerHTML = value;
        }
      };

      const setValue = (id, value) => {
        const node = document.getElementById(id);
        if (node) {
          node.value = value;
        }
      };

      const renderChatFallback = (messages) => {
        const history = document.getElementById("chatHistory");
        if (!history) return;
        history.innerHTML = "";
        for (let i = 0; i < messages.length; i += 1) {
          const row = messages[i];
          const item = document.createElement("article");
          item.className = `chat-msg role-${String(row.role || "assistant").toLowerCase()}`;
          const head = document.createElement("header");
          head.className = "chat-head";
          head.textContent = `${i + 1}. ${row.role}`;
          const body = document.createElement("pre");
          body.className = "chat-content";
          body.textContent = String(row.content || "");
          item.appendChild(head);
          item.appendChild(body);
          history.appendChild(item);
        }
      };

      const workflowSummary = window.api && window.api.workspace
        ? await window.api.workspace.summarize(repoRoot)
        : {
            rootPath: repoRoot,
            label: "NeuralShell",
            signals: ["package.json", "README", "docs/", "scripts/"],
            attachedAt: "2026-03-10T08:28:00.000Z"
          };
      const patchPlan = {
        title: "Workflow Console Patch Plan",
        summary: "Add guarded patch-plan guidance and a verification note to the local workspace docs.",
        verification: ["Run lint", "Run founder e2e", "Verify screenshot seed integrity"],
        files: [
          {
            path: "docs/patch-plan-preview.md",
            rationale: "Add a concise operator note for guarded diff previews.",
            content: "# Patch Plan Preview\n\n- Guarded local diff preview\n- Explicit apply only\n"
          },
          {
            path: "docs/patch-plan-verify.md",
            rationale: "Add a short verification checklist for the workflow console.",
            content: "# Patch Plan Verification\n\n- Run lint\n- Run e2e\n- Refresh screenshots\n"
          }
        ]
      };
      const contextPack = {
        id: "context-pack-release-audit",
        name: "Release Audit Context Pack",
        rootPath: workflowSummary.rootPath,
        rootLabel: workflowSummary.label,
        builtAt: "2026-03-10T08:28:40.000Z",
        filePaths: ["README.md", "package.json"],
        entries: [
          {
            relativePath: "README.md",
            absolutePath: `${workflowSummary.rootPath}/README.md`,
            content: "# NeuralShell\n\n- Offline-first founder console\n- Workflow console with guarded local apply\n- Release packet and evidence export surfaces\n"
          },
          {
            relativePath: "package.json",
            absolutePath: `${workflowSummary.rootPath}/package.json`,
            content: "{\n  \"name\": \"neuralshell\",\n  \"private\": true,\n  \"scripts\": {\n    \"lint\": \"eslint .\",\n    \"test:e2e\": \"playwright test\",\n    \"channel:store:screenshots\": \"node scripts/capture_store_screenshots.js\"\n  }\n}"
          }
        ]
      };
      const contextPackProfiles = [
        {
          id: "context-pack-profile-release",
          workspaceRoot: workflowSummary.rootPath,
          workspaceLabel: workflowSummary.label,
          workflowId: "release_audit",
          name: "Release Audit Context Pack",
          filePaths: ["README.md", "package.json"],
          fileSnapshots: [
            { relativePath: "README.md", modifiedAt: "2026-03-10T08:28:30.000Z" },
            { relativePath: "package.json", modifiedAt: "2026-03-10T08:28:30.000Z" }
          ],
          savedAt: "2026-03-10T08:28:45.000Z"
        },
        {
          id: "context-pack-profile-ui",
          workspaceRoot: workflowSummary.rootPath,
          workspaceLabel: workflowSummary.label,
          workflowId: "bug_triage",
          name: "UI Surface Context Pack",
          filePaths: ["README.md", "src/renderer.html"],
          fileSnapshots: [
            { relativePath: "README.md", modifiedAt: "2026-03-10T08:29:00.000Z" },
            { relativePath: "src/renderer.html", modifiedAt: "2026-03-10T08:29:00.000Z" }
          ],
          savedAt: "2026-03-10T08:29:05.000Z"
        }
      ];
      const promotedPaletteActions = [
        {
          id: "shortcut-release-audit-documentation",
          workflowId: "release_audit",
          groupId: "documentation",
          groupTitle: "Documentation Surface",
          label: "Verify Documentation Surface",
          detail: "Release Audit shortcut | 2 files | Review copy and exported artifact output.",
          promptLead: "Verify the documentation and narrative surfaces for clarity, accuracy, and store-facing consistency.",
          checks: [
            "Review copy and exported artifact output.",
            "Refresh screenshots only if store-visible wording changed."
          ],
          filePaths: [
            "docs/patch-plan-preview.md",
            "docs/patch-plan-verify.md"
          ],
          promotedAt: "2026-03-10T08:29:45.000Z"
        },
        {
          id: "shortcut-release-audit-runtime",
          workflowId: "release_audit",
          groupId: "runtime",
          groupTitle: "Runtime Surface",
          label: "Verify Runtime Surface",
          detail: "Release Audit shortcut | 2 files | Run lint and founder e2e after apply.",
          promptLead: "Verify the runtime and guarded execution surfaces for safety, bridge health, and regression risk.",
          checks: [
            "Run lint and founder e2e after apply.",
            "Verify bridge, IPC, and guarded local-write behavior manually."
          ],
          filePaths: [
            "src/main.js",
            "src/preload.js"
          ],
          promotedAt: "2026-03-10T08:29:55.000Z"
        },
        {
          id: "shortcut-bug-triage-interface",
          workflowId: "bug_triage",
          groupId: "interface",
          groupTitle: "Interface Surface",
          label: "Verify Bug Triage Interface",
          detail: "Bug Triage shortcut | 2 files | Run lint and founder e2e after apply.",
          promptLead: "Verify the interface changes for layout quality, interaction safety, and visual regressions.",
          checks: [
            "Run lint and founder e2e after apply.",
            "Verify workflow, patch-plan, and apply surfaces in the desktop UI."
          ],
          filePaths: [
            "src/renderer.html",
            "src/style.css"
          ],
          promotedAt: "2026-03-10T08:30:05.000Z"
        }
      ];
      const verificationRunPlan = {
        id: "release-cockpit-release-audit",
        groupId: "release_cockpit",
        groupTitle: "Release Cockpit",
        workflowId: "release_audit",
        rootPath: workflowSummary.rootPath,
        rootLabel: workflowSummary.label,
        preparedAt: "2026-03-10T08:30:10.000Z",
        lastRunAt: "2026-03-10T08:30:42.000Z",
        checks: [
          {
            id: "lint",
            selected: true,
            status: "passed",
            lastRunAt: "2026-03-10T08:30:42.000Z",
            exitCode: 0,
            durationMs: 18420,
            stdout: "> neuralshell@1.2.1 lint\n> eslint .\n"
          },
          {
            id: "store_screenshots",
            selected: true,
            status: "pending"
          },
          {
            id: "founder_e2e",
            selected: false,
            status: "pending"
          }
        ]
      };
      const verificationRunHistory = [
        {
          runId: "verification-run-2026-03-10T08-30-42-release_cockpit",
          planId: "release-cockpit-release-audit",
          groupId: "release_cockpit",
          groupTitle: "Release Cockpit",
          workflowId: "release_audit",
          rootPath: workflowSummary.rootPath,
          rootLabel: workflowSummary.label,
          preparedAt: "2026-03-10T08:30:10.000Z",
          executedAt: "2026-03-10T08:30:42.000Z",
          ok: true,
          selectedCheckIds: ["lint"],
          checks: verificationRunPlan.checks
        },
        {
          runId: "verification-run-2026-03-10T08-18-12-release_cockpit",
          planId: "release-cockpit-release-audit",
          groupId: "release_cockpit",
          groupTitle: "Release Cockpit",
          workflowId: "release_audit",
          rootPath: workflowSummary.rootPath,
          rootLabel: workflowSummary.label,
          preparedAt: "2026-03-10T08:17:40.000Z",
          executedAt: "2026-03-10T08:18:12.000Z",
          ok: false,
          selectedCheckIds: ["lint", "founder_e2e"],
          checks: [
            {
              id: "lint",
              selected: true,
              status: "passed",
              lastRunAt: "2026-03-10T08:18:12.000Z",
              exitCode: 0,
              durationMs: 18210
            },
            {
              id: "founder_e2e",
              selected: true,
              status: "failed",
              lastRunAt: "2026-03-10T08:18:12.000Z",
              exitCode: 1,
              durationMs: 46812,
              stderr: "1 founder flow failed while the drawer route was still being updated."
            },
            {
              id: "store_screenshots",
              selected: false,
              status: "pending"
            }
          ]
        }
      ];

      if (window.NeuralShellRenderer && typeof window.NeuralShellRenderer.activateWorkflow === "function") {
        await window.NeuralShellRenderer.activateWorkflow("release_audit", {
          seedPrompt: false,
          persist: false,
          announce: false
        });
      }
      if (window.NeuralShellRenderer && typeof window.NeuralShellRenderer.setOutputMode === "function") {
        await window.NeuralShellRenderer.setOutputMode("checklist", { persist: false });
      }
      if (window.NeuralShellRenderer && typeof window.NeuralShellRenderer.setWorkspaceAttachment === "function") {
        await window.NeuralShellRenderer.setWorkspaceAttachment(workflowSummary, {
          persist: false,
          announce: false
        });
      }

      if (window.NeuralShellRenderer && typeof window.NeuralShellRenderer.renderChat === "function") {
        window.NeuralShellRenderer.renderChat(chat);
      } else {
        renderChatFallback(chat);
      }

      let seededSettings = null;
      if (window.api && window.api.settings && typeof window.api.settings.get === "function" && typeof window.api.settings.update === "function") {
        const currentSettings = (await window.api.settings.get()) || {};
        seededSettings = await window.api.settings.update({
          ...currentSettings,
          autoLoadRecommendedContextProfile: true
        });
      }

      if (window.api && window.api.state) {
        await window.api.state.update({
          chat,
          model: "llama3",
          workflowId: "release_audit",
          outputMode: "checklist",
          workspaceAttachment: workflowSummary,
          contextPack,
          contextPackProfiles,
          activeContextPackProfileId: "context-pack-profile-release",
          releasePacketHistory: [],
          patchPlan,
          promotedPaletteActions,
          commandPaletteShortcutScope: "all",
          verificationRunPlan,
          verificationRunHistory
        });
      }

      if (window.api && window.api.session) {
        const settings =
          seededSettings ||
          ((window.api.settings && (await window.api.settings.get())) || {});
        for (const row of sessions) {
          await window.api.session.save(
            row.name,
            {
              model: "llama3",
              chat: row.chat,
              workflowId: "release_audit",
              outputMode: "checklist",
              workspaceAttachment: workflowSummary,
              contextPack,
              contextPackProfiles,
              activeContextPackProfileId: "context-pack-profile-release",
              lastArtifact: {
                title: "Release Audit Artifact",
                workflowId: "release_audit",
                outputMode: "checklist",
                content: chat[chat.length - 1].content,
                generatedAt: "2026-03-10T08:30:15.000Z"
              },
              releasePacketHistory: [],
              patchPlan,
              promotedPaletteActions,
              commandPaletteShortcutScope: "all",
              verificationRunPlan,
              verificationRunHistory,
              settings,
              updatedAt: row.updatedAt
            },
            sessionPass
          );
        }
      }

      if (window.NeuralShellRenderer && typeof window.NeuralShellRenderer.refreshSessions === "function") {
        await window.NeuralShellRenderer.refreshSessions();
      }
      if (window.NeuralShellRenderer && typeof window.NeuralShellRenderer.refreshCommands === "function") {
        await window.NeuralShellRenderer.refreshCommands();
      }
      if (
        window.NeuralShellRenderer &&
        typeof window.NeuralShellRenderer.setContextPack === "function" &&
        typeof window.NeuralShellRenderer.setContextPackProfiles === "function" &&
        typeof window.NeuralShellRenderer.refreshContextPackProfileStatus === "function" &&
        typeof window.NeuralShellRenderer.setPatchPlan === "function" &&
        typeof window.NeuralShellRenderer.setPromotedPaletteActions === "function" &&
        typeof window.NeuralShellRenderer.previewPatchPlanFiles === "function" &&
        typeof window.NeuralShellRenderer.setVerificationRunPlan === "function" &&
        typeof window.NeuralShellRenderer.setVerificationRunHistory === "function" &&
        typeof window.NeuralShellRenderer.buildReleasePacketArtifact === "function" &&
        typeof window.NeuralShellRenderer.setWorkspaceEditDraft === "function" &&
        typeof window.NeuralShellRenderer.previewWorkspaceEditDraft === "function"
      ) {
        try {
          await window.NeuralShellRenderer.setContextPackProfiles(contextPackProfiles, {
            persist: false
          });
          await window.NeuralShellRenderer.setContextPack(contextPack, {
            persist: false,
            announce: false
          });
          const contextPackProfileSelect = document.getElementById("contextPackProfileSelect");
          if (contextPackProfileSelect) {
            contextPackProfileSelect.value = "context-pack-profile-release";
            contextPackProfileSelect.dispatchEvent(new window.Event("change", { bubbles: true }));
          }
          await window.NeuralShellRenderer.refreshContextPackProfileStatus("context-pack-profile-release");
          window.NeuralShellRenderer.setPatchPlan(patchPlan, {
            workflowId: "release_audit",
            generatedAt: "2026-03-10T08:29:30.000Z"
          });
          await window.NeuralShellRenderer.setPromotedPaletteActions(promotedPaletteActions, {
            persist: false
          });
          await window.NeuralShellRenderer.setCommandPaletteShortcutScope("all", {
            persist: false,
            announce: false
          });
          window.NeuralShellRenderer.setVerificationRunPlan(verificationRunPlan, {
            persist: false
          });
          window.NeuralShellRenderer.setVerificationRunHistory(verificationRunHistory, {
            persist: false
          });
          const workflowHistoryFilter = document.getElementById("verificationRunHistoryWorkflowFilter");
          if (workflowHistoryFilter) {
            workflowHistoryFilter.value = "current";
            workflowHistoryFilter.dispatchEvent(new window.Event("change", { bubbles: true }));
          }
          await window.NeuralShellRenderer.buildReleasePacketArtifact({
            persist: false,
            announce: false,
            generatedAt: "2026-03-10T08:30:50.000Z"
          });
          await window.NeuralShellRenderer.buildReleasePacketArtifact({
            persist: false,
            announce: false,
            generatedAt: "2026-03-10T08:32:10.000Z"
          });
          await window.NeuralShellRenderer.previewPatchPlanFiles();
          window.NeuralShellRenderer.setWorkspaceEditDraft(
            "README.md",
            "# NeuralShell\n\n- Offline-first founder console\n- Workflow console with guarded apply deck\n- Evidence bundle export available\n"
          );
          await window.NeuralShellRenderer.previewWorkspaceEditDraft();
        } catch {
          // Keep screenshot seeding resilient if the preview surface is unavailable.
        }
      }

      setText("statusLabel", "[ok] Local workspace ready");
      setText(
        "statusMeta",
        "Profile: Local Guarded Bridge | Offline-first | Token budget 2048 | Autosave 12m"
      );
      setText("typingIndicator", "Release provenance verified");
      setValue(
        "promptInput",
        "Audit the installer, verify the session pipeline, and keep the workstation local-first."
      );
      if (typeof window.updatePromptMetrics === "function") {
        window.updatePromptMetrics();
      }
      setText("tokensUsed", "Token Load 71");
      setValue("sessionName", "Release-Audit");
      setValue("sessionPass", sessionPass);
      setValue("sessionSearchInput", "");
      setText("workflowTitleText", "Release Audit");
      setText(
        "workflowDescriptionText",
        "Validate a local release workflow, runtime posture, and ship-readiness without leaving the guarded console. Output contract: Return a concrete checklist with short action items and verification notes."
      );
      setText("artifactTitleText", "Release Packet");
      setText("artifactMetaText", "Release Packet | Mar 10, 8:32 AM | Rev 2 | 1 linked run | No status change from the previous run.");
      setText("artifactCompareMetaText", "Revision 2 from release_packet-r... vs Revision 1");
      setText(
        "artifactPreview",
        "# Release Packet\n\n- Decision: Ready\n- Workflow: Release Audit\n- Evidence Bundle: Ready to export\n\n## Verification\n- [PASSED] Run lint -> npm run lint\n- [DESELECTED] Run founder e2e -> npm run test:e2e\n- [PENDING] Refresh store screenshots -> npm run channel:store:screenshots\n\n## Verification Provenance\n- Snapshot ID: verification-run-2026-03-10T08-30-42-release_cockpit\n- Delta: No status change from the previous run.\n- Context Pack Snapshot: Release Audit Context Pack | 2 files | built 2026-03-10T08:28:00.000Z\n- Context Pack Files: README.md, package.json\n- Context Pack Profile: Release Audit Context Pack | 2 files | saved 2026-03-10T08:28:00.000Z\n- Packet Revision: 2"
      );
      setHtml(
        "artifactCompareDiffList",
        '<article class="workspace-action-card"><div class="workspace-action-card-head"><div class="workflow-title-text">Revision</div><span class="operator-action-status workspace-action-state" data-tone="ok">Revision</span></div><div class="artifact-compare-row"><div class="artifact-compare-cell"><span class="cluster-note">A</span><strong>Rev 2</strong></div><div class="artifact-compare-cell"><span class="cluster-note">B</span><strong>Rev 1</strong></div></div></article><article class="workspace-action-card"><div class="workspace-action-card-head"><div class="workflow-title-text">Linked Runs</div><span class="operator-action-status workspace-action-state" data-tone="guard">Linked Runs</span></div><div class="artifact-compare-row"><div class="artifact-compare-cell"><span class="cluster-note">A</span><strong>1</strong></div><div class="artifact-compare-cell"><span class="cluster-note">B</span><strong>1</strong></div></div></article>'
      );
      setText("artifactCompareLeftTitle", "Release Packet A");
      setText("artifactCompareLeftMeta", "Mar 10, 8:32 AM | Revision 2 from release_packet-r...");
      setText("artifactCompareLeftPreview", "# Release Packet\n\n- Decision: Ready\n- Packet Revision: 2");
      setText("artifactCompareRightTitle", "Release Packet B");
      setText("artifactCompareRightMeta", "Mar 10, 8:30 AM | Revision 1");
      setText("artifactCompareRightPreview", "# Release Packet\n\n- Decision: Ready\n- Packet Revision: 1");
      setText("patchPlanTitleText", "Workflow Console Patch Plan");
      setText("patchPlanMetaText", "2 files | 2 new | 0 modified | 10 lines");
      setText(
        "patchPlanSummaryText",
        "Add guarded patch-plan guidance and a verification note to the local workspace docs."
      );
      setText(
        "patchPlanProvenanceText",
        `Context Pack: Release Audit Context Pack | 2 files | Profile: Release Audit Context Pack | saved Mar 10, 8:28 AM | Workspace: ${workflowSummary.rootPath}`
      );
      setText(
        "patchPlanVerification",
        "1. Run lint\n2. Run founder e2e\n3. Verify screenshot seed integrity"
      );
      setText(
        "workspaceSummaryText",
        `Label: ${workflowSummary.label}\nRoot: ${workflowSummary.rootPath}\nSignals: ${workflowSummary.signals.join(", ")}\nAttached: Mar 10, 8:28 AM`
      );
      setValue("workspaceEditPathInput", "README.md");
      setValue(
        "workspaceEditContentInput",
        "# NeuralShell\n\n- Offline-first founder console\n- Workflow console with guarded apply deck\n- Evidence bundle export available\n"
      );
      setText("workspaceActionPreviewTitle", "File Edit: README.md");
      setText(
        "workspaceActionPreviewMeta",
        "README.md | 119 bytes | 5 lines | Diff preview | Overwrite"
      );
      setText(
        "workspaceActionPreview",
        `Path: ${workflowSummary.rootPath}\\README.md\n\n--- a/README.md\n+++ b/README.md\n@@ -1,3 +1,4 @@\n-# NeuralShell\n-- Legacy local shell copy\n+# NeuralShell\n+\n+- Offline-first founder console\n+- Workflow console with guarded apply deck\n+- Evidence bundle export available`
      );
      setText(
        "patchPlanPreview",
        `Path: ${workflowSummary.rootPath}\\docs\\patch-plan-preview.md\n\n--- a/docs/patch-plan-preview.md\n+++ b/docs/patch-plan-preview.md\n@@ -0,0 +1,4 @@\n+# Patch Plan Preview\n+\n+- Guarded local diff preview\n+- Explicit apply only`
      );
      setText("intelModeText", "Local-only bridge | auto reconnect | dark");
      setText("intelBridgeText", "Local bridge online.");
      setText("intelSessionText", "3 indexed | Active Release-Audit");
      setText(
        "intelFocusText",
        "Release Audit is carrying 2 staged patch files across one grouped review surface."
      );
      setText(
        "intelCapabilityText",
        "NeuralShell is attached to one local workspace. Two selected files still need explicit apply and the release lane is partially verified."
      );
      setText(
        "intelNextActionText",
        "Run the remaining release check, then rebuild the release packet so the ship decision stays current."
      );

      const intelActionHints = document.getElementById("intelActionHints");
      if (intelActionHints) {
        intelActionHints.innerHTML = [
          '<div class="workspace-action-hint">Release Audit is the active operator lane. Output contract: Checklist.</div>',
          `<div class="workspace-action-hint">${workflowSummary.label} is attached with ${workflowSummary.signals.join(", ")}.</div>`,
          '<div class="workspace-action-hint">Two patch files are staged and still require explicit apply.</div>',
          '<div class="workspace-action-hint">One verification check passed, one remains pending, and founder e2e is intentionally deselected for this screenshot state.</div>'
        ].join("");
      }

      const sessionMetadataOutput = document.getElementById("sessionMetadataOutput");
      if (sessionMetadataOutput) {
        sessionMetadataOutput.textContent = JSON.stringify(
          {
            "Release-Audit": {
              updatedAt: "2026-03-10T08:30:00.000Z",
              tokens: 71,
              model: "llama3",
              workflowId: "release_audit",
              outputMode: "checklist",
              workspaceLabel: workflowSummary.label,
              patchPlanFiles: 2
            },
            "Offline-RedTeam": {
              updatedAt: "2026-03-10T09:05:00.000Z",
              tokens: 28,
              model: "llama3",
              workflowId: "bug_triage",
              outputMode: "brief",
              workspaceLabel: workflowSummary.label,
              patchPlanFiles: 0
            },
            "Founder-Handoff": {
              updatedAt: "2026-03-10T09:22:00.000Z",
              tokens: 24,
              model: "llama3",
              workflowId: "session_handoff",
              outputMode: "handoff",
              workspaceLabel: workflowSummary.label,
              patchPlanFiles: 0
            }
          },
          null,
          2
        );
      }

      const logsOutput = document.getElementById("logsOutput");
      if (logsOutput) {
        logsOutput.textContent = JSON.stringify(
          {
            releaseStatus: "verified",
            installerHash: "BE174A1C14B0FF0CDEA85AE865DD020CEAEE359903073FDBD723AF22ED560E61",
            auditChain: "ok",
            rendererNetworkLockdown: true,
            ipcValidation: "strict"
          },
          null,
          2
        );
      }

      const buttonAuditOutput = document.getElementById("buttonAuditOutput");
      if (buttonAuditOutput) {
        buttonAuditOutput.textContent = JSON.stringify(
          {
            total: document.querySelectorAll("[id]").length,
            missing: []
          },
          null,
          2
        );
      }

      const chatLogsOutput = document.getElementById("chatLogsOutput");
      if (chatLogsOutput) {
        chatLogsOutput.textContent =
          "2026-03-10T08:30:11Z [user_message] release checklist request\n" +
          "2026-03-10T08:30:15Z [assistant_message] emitted guarded release workflow\n" +
          "2026-03-10T08:30:29Z [assistant_message] summarized active profile";
      }

      const knowledgeFeed = document.getElementById("knowledgeFeed");
      if (knowledgeFeed) {
        knowledgeFeed.innerHTML = [
          '<article class="intel-feed-item"><div class="intel-feed-top"><div class="intel-feed-title">Workflow Surface</div><span class="operator-action-status workspace-action-state" data-tone="ok">Release Audit</span></div><div class="intel-feed-note">Checklist contract is active and the dock artifact is staged as a release packet.</div></article>',
          `<article class="intel-feed-item"><div class="intel-feed-top"><div class="intel-feed-title">Workspace Context</div><span class="operator-action-status workspace-action-state" data-tone="good">${workflowSummary.label}</span></div><div class="intel-feed-note">Signals: ${workflowSummary.signals.join(", ")} | Attached Mar 10, 8:28 AM</div></article>`,
          '<article class="intel-feed-item"><div class="intel-feed-top"><div class="intel-feed-title">Verification Lane</div><span class="operator-action-status workspace-action-state" data-tone="ok">1 passed / 1 pending</span></div><div class="intel-feed-note">Lint passed. Screenshot refresh is queued for the next explicit run.</div></article>'
        ].join("");
      }

      const capabilityGraph = document.getElementById("capabilityGraph");
      if (capabilityGraph) {
        capabilityGraph.innerHTML = [
          `<article class="intel-capability-card"><div class="workspace-action-card-head"><div class="workspace-action-card-copy"><div class="workflow-title-text">Workspace Context</div><p>Context, apply, and export surfaces are bounded to one local root.</p></div><span class="operator-action-status workspace-action-state" data-tone="good">Attached</span></div><div class="workspace-action-path">${workflowSummary.rootPath}</div><div class="trust-scope-row"><span class="operator-scope-pill" data-tone="local">Local only</span><span class="operator-scope-pill" data-tone="good">Context ready</span></div></article>`,
          '<article class="intel-capability-card"><div class="workspace-action-card-head"><div class="workspace-action-card-copy"><div class="workflow-title-text">Patch Review</div><p>Two documentation files are staged with preview-ready diffs and explicit apply controls.</p></div><span class="operator-action-status workspace-action-state" data-tone="ok">2 files staged</span></div><div class="workspace-action-path">2 selected | preview ready</div><div class="trust-scope-row"><span class="operator-scope-pill" data-tone="guard">Preview first</span><span class="operator-scope-pill" data-tone="write">Writes file</span><span class="operator-scope-pill" data-tone="local">Local only</span></div></article>',
          '<article class="intel-capability-card"><div class="workspace-action-card-head"><div class="workspace-action-card-copy"><div class="workflow-title-text">Release Cockpit</div><p>The cockpit is carrying one passed check, one pending check, and a docked release packet snapshot.</p></div><span class="operator-action-status workspace-action-state" data-tone="ok">Packet ready</span></div><div class="workspace-action-path">Latest packet Mar 10, 8:32 AM</div><div class="trust-scope-row"><span class="operator-scope-pill" data-tone="guard">Release checks</span><span class="operator-scope-pill" data-tone="export">Evidence export</span><span class="operator-scope-pill" data-tone="local">Local only</span></div></article>'
        ].join("");
      }

      const chatHistory = document.getElementById("chatHistory");
      if (chatHistory) {
        chatHistory.scrollTop = 0;
      }
      const sessionList = document.getElementById("sessionList");
      if (sessionList) {
        sessionList.scrollTop = 0;
      }
    },
    {
      chat: sampleChat,
      sessions: sampleSessions,
      sessionPass: sessionPassphrase,
      repoRoot
    }
  );
}

async function openSettingsMenu(page) {
  await page.click("#settingsMenuOpenBtn");
  await page.waitForFunction(() => {
    const panel = document.getElementById("settingsMenuPanel");
    const backdrop = document.getElementById("settingsMenuBackdrop");
    return Boolean(
      panel &&
      backdrop &&
      panel.getAttribute("aria-hidden") === "false" &&
      backdrop.getAttribute("aria-hidden") === "false"
    );
  });
}

async function closeSettingsMenu(page) {
  const isOpen = await page.evaluate(() => {
    const panel = document.getElementById("settingsMenuPanel");
    return Boolean(panel && panel.getAttribute("aria-hidden") === "false");
  });
  if (!isOpen) return;
  await page.click("#settingsMenuCloseBtn");
  await page.waitForFunction(() => {
    const panel = document.getElementById("settingsMenuPanel");
    const backdrop = document.getElementById("settingsMenuBackdrop");
    return Boolean(
      panel &&
      backdrop &&
      panel.getAttribute("aria-hidden") === "true" &&
      backdrop.getAttribute("aria-hidden") === "true"
    );
  });
}

async function configureSettings(page, options = {}) {
  const keepOpen = Boolean(options.keepOpen);
  await openSettingsMenu(page);
  await page.click("#profileNewBtn");
  await page.fill("#profileNameInput", "Local Guarded Bridge");
  await page.fill("#profileBaseUrlInput", "http://127.0.0.1:11434");
  await page.fill("#profileTimeoutInput", "18000");
  await page.fill("#profileRetryInput", "3");
  await page.click("#profileSaveBtn");
  await page.click("#profileUseBtn");

  await page.fill("#baseUrlInput", "http://127.0.0.1:11434");
  await page.fill("#timeoutInput", "18000");
  await page.fill("#retryInput", "3");
  await page.selectOption("#themeSelect", "dark");
  await page.fill("#tokenBudgetInput", "2048");
  await page.fill("#autosaveNameInput", "release-guarded");
  await page.fill("#autosaveIntervalInput", "12");
  await page.check("#autosaveEnabledInput");
  await page.check("#connectOnStartupInput");
  await page.uncheck("#allowRemoteBridgeInput");
  await page.check("#autoLoadRecommendedContextProfileInput");
  await page.click("#applySettingsBtn");
  await page.waitForFunction(() => {
    const node = document.getElementById("statusLabel");
    return Boolean(node && node.textContent && node.textContent.includes("Settings applied"));
  });
  await page.waitForFunction(() => {
    const mode = document.getElementById("workspaceModeText");
    return Boolean(mode && mode.textContent && mode.textContent.toLowerCase().includes("offline mode on"));
  });
  if (!keepOpen) {
    await closeSettingsMenu(page);
  }
  await wait(300);
}

async function captureViewport(page, filename) {
  const filePath = path.join(outputDir, filename);
  await page.screenshot({
    path: filePath
  });
  return filePath;
}

async function forceOnboardingOpen(page) {
  await page.evaluate(async () => {
    if (window.api && window.api.settings && typeof window.api.settings.get === "function" && typeof window.api.settings.update === "function") {
      const current = (await window.api.settings.get()) || {};
      await window.api.settings.update({
        ...current,
        onboardingCompleted: false
      });
    }
    if (typeof window.setOnboardingOpen === "function") {
      window.setOnboardingOpen(true);
      return;
    }
    const overlay = document.getElementById("onboardingOverlay");
    if (overlay) {
      overlay.classList.remove("hidden");
      overlay.setAttribute("aria-hidden", "false");
    }
  });
  await page.waitForFunction(() => {
    const node = document.getElementById("onboardingOverlay");
    return Boolean(node && node.getAttribute("aria-hidden") === "false");
  });
}

async function captureShots(page) {
  const artifacts = [];

  await forceOnboardingOpen(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  await wait(250);
  artifacts.push(await captureViewport(page, screenshotPlan[0].filename));

  await page.click("#onboardingSkipBtn");
  await page.waitForFunction(() => {
    const node = document.getElementById("onboardingOverlay");
    return Boolean(node && node.getAttribute("aria-hidden") === "true");
  });

  await configureSettings(page);
  await seedWorkspace(page);
  await page.locator("body").click({ position: { x: 20, y: 20 } });
  await wait(250);

  await page.evaluate(() => window.scrollTo(0, 0));
  await wait(200);
  artifacts.push(await captureViewport(page, screenshotPlan[1].filename));

  await page.evaluate(() => {
    const panel = document.querySelector(".panel-sessions");
    if (panel) {
      panel.scrollIntoView({ block: "start" });
    }
    const inspectBtn = document.getElementById("sessionInspectTrayBtn");
    if (inspectBtn) {
      inspectBtn.click();
    }
  });
  await wait(200);
  artifacts.push(await captureViewport(page, screenshotPlan[2].filename));

  await page.evaluate(() => window.scrollTo(0, 0));
  await wait(160);
  await openSettingsMenu(page);
  await page.evaluate(() => {
    const panel = document.getElementById("settingsMenuPanel");
    if (panel) panel.scrollTop = 0;
  });
  await wait(200);
  artifacts.push(await captureViewport(page, screenshotPlan[3].filename));
  await closeSettingsMenu(page);

  await page.evaluate(() => {
    const panel = document.querySelector(".panel-runtime");
    if (panel) {
      panel.scrollIntoView({ block: "start" });
    }
    const runtimeOutputTrayBtn = document.getElementById("runtimeOutputTrayBtn");
    if (runtimeOutputTrayBtn) {
      runtimeOutputTrayBtn.click();
    }
    const runtimeLogsOutputBtn = document.getElementById("runtimeLogsOutputBtn");
    if (runtimeLogsOutputBtn) {
      runtimeLogsOutputBtn.click();
    }
  });
  await wait(200);
  artifacts.push(await captureViewport(page, screenshotPlan[4].filename));

  await page.evaluate(() => window.scrollTo(0, 0));
  await wait(200);
  await page.evaluate(async () => {
    if (window.NeuralShellRenderer && typeof window.NeuralShellRenderer.activateWorkflow === "function") {
      await window.NeuralShellRenderer.activateWorkflow("release_audit", {
        persist: false,
        announce: false,
        autoLoadRecommendedProfile: false
      });
    }
    if (window.NeuralShellRenderer && typeof window.NeuralShellRenderer.selectContextPackProfile === "function") {
      const select = document.getElementById("contextPackProfileSelect");
      const target = select
        ? [...select.options].find((option) => option.textContent.includes("UI Surface Context Pack"))
        : null;
      if (target) {
        await window.NeuralShellRenderer.selectContextPackProfile(target.value, {
          persist: false,
          announce: false
        });
      }
    }
  });
  await wait(200);
  await page.click("#commandPaletteOpenBtn");
  await page.waitForFunction(() => {
    const node = document.getElementById("commandPaletteOverlay");
    return Boolean(node && node.getAttribute("aria-hidden") === "false");
  });
  await page.selectOption("#commandPaletteShortcutScope", "all");
  await page.fill("#commandPaletteInput", "profile:");
  await wait(200);
  artifacts.push(await captureViewport(page, screenshotPlan[5].filename));
  await page.click("#commandPaletteCloseBtn");
  await wait(200);

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
