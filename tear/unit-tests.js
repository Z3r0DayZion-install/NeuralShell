const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {
  validateCommandArgs,
  validateCommandName,
  validateImportedState,
  validateLog,
  validateMessages,
  validateModel,
  validatePassphrase,
  validatePatchPlanRequest,
  validateVerificationRunRequest,
  validateSettings,
  validateSessionName,
  validateWorkspaceActionRequest,
  validateStateKey,
  validateStateUpdates
} = require("../src/core/ipcValidators");
const { LLMService } = require("../src/core/llmService");
const verificationCatalog = require("../src/verificationCatalog");
const workflowCatalog = require("../src/workflowCatalog");
const airgapPolicy = require("../src/airgapPolicy");
const bridgeProfileModel = require("../src/bridgeProfileModel");
const bridgeSettingsModel = require("../src/bridgeSettingsModel");
const bridgeSettingsFeature = require("../src/bridgeSettingsFeature");
const {
  applyPatchPlan,
  applyWorkspaceAction,
  previewPatchPlan,
  previewWorkspaceAction
} = require("../src/core/workspaceActionPlanner");

function ok(name) {
  console.log(`PASS ${name}`);
}

async function testIpcValidators() {
  const output = validateMessages([{ role: "user", content: "Hello" }]);
  assert.deepEqual(output, [{ role: "user", content: "Hello" }]);
  assert.throws(() => validateMessages([{ role: "root", content: "x" }]), /invalid/i);
  assert.throws(() => validateStateKey("__proto__"), /blocked/i);
  assert.throws(() => validateStateKey("constructor"), /blocked/i);
  assert.throws(() => validateStateUpdates([]), /object/i);
  assert.doesNotThrow(() => validateStateUpdates({ tokens: 1 }));
  assert.equal(validateSessionName(" demo "), "demo");
  assert.equal(validatePassphrase(" pass "), "pass");
  assert.throws(() => validateSessionName(""), /required/i);
  assert.throws(() => validatePassphrase(""), /required/i);
  assert.equal(validateModel("llama3"), "llama3");
  assert.throws(() => validateModel(""), /required/i);
  const logPayload = validateLog("WARN", "sample");
  assert.equal(logPayload.level, "warn");
  assert.equal(logPayload.message, "sample");
  assert.throws(() => validateLog("fatal", "x"), /invalid/i);
  const settings = validateSettings({
    ollamaBaseUrl: "http://127.0.0.1:11434",
    timeoutMs: 5000,
    retryCount: 3,
    theme: "light",
    clockEnabled: true,
    clock24h: true,
    clockUtcOffset: "+02:00",
    personalityProfile: "engineer",
    safetyPolicy: "strict",
    rgbEnabled: true,
    rgbProvider: "openrgb",
    rgbHost: "127.0.0.1",
    rgbPort: 6742,
    rgbTargets: ["keyboard", "mouse"],
    tokenBudget: 1200,
    autosaveEnabled: true,
    autosaveIntervalMin: 10,
    autosaveName: "autosave-main"
  });
  assert.equal(settings.timeoutMs, 5000);
  assert.equal(settings.theme, "light");
  assert.equal(settings.clockEnabled, true);
  assert.equal(settings.clock24h, true);
  assert.equal(settings.clockUtcOffset, "+02:00");
  assert.equal(settings.personalityProfile, "engineer");
  assert.equal(settings.safetyPolicy, "strict");
  assert.equal(settings.rgbEnabled, true);
  assert.equal(settings.rgbProvider, "openrgb");
  assert.equal(settings.rgbHost, "127.0.0.1");
  assert.equal(settings.rgbPort, 6742);
  assert.deepEqual(settings.rgbTargets, ["keyboard", "mouse"]);
  assert.equal(settings.tokenBudget, 1200);
  assert.equal(settings.autosaveEnabled, true);
  assert.equal(settings.autosaveIntervalMin, 10);
  assert.equal(settings.autosaveName, "autosave-main");
  assert.equal(validateCommandName("Echo_1"), "echo_1");
  assert.deepEqual(validateCommandArgs(["a", "b"]), ["a", "b"]);
  const imported = validateImportedState({
    model: "llama3",
    theme: "dark",
    tokens: 12,
    chat: [{ role: "user", content: "hello", timestamp: "2026-02-16T00:00:00.000Z" }],
    settings: { retryCount: 2 }
  });
  assert.equal(imported.model, "llama3");
  assert.equal(imported.chat.length, 1);
  assert.throws(() => validateImportedState({ chat: [{ role: "root", content: "x" }] }), /invalid/i);
  ok("ipcValidators");
}

function testWorkspaceActionGuards() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "neuralshell-workspace-"));
  try {
    const request = validateWorkspaceActionRequest({
      kind: "file_replace",
      rootPath: tempRoot,
      directory: "docs",
      filename: "My Notes.md",
      content: "# Notes\n"
    });
    assert.equal(request.filename, "My Notes.md");

    const preview = previewWorkspaceAction(request);
    assert.equal(preview.relativePath, "docs/My Notes.md");
    assert.match(preview.previewText, /My Notes\.md/);

    assert.throws(() => validateWorkspaceActionRequest({
      kind: "file_replace",
      rootPath: tempRoot,
      directory: "docs",
      filename: "bad?.md",
      content: "# invalid\n"
    }), /unsupported|invalid/i);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
  ok("workspace action guards");
}

