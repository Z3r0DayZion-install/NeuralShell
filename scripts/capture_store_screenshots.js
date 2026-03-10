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
      "Profile: Local Guarded Bridge\nBase URL: http://127.0.0.1:11434\nTheme: light\nToken budget: 2048\nAutosave: enabled every 12 minutes"
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
    caption: "Primary chat, sessions, and command surfaces."
  },
  {
    filename: "03-session-management.png",
    title: "Session management",
    caption: "Saved encrypted sessions and searchable metadata."
  },
  {
    filename: "04-settings-and-profiles.png",
    title: "Settings and profiles",
    caption: "Connection profiles, token budgets, and autosave controls."
  },
  {
    filename: "05-runtime-and-integrity.png",
    title: "Runtime and integrity",
    caption: "Runtime telemetry with audit and release verification context."
  },
  {
    filename: "06-command-palette.png",
    title: "Command palette",
    caption: "Keyboard-driven action routing and operator shortcuts."
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
    document.documentElement.setAttribute("data-theme", "light");
  });
  await wait(400);
  return { app, page };
}

async function seedWorkspace(page) {
  await page.evaluate(
    async ({ chat, sessions, sessionPass }) => {
      const setText = (id, value) => {
        const node = document.getElementById(id);
        if (node) {
          node.textContent = value;
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

      if (typeof window.renderChat === "function") {
        window.renderChat(chat);
      } else {
        renderChatFallback(chat);
      }

      if (window.api && window.api.state) {
        await window.api.state.update({
          chat,
          model: "llama3"
        });
      }

      if (window.api && window.api.session) {
        const settings =
          (window.api.settings && (await window.api.settings.get())) || {};
        for (const row of sessions) {
          await window.api.session.save(
            row.name,
            {
              model: "llama3",
              chat: row.chat,
              settings,
              updatedAt: row.updatedAt
            },
            sessionPass
          );
        }
      }

      if (typeof window.refreshSessions === "function") {
        await window.refreshSessions();
      }
      if (typeof window.refreshCommands === "function") {
        await window.refreshCommands();
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
      setText("tokensUsed", "71");
      setValue("sessionName", "Release-Audit");
      setValue("sessionPass", sessionPass);
      setValue("sessionSearchInput", "");

      const sessionMetadataOutput = document.getElementById("sessionMetadataOutput");
      if (sessionMetadataOutput) {
        sessionMetadataOutput.textContent = JSON.stringify(
          {
            "Release-Audit": {
              updatedAt: "2026-03-10T08:30:00.000Z",
              tokens: 71,
              model: "llama3"
            },
            "Offline-RedTeam": {
              updatedAt: "2026-03-10T09:05:00.000Z",
              tokens: 28,
              model: "llama3"
            },
            "Founder-Handoff": {
              updatedAt: "2026-03-10T09:22:00.000Z",
              tokens: 24,
              model: "llama3"
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
            total: 71,
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
          "<div>2026-03-10 08:30 UTC - Release status locked to v1.2.1-OMEGA.</div>",
          "<div>2026-03-10 08:41 UTC - WinGet manifest validation passed.</div>",
          "<div>2026-03-10 08:55 UTC - Inbox autopilot triage dedupe active.</div>"
        ].join("");
      }

      const capabilityGraph = document.getElementById("capabilityGraph");
      if (capabilityGraph) {
        capabilityGraph.textContent = [
          "CAP_FS       count=18 targets=release/, docs/, tmp/",
          "CAP_AUDIT    count=12 targets=audit_chain, release_status",
          "CAP_MODEL    count=7  targets=llama3, profiles/local-guarded",
          "CAP_SESSION  count=6  targets=Release Audit, Founder Handoff"
        ].join("\n");
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
      sessionPass: sessionPassphrase
    }
  );
}

async function configureSettings(page) {
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
  await page.selectOption("#themeSelect", "light");
  await page.fill("#tokenBudgetInput", "2048");
  await page.fill("#autosaveNameInput", "release-guarded");
  await page.fill("#autosaveIntervalInput", "12");
  await page.check("#autosaveEnabledInput");
  await page.click("#applySettingsBtn");
  await page.waitForFunction(() => {
    const node = document.getElementById("statusLabel");
    return Boolean(node && node.textContent && node.textContent.includes("Settings applied"));
  });
  await wait(300);
}

async function captureViewport(page, filename) {
  const filePath = path.join(outputDir, filename);
  await page.screenshot({
    path: filePath
  });
  return filePath;
}

async function captureShots(page) {
  const artifacts = [];

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
  });
  await wait(200);
  artifacts.push(await captureViewport(page, screenshotPlan[2].filename));

  await page.evaluate(() => {
    const panel = document.querySelector(".panel-settings");
    if (panel) {
      panel.scrollIntoView({ block: "start" });
    }
  });
  await wait(200);
  artifacts.push(await captureViewport(page, screenshotPlan[3].filename));

  await page.evaluate(() => {
    const panel = document.querySelector(".panel-runtime");
    if (panel) {
      panel.scrollIntoView({ block: "start" });
    }
  });
  await wait(200);
  artifacts.push(await captureViewport(page, screenshotPlan[4].filename));

  await page.evaluate(() => window.scrollTo(0, 0));
  await wait(200);
  await page.click("#commandPaletteOpenBtn");
  await page.waitForFunction(() => {
    const node = document.getElementById("commandPaletteOverlay");
    return Boolean(node && node.getAttribute("aria-hidden") === "false");
  });
  await page.fill("#commandPaletteInput", "Toggle Theme");
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