function testWorkflowStateValidators() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "neuralshell-validator-"));
  try {
    const imported = validateImportedState({
      model: "llama3",
      theme: "dark",
      tokens: 42,
      chat: [{ role: "assistant", content: "ready" }],
      settings: {
        timeoutMs: 9000,
        retryCount: 1,
        clockUtcOffset: "-07:00",
        personalityProfile: "founder",
        safetyPolicy: "strict",
        rgbProvider: "none",
        rgbTargets: ["keyboard"],
        tokenBudget: 2048,
        autosaveEnabled: true,
        autosaveIntervalMin: 15,
        autosaveName: "workflow-autosave",
        connectionProfiles: [
          {
            id: "profile-1",
            name: "Primary",
            baseUrl: "http://127.0.0.1:11434",
            timeoutMs: 12000,
            retryCount: 4,
            defaultModel: "llama3.2"
          }
        ],
        activeProfileId: "profile-1",
        connectOnStartup: false
      },
      workflowId: "bug_triage",
      outputMode: "patch_plan",
      workspaceAttachment: {
        rootPath: tempRoot,
        label: "validator-workspace",
        attachedAt: "2026-03-11T10:00:00.000Z",
        signals: ["package.json", "docs/"]
      },
      lastArtifact: {
        title: "Guarded Bug Fix Patch Plan",
        workflowId: "bug_triage",
        outputMode: "patch_plan",
        content: "{\"files\":[]}",
        generatedAt: "2026-03-11T10:00:00.000Z"
      },
      releasePacketHistory: [
        {
          workflowId: "shipping_audit",
          outputMode: "shipping_packet",
          content: "# Release Packet",
          generatedAt: "2026-03-11T10:05:00.000Z"
        }
      ],
      patchPlan: {
        id: "patch-plan-1",
        workflowId: "bug_triage",
        outputMode: "patch_plan",
        title: "Patch Plan",
        summary: "Apply the smallest safe change.",
        generatedAt: "2026-03-11T10:00:00.000Z",
        rootPath: tempRoot,
        verification: ["Run lint"],
        totalFiles: 1,
        newFiles: 1,
        modifiedFiles: 0,
        totalBytes: 18,
        totalLines: 2,
        selectedFileIds: ["file-1"],
        files: [
          {
            fileId: "file-1",
            path: "docs/My Notes.md",
            status: "new",
            rationale: "Allow common filenames.",
            content: "# Notes\n",
            diffText: "--- a/docs/My Notes.md",
            bytes: 8,
            lines: 1,
            selected: true,
            appliedAt: "",
            absolutePath: path.join(tempRoot, "docs", "My Notes.md")
          }
        ]
      },
      promotedPaletteActions: [
        {
          id: "shortcut-bug-triage-documentation",
          workflowId: "bug_triage",
          groupId: "documentation",
          groupTitle: "Documentation Surface",
          label: "Verify Documentation Surface",
          detail: "Review the documentation path.",
          promptLead: "Verify docs.",
          checks: ["Run lint"],
          filePaths: ["docs/My Notes.md"],
          promotedAt: "2026-03-11T10:10:00.000Z"
        }
      ],
      commandPaletteShortcutScope: "all",
      verificationRunPlan: {
        id: "verification-1",
        groupId: "runtime",
        groupTitle: "Runtime Surface",
        workflowId: "bug_triage",
        rootPath: tempRoot,
        rootLabel: "validator-workspace",
        preparedAt: "2026-03-11T10:15:00.000Z",
        lastRunAt: "2026-03-11T10:16:00.000Z",
        checks: [
          {
            id: "lint",
            label: "Run lint",
            description: "Run lint",
            commandLabel: "npm run lint",
            selected: false,
            status: "passed",
            lastRunAt: "2026-03-11T10:16:00.000Z",
            exitCode: 0,
            durationMs: 1200,
            stdout: "ok",
            stderr: ""
          }
        ]
      }
    });

    assert.equal(imported.workflowId, "bug_triage");
    assert.equal(imported.outputMode, "patch_plan");
    assert.equal(imported.workspaceAttachment.label, "validator-workspace");
    assert.equal(imported.releasePacketHistory[0].title, "Release Packet");
    assert.equal(imported.patchPlan.rootPath, tempRoot);
    assert.equal(imported.patchPlan.files[0].path, "docs/My Notes.md");
    assert.equal(imported.promotedPaletteActions[0].filePaths[0], "docs/My Notes.md");
    assert.equal(imported.commandPaletteShortcutScope, "all");
    assert.equal(imported.verificationRunPlan.checks[0].id, "lint");

    const patchRequest = validatePatchPlanRequest({
      rootPath: tempRoot,
      plan: imported.patchPlan,
      selectedFileIds: ["file-1"]
    });
    assert.equal(patchRequest.rootPath, tempRoot);
    assert.equal(patchRequest.plan.files[0].path, "docs/My Notes.md");
    assert.deepEqual(patchRequest.selectedFileIds, ["file-1"]);

    const verificationRequest = validateVerificationRunRequest({
      rootPath: tempRoot,
      checkIds: ["lint", "founder_e2e"]
    });
    assert.equal(verificationRequest.rootPath, tempRoot);
    assert.deepEqual(verificationRequest.checkIds, ["lint", "founder_e2e"]);

    assert.throws(() => validateImportedState({
      workflowId: "unknown-workflow"
    }), /workflowId/i);
    assert.throws(() => validateImportedState({
      outputMode: "wrong-mode"
    }), /outputMode/i);
    assert.throws(() => validateImportedState({
      commandPaletteShortcutScope: "team"
    }), /commandPaletteShortcutScope/i);
    assert.throws(() => validateImportedState({
      workspaceAttachment: { label: "missing root" }
    }), /workspaceAttachment\.rootPath/i);
    assert.throws(() => validateImportedState({
      lastArtifact: { workflowId: "bogus" }
    }), /lastArtifact\.workflowId/i);
    assert.throws(() => validateImportedState({
      releasePacketHistory: [{ outputMode: "patch_plan", content: "bad" }]
    }), /releasePacketHistory/i);
    assert.throws(() => validateImportedState({
      patchPlan: {
        outputMode: "patch_plan",
        files: [{ path: "../escape.md", content: "bad" }]
      }
    }), /patchPlan file path/i);
    assert.throws(() => validateImportedState({
      promotedPaletteActions: [{ workflowId: "bogus", groupId: "runtime", label: "x" }]
    }), /promotedPaletteActions/i);
    assert.throws(() => validateImportedState({
      verificationRunPlan: {
        rootPath: tempRoot,
        checks: [{ id: "lint", status: "unknown" }]
      }
    }), /verificationRunPlan/i);
    assert.throws(() => validatePatchPlanRequest({
      rootPath: tempRoot,
      plan: { outputMode: "patch_plan", files: [] }
    }), /at least one file/i);
    assert.throws(() => validateVerificationRunRequest({
      rootPath: tempRoot,
      checkIds: []
    }), /at least one check/i);
    assert.throws(() => validateVerificationRunRequest({
      rootPath: tempRoot,
      checkIds: ["not-a-check"]
    }), /unsupported verification check/i);
    assert.throws(() => validateWorkspaceActionRequest({
      kind: "unsupported",
      rootPath: tempRoot,
      filename: "README.md",
      content: "# bad\n"
    }), /unsupported workspace action kind/i);
    assert.throws(() => validateWorkspaceActionRequest({
      kind: "file_replace",
      rootPath: tempRoot,
      directory: "../escape",
      filename: "README.md",
      content: "# bad\n"
    }), /workspace action directory is invalid/i);
    assert.throws(() => validateWorkspaceActionRequest({
      kind: "file_replace",
      rootPath: tempRoot,
      filename: "con",
      content: "# bad\n"
    }), /reserved Windows name/i);
    assert.throws(() => validateWorkspaceActionRequest({
      kind: "file_replace",
      rootPath: tempRoot,
      filename: "README.md",
      content: "   "
    }), /content is required/i);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
  ok("workflow state validators");
}

function testValidatorDefaultBranches() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "neuralshell-validator-defaults-"));
  try {
    assert.throws(() => validateMessages([{ content: "missing role" }]), /invalid message role/i);
    assert.throws(() => validateMessages([{ role: "user" }]), /invalid message content/i);
    assert.throws(() => validateLog(undefined, "sample"), /invalid log level/i);

    const defaultedSettings = validateSettings({
      onboardingCompleted: true,
      onboardingSeenAt: "2026-03-11T10:20:00.000Z",
      onboardingVersion: "v5",
      allowRemoteBridge: true,
      connectionProfiles: [null]
    });
    assert.equal(defaultedSettings.onboardingCompleted, true);
    assert.equal(defaultedSettings.onboardingSeenAt, "2026-03-11T10:20:00.000Z");
    assert.equal(defaultedSettings.onboardingVersion, "v5");
    assert.equal(defaultedSettings.allowRemoteBridge, true);
    assert.equal(defaultedSettings.connectionProfiles[0].id, "profile-1");
    assert.equal(defaultedSettings.connectionProfiles[0].name, "Profile 1");
    assert.equal(defaultedSettings.connectionProfiles[0].baseUrl, "http://127.0.0.1:11434");
    assert.equal(defaultedSettings.connectionProfiles[0].timeoutMs, 15000);
    assert.equal(defaultedSettings.connectionProfiles[0].retryCount, 2);
    assert.equal(defaultedSettings.connectionProfiles[0].defaultModel, "llama3");

    const imported = validateImportedState({
      workspaceAttachment: {
        rootPath: tempRoot
      },
      lastArtifact: {
        title: "Draft artifact"
      },
      releasePacketHistory: [
        {
          outputMode: "shipping_packet",
          content: "# Packet"
        }
      ],
      patchPlan: {
        files: [
          {
            path: "docs/Quick Note.md"
          }
        ]
      },
      promotedPaletteActions: [
        {}
      ],
      verificationRunPlan: {
        rootPath: tempRoot,
        checks: [
          {
            id: "lint"
          }
        ]
      }
    });

    assert.equal(imported.workspaceAttachment.label, tempRoot);
    assert.equal(imported.workspaceAttachment.attachedAt, "");
    assert.deepEqual(imported.workspaceAttachment.signals, []);
    assert.equal(imported.lastArtifact.content, "");
    assert.equal(imported.lastArtifact.generatedAt, "");
    assert.equal(imported.releasePacketHistory[0].title, "Release Packet");
    assert.equal(imported.patchPlan.workflowId, "bridge_diagnostics");
    assert.equal(imported.patchPlan.outputMode, "patch_plan");
    assert.equal(imported.patchPlan.rootPath, "");
    assert.deepEqual(imported.patchPlan.verification, []);
    assert.deepEqual(imported.patchPlan.selectedFileIds, []);
    assert.equal(imported.patchPlan.files[0].fileId, "file-1");
    assert.equal(imported.patchPlan.files[0].status, "");
    assert.equal(imported.patchPlan.files[0].rationale, "");
    assert.equal(imported.patchPlan.files[0].content, "");
    assert.equal(imported.patchPlan.files[0].diffText, "");
    assert.equal(imported.patchPlan.files[0].bytes, 0);
    assert.equal(imported.patchPlan.files[0].lines, 0);
    assert.equal(imported.patchPlan.files[0].selected, true);
    assert.equal(imported.patchPlan.files[0].appliedAt, "");
    assert.equal(imported.patchPlan.files[0].absolutePath, "");
    assert.equal(imported.promotedPaletteActions[0].groupId, "group-1");
    assert.equal(imported.promotedPaletteActions[0].id, "bridge_diagnostics:group-1");
    assert.equal(imported.promotedPaletteActions[0].workflowId, "bridge_diagnostics");
    assert.equal(imported.promotedPaletteActions[0].label, "Verify group-1");
    assert.equal(imported.promotedPaletteActions[0].detail, "");
    assert.equal(imported.promotedPaletteActions[0].promptLead, "");
    assert.deepEqual(imported.promotedPaletteActions[0].checks, []);
    assert.deepEqual(imported.promotedPaletteActions[0].filePaths, []);
    assert.equal(imported.promotedPaletteActions[0].promotedAt, "");
    assert.equal(imported.verificationRunPlan.workflowId, "bridge_diagnostics");
    assert.equal(imported.verificationRunPlan.id, "");
    assert.equal(imported.verificationRunPlan.groupId, "");
    assert.equal(imported.verificationRunPlan.groupTitle, "");
    assert.equal(imported.verificationRunPlan.rootLabel, "");
    assert.equal(imported.verificationRunPlan.preparedAt, "");
    assert.equal(imported.verificationRunPlan.lastRunAt, "");
    assert.equal(imported.verificationRunPlan.checks[0].status, "pending");
    assert.equal(imported.verificationRunPlan.checks[0].label, "");
    assert.equal(imported.verificationRunPlan.checks[0].description, "");
    assert.equal(imported.verificationRunPlan.checks[0].commandLabel, "");
    assert.equal(imported.verificationRunPlan.checks[0].selected, true);
    assert.equal(imported.verificationRunPlan.checks[0].lastRunAt, "");
    assert.equal(imported.verificationRunPlan.checks[0].exitCode, null);
    assert.equal(imported.verificationRunPlan.checks[0].durationMs, 0);
    assert.equal(imported.verificationRunPlan.checks[0].stdout, "");
    assert.equal(imported.verificationRunPlan.checks[0].stderr, "");

    const workspaceAction = validateWorkspaceActionRequest({
      kind: "artifact_json",
      rootPath: tempRoot,
      filename: "payload.json",
      content: "{}"
    });
    assert.equal(workspaceAction.proposalId, "artifact_json");
    assert.equal(workspaceAction.directory, ".");
    assert.equal(workspaceAction.title, "");
    assert.equal(workspaceAction.description, "");

    const patchPlanRequest = validatePatchPlanRequest({
      rootPath: tempRoot,
      plan: {
        files: [
          {
            path: "docs/Quick Note.md",
            content: "# note\n"
          }
        ]
      }
    });
    assert.deepEqual(patchPlanRequest.selectedFileIds, []);

    const patchPlanRequestWithFilter = validatePatchPlanRequest({
      rootPath: tempRoot,
      plan: {
        files: [
          {
            path: "docs/Quick Note.md",
            content: "# note\n"
          }
        ]
      },
      selectedFileIds: ["file-1", "", null]
    });
    assert.deepEqual(patchPlanRequestWithFilter.selectedFileIds, ["file-1"]);

    const verificationRequest = validateVerificationRunRequest({
      rootPath: tempRoot,
      checkIds: ["lint", "", null]
    });
    assert.deepEqual(verificationRequest.checkIds, ["lint"]);

    assert.throws(() => validateImportedState({
      releasePacketHistory: [
        {
          outputMode: "shipping_packet"
        }
      ]
    }), /must include content/i);
    assert.throws(() => validateWorkspaceActionRequest({
      kind: "file_replace",
      rootPath: tempRoot,
      filename: "README.md"
    }), /content is required/i);
    assert.throws(() => validateVerificationRunRequest({
      rootPath: tempRoot
    }), /at least one check/i);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
  ok("validator default branches");
}

function testCatalogHelpers() {
  assert.equal(verificationCatalog.getCheck(" lint ").id, "lint");
  assert.equal(verificationCatalog.getCheck("missing"), null);
  assert.equal(verificationCatalog.isCheckId(" founder_e2e "), true);
  assert.equal(verificationCatalog.isCheckId("missing"), false);
  assert.deepEqual(
    verificationCatalog.listChecks(["lint", "missing", "store_screenshots"]).map((check) => check.id),
    ["lint", "store_screenshots"]
  );
  assert.deepEqual(
    verificationCatalog.getChecksForGroup("automation").map((check) => check.id),
    ["lint", "founder_e2e", "store_screenshots"]
  );
  assert.deepEqual(
    verificationCatalog.getChecksForGroup("missing").map((check) => check.id),
    ["lint"]
  );

  assert.equal(workflowCatalog.getWorkflow("bug_triage").id, "bug_triage");
  assert.equal(workflowCatalog.getWorkflow("missing").id, "bridge_diagnostics");
  assert.equal(workflowCatalog.getOutputMode("shipping_packet").id, "shipping_packet");
  assert.equal(workflowCatalog.getOutputMode("missing").id, "brief");
  assert.equal(workflowCatalog.isWorkflowId("session_handoff"), true);
  assert.equal(workflowCatalog.isWorkflowId("missing"), false);
  assert.equal(workflowCatalog.isOutputModeId("handoff"), true);
  assert.equal(workflowCatalog.isOutputModeId("missing"), false);
  ok("catalog helpers");
}

function testPatchPlanHelpers() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "neuralshell-patch-plan-"));
  try {
    const docsDir = path.join(tempRoot, "docs");
    fs.mkdirSync(docsDir, { recursive: true });
    fs.writeFileSync(path.join(docsDir, "existing.md"), "old\n", "utf8");

    const nonReplacePreview = previewWorkspaceAction({
      kind: "artifact_markdown",
      rootPath: tempRoot,
      directory: "docs",
      filename: "artifact.md",
      content: "a".repeat(3305)
    });
    assert.equal(nonReplacePreview.previewKind, "content");
    assert.match(nonReplacePreview.previewText, /\n\.\.\.$/);

    const preview = previewPatchPlan({
      rootPath: tempRoot,
      plan: {
        files: [
          {
            path: "docs/existing.md",
            content: "old\nnew\n",
            selected: false
          },
          {
            path: "docs/new.md",
            rationale: "Add release notes",
            content: "hello"
          }
        ]
      }
    });

    assert.equal(preview.totalFiles, 2);
    assert.equal(preview.modifiedFiles, 1);
    assert.equal(preview.newFiles, 1);
    assert.deepEqual(preview.selectedFileIds, [preview.files[1].fileId]);
    assert.equal(preview.files[0].status, "modify");
    assert.equal(preview.files[1].status, "new");

    const appliedPatchPlan = applyPatchPlan({
      rootPath: tempRoot,
      plan: preview,
      selectedFileIds: [preview.files[1].fileId, preview.files[1].fileId]
    });
    assert.equal(appliedPatchPlan.appliedCount, 1);
    assert.equal(fs.readFileSync(path.join(docsDir, "new.md"), "utf8"), "hello\n");

    const appliedArtifact = applyWorkspaceAction({
      kind: "artifact_markdown",
      rootPath: tempRoot,
      directory: "docs",
      filename: "artifact.md",
      content: "artifact body"
    });
    assert.equal(fs.readFileSync(appliedArtifact.absolutePath, "utf8"), "artifact body\n");

    const identicalPreview = previewWorkspaceAction({
      kind: "file_replace",
      rootPath: tempRoot,
      directory: "docs",
      filename: "artifact.md",
      content: "artifact body"
    });
    assert.match(identicalPreview.diffText, /@@ no changes @@/);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
  ok("patch plan helpers");
}

function createJsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() {
      return body;
    },
    body: {
      getReader() {
        return {
          async read() {
            return { done: true, value: null };
          }
        };
      }
    }
  };
}

function createReaderResponse(status, chunks) {
  const queue = Array.isArray(chunks) ? chunks.slice() : [];
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() {
      return {};
    },
    body: {
      getReader() {
        return {
          async read() {
            if (!queue.length) {
              return { done: true, value: null };
            }
            return { done: false, value: queue.shift() };
          }
        };
      }
    }
  };
}

function createAsyncIterableResponse(status, chunks) {
  const queue = Array.isArray(chunks) ? chunks.slice() : [];
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() {
      return {};
    },
    body: {
      async *[Symbol.asyncIterator]() {
        while (queue.length) {
          yield queue.shift();
        }
      }
    }
  };
}

async function collectAsync(iterable) {
  const output = [];
  for await (const item of iterable) {
    output.push(item);
  }
  return output;
}

function testBridgeProfileModel() {
  const providerMap = {
    ollama: {
      id: "ollama",
      defaultBaseUrl: "http://127.0.0.1:11434",
      suggestedModels: ["llama3"]
    },
    openai: {
      id: "openai",
      defaultBaseUrl: "https://api.openai.com",
      suggestedModels: ["gpt-4.1-mini"]
    }
  };
  const profiles = bridgeProfileModel.normalizeBridgeProfiles({
    connectionProfiles: [
      { id: "dup", name: "Remote One", provider: "openai", baseUrl: "https://api.openai.com" },
      { id: "dup", name: "Local One", provider: "ollama", baseUrl: "http://127.0.0.1:11434" }
    ]
  }, {
    fallbackModel: "llama3",
    normalizeProviderId: (providerId) => String(providerId || "ollama").trim().toLowerCase() || "ollama",
    getProvider: (providerId) => providerMap[providerId] || providerMap.ollama,
    defaultLocalBaseUrl: "http://127.0.0.1:11434",
    defaultTimeoutMs: 15000,
    defaultRetryCount: 2
  });
  assert.equal(profiles.length, 2);
  assert.equal(profiles[0].id, "dup");
  assert.equal(profiles[1].id, "dup-1");
  assert.equal(profiles[0].defaultModel, "llama3");
  const seeded = bridgeProfileModel.normalizeBridgeProfiles({}, {
    fallbackModel: "llama3",
    normalizeProviderId: (providerId) => String(providerId || "ollama").trim().toLowerCase() || "ollama",
    getProvider: (providerId) => providerMap[providerId] || providerMap.ollama,
    defaultLocalBaseUrl: "http://127.0.0.1:11434",
    defaultTimeoutMs: 15000,
    defaultRetryCount: 2
  });
  assert.equal(seeded.length, 1);
  assert.equal(seeded[0].id, "local-default");
  assert.equal(bridgeProfileModel.resolveActiveProfileId({ activeProfileId: "dup-1" }, profiles), "dup-1");
  assert.equal(bridgeProfileModel.findBridgeProfileById(profiles, "dup-1").name, "Local One");
  ok("bridge profile model");
}

function testBridgeSettingsFeatureModule() {
  assert.equal(typeof bridgeSettingsFeature.createBridgeSettingsFeature, "function");
  ok("bridge settings feature module");
}

function testBridgeSettingsModel() {
  const providerMap = {
    ollama: {
      id: "ollama",
      defaultBaseUrl: "http://127.0.0.1:11434",
      suggestedModels: ["llama3"]
    },
    openai: {
      id: "openai",
      defaultBaseUrl: "https://api.openai.com",
      suggestedModels: ["gpt-4.1-mini"]
    }
  };
  const options = {
    fallbackModel: "llama3",
    normalizeProviderId: (providerId) => String(providerId || "ollama").trim().toLowerCase() || "ollama",
    getProvider: (providerId) => providerMap[providerId] || providerMap.ollama,
    defaultLocalBaseUrl: "http://127.0.0.1:11434",
    defaultTimeoutMs: 15000,
    defaultRetryCount: 2,
    defaultAllowRemoteBridge: false,
    defaultConnectOnStartup: true,
    defaultAutoLoadRecommendedContextProfile: false
  };
  const normalized = bridgeSettingsModel.normalizeBridgeSettings({
    allowRemoteBridge: true,
    connectionProfiles: [
      {
        id: "remote",
        name: "Remote",
        provider: "openai",
        baseUrl: "https://api.openai.com",
        timeoutMs: 22000,
        retryCount: 3,
        defaultModel: "gpt-4.1-mini"
      }
    ]
  }, options);
  assert.equal(normalized.connectionProfiles.length, 1);
  assert.equal(normalized.activeProfileId, "remote");
  assert.equal(normalized.ollamaBaseUrl, "https://api.openai.com");
  assert.equal(normalized.timeoutMs, 22000);
  assert.equal(normalized.retryCount, 3);
  assert.equal(normalized.allowRemoteBridge, true);
  assert.equal(normalized.connectOnStartup, true);
  assert.equal(normalized.autoLoadRecommendedContextProfile, false);

  const merged = bridgeSettingsModel.mergeBridgeSettings(normalized, {
    allowRemoteBridge: false,
    activeProfileId: "missing",
    connectionProfiles: [
      {
        id: "local-default",
        name: "Local Ollama",
        provider: "ollama",
        baseUrl: "http://127.0.0.1:11434",
        timeoutMs: 12000,
        retryCount: 1,
        defaultModel: "llama3"
      }
    ]
  }, options);
  assert.equal(merged.activeProfileId, "local-default");
  assert.equal(merged.ollamaBaseUrl, "http://127.0.0.1:11434");
  assert.equal(merged.timeoutMs, 12000);
  assert.equal(merged.retryCount, 1);
  assert.equal(merged.allowRemoteBridge, false);
  ok("bridge settings model");
}

function testAirgapPolicy() {
  assert.equal(airgapPolicy.isLoopbackHost("LOCALHOST"), true);
  assert.equal(airgapPolicy.isLoopbackHost("example.com"), false);
  assert.equal(
    airgapPolicy.profileNeedsRemoteAccess(
      { provider: "ollama", baseUrl: "http://127.0.0.1:11434" },
      { isRemoteProvider: (providerId) => providerId === "openai" }
    ),
    false
  );
  assert.equal(
    airgapPolicy.profileNeedsRemoteAccess(
      { provider: "openai", baseUrl: "https://api.openai.com" },
      { isRemoteProvider: (providerId) => providerId === "openai" }
    ),
    true
  );
  const selection = airgapPolicy.resolveBridgeSelection({
    profiles: [
      { id: "remote", provider: "openai", baseUrl: "https://api.openai.com" },
      { id: "local", provider: "ollama", baseUrl: "http://127.0.0.1:11434" }
    ],
    activeProfileId: "remote",
    allowRemoteBridge: false,
    isRemoteProvider: (providerId) => providerId === "openai"
  });
  assert.equal(selection.selectedProfile.id, "remote");
  assert.equal(selection.liveProfile.id, "local");
  assert.equal(selection.blockedByRemoteToggle, true);
  assert.match(
    airgapPolicy.settingsConnectionModeText({ liveAllowRemote: false, draftAllowRemote: true }),
    /turn on/i
  );
  assert.match(airgapPolicy.offlineModeSummaryText(false), /local-only|local-only|local-only/i);
  assert.equal(airgapPolicy.offlineModeEnabled({ allowRemoteBridge: false }), true);
  ok("airgap policy");
}

async function testLlmServiceRetry() {
  let calls = 0;
  const service = new LLMService({
    fetchImpl: async () => {
      calls += 1;
      if (calls === 1) {
        throw new Error("network down");
      }
      return createJsonResponse(200, { models: [{ name: "llama3" }] });
    },
    maxRetries: 1,
    retryBaseDelayMs: 1,
    requestTimeoutMs: 1000
  });

  const models = await service.getModelList();
  assert.equal(calls, 2);
  assert.deepEqual(models, ["llama3"]);
  const health = await service.getHealth();
  assert.equal(health.ok, true);
  ok("llmService retry");
}

async function testLlmServiceOffline() {
  const service = new LLMService({
    fetchImpl: async () => {
      throw new Error("connection refused");
    },
    maxRetries: 1,
    retryBaseDelayMs: 1,
    requestTimeoutMs: 20
  });

  service.setModel("llama3");
  await assert.rejects(() => service.chat([{ role: "user", content: "hi" }], false), /connection refused|timed out|failed/i);
  const health = await service.getHealth();
  assert.equal(health.ok, false);
  ok("llmService offline");
}

async function testLlmServiceCancel() {
  let resolver;
  const pending = new Promise((resolve) => {
    resolver = resolve;
  });

  const service = new LLMService({
    fetchImpl: async (_url, init) => {
      await pending;
      if (init && init.signal && init.signal.aborted) {
        throw new Error("aborted");
      }
      return createJsonResponse(200, { message: { content: "ok" } });
    },
    maxRetries: 0,
    requestTimeoutMs: 5000
  });

  const statuses = [];
  service.onStatusChange((s) => statuses.push(s));
  service.setModel("llama3");
  const run = service.chat([{ role: "user", content: "cancel me" }], false);
  service.cancelStream();
  resolver();
  await assert.rejects(() => run, /cancelled/i);
  assert.ok(statuses.includes("cancelled"));
  ok("llmService cancel");
}

async function testLlmServicePersonaAndConfigure() {
  let payload = null;
  const service = new LLMService({
    fetchImpl: async (_url, init) => {
      payload = JSON.parse(String(init.body || "{}"));
      return createJsonResponse(200, { message: { content: "ok" } });
    },
    maxRetries: 0,
    requestTimeoutMs: 1000
  });

  assert.throws(() => service.setPersona("invalid"), /Unsupported persona/i);
  service.configure({
    baseUrl: "http://127.0.0.1:22434",
    maxRetries: 3,
    requestTimeoutMs: 2500,
    retryBaseDelayMs: 1,
    persona: "founder"
  });
  assert.equal(service.baseUrl, "http://127.0.0.1:22434");
  assert.equal(service.maxRetries, 3);
  assert.equal(service.requestTimeoutMs, 2500);
  assert.equal(service.retryBaseDelayMs, 1);
  assert.equal(service.persona, "founder");

  service.setModel("llama3.2");
  const response = await service.chat([{ role: "user", content: "hello" }], false);
  assert.equal(response.message.content, "ok");
  assert.equal(payload.model, "llama3.2");
  assert.equal(payload.messages[0].role, "system");
  assert.match(payload.messages[0].content, /founder mode/i);

  const withSystem = service._applyPersona([
    { role: "system", content: "keep-this-system-prompt" },
    { role: "user", content: "x" }
  ]);
  assert.equal(withSystem[0].content, "keep-this-system-prompt");
  ok("llmService persona/config");
}

async function testLlmServiceAutoDetect() {
  const service = new LLMService({
    fetchImpl: async (url) => {
      if (url.endsWith("/api/version")) {
        return createJsonResponse(200, { version: "1.0.0" });
      }
      if (url.endsWith("/api/tags")) {
        return createJsonResponse(200, {
          models: [{ name: "llama3" }, { name: "mistral" }]
        });
      }
      throw new Error(`unexpected endpoint: ${url}`);
    },
    maxRetries: 0
  });

  const detected = await service.autoDetectLocalLLM();
  assert.equal(detected.ok, true);
  assert.equal(detected.detected, true);
  assert.equal(detected.modelCount, 2);
  assert.deepEqual(detected.models, ["llama3", "mistral"]);

  const offline = new LLMService({
    fetchImpl: async () => {
      throw new Error("bridge offline");
    },
    maxRetries: 0
  });
  const missing = await offline.autoDetectLocalLLM();
  assert.equal(missing.ok, false);
  assert.equal(missing.detected, false);
  assert.match(missing.reason, /bridge offline/i);
  ok("llmService autodetect");
}

async function testLlmServiceStreamingParsers() {
  const streamService = new LLMService({
    fetchImpl: async () =>
      createAsyncIterableResponse(200, [
        '{"delta":"a"}\nnot-json\n',
        '{"delta":"b"}\n{"done":true}\n'
      ]),
    maxRetries: 0
  });
  const stream = await streamService.chat(
    [{ role: "user", content: "stream please" }],
    true
  );
  const streamRows = await collectAsync(stream);
  assert.equal(streamRows.length, 3);
  assert.equal(streamRows[0].delta, "a");
  assert.equal(streamRows[2].done, true);

  const readerService = new LLMService({
    fetchImpl: async () =>
      createReaderResponse(200, [
        Buffer.from('{"chunk":1}\n{"chunk":2}\n'),
        Buffer.from('{"chunk":3}\n')
      ]),
    maxRetries: 0
  });
  const readerRows = await collectAsync(
    readerService._streamJsonLines(
      createReaderResponse(200, [Buffer.from('{"n":1}\n{"n":2}\n')])
    )
  );
  assert.equal(readerRows.length, 2);
  assert.equal(readerRows[1].n, 2);

  const typed = readerService._toUint8Array("abc");
  assert.ok(typed instanceof Uint8Array);
  assert.equal(typed.length, 3);
  ok("llmService stream");
}

async function testLlmServiceFailureModes() {
  const statusService = new LLMService({
    fetchImpl: async () => createJsonResponse(500, { error: "bad" }),
    maxRetries: 0
  });
  await assert.rejects(
    () => statusService.chat([{ role: "user", content: "x" }], false),
    /status 500/i
  );

  const malformedService = new LLMService({
    fetchImpl: async () => ({}),
    maxRetries: 0
  });
  await assert.rejects(
    () => malformedService.chat([{ role: "user", content: "x" }], false),
    /failed to fetch/i
  );

  const timeoutService = new LLMService({
    fetchImpl: async (_url, init) =>
      new Promise((_resolve, reject) => {
        init.signal.addEventListener("abort", () => reject(new Error("aborted")));
      }),
    maxRetries: 0,
    requestTimeoutMs: 10
  });
  await assert.rejects(
    () => timeoutService.chat([{ role: "user", content: "timeout" }], false),
    /timed out/i
  );

  const noFetchService = new LLMService({ fetchImpl: "not-a-function", maxRetries: 0 });
  await assert.rejects(
    () => noFetchService._fetchResponse("/api/tags", { method: "GET" }),
    /No fetch implementation available/i
  );

  let seen = 0;
  const unsubscribe = statusService.onStatusChange(() => {
    seen += 1;
  });
  statusService._emitStatus("online");
  unsubscribe();
  statusService._emitStatus("online");
  assert.equal(seen, 1);
  assert.equal(statusService.cancelStream(), false);
  ok("llmService failure modes");
}

async function run() {
  await testIpcValidators();
  testWorkspaceActionGuards();
  testWorkflowStateValidators();
  testValidatorDefaultBranches();
  testCatalogHelpers();
  testPatchPlanHelpers();
  testBridgeProfileModel();
  testBridgeSettingsFeatureModule();
  testBridgeSettingsModel();
  testAirgapPolicy();
  await testLlmServiceRetry();
  await testLlmServiceOffline();
  await testLlmServiceCancel();
  await testLlmServicePersonaAndConfigure();
  await testLlmServiceAutoDetect();
  await testLlmServiceStreamingParsers();
  await testLlmServiceFailureModes();
  console.log("All unit tests passed.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});




