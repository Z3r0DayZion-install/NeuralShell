const test = require("node:test");
const assert = require("node:assert/strict");
const ipcValidators = require("../src/core/ipcValidators");
const {
  validateCommandArgs,
  validateCommandName,
  validateImportedState,
  validateLog,
  validateMessages,
  validateModel,
  validatePassphrase,
  validatePatchPlanRequest,
  validateSettings,
  validateSessionName,
  validateStateKey,
  validateStateUpdates,
  validateVerificationRunHistory,
  validateVerificationRunRequest,
  validateWorkspaceActionRequest,
  internal
} = ipcValidators;

test("validateMessages accepts well-formed messages", () => {
  const input = [{ role: "user", content: "Hello" }];
  const output = validateMessages(input);
  assert.deepEqual(output, [{ role: "user", content: "Hello" }]);
});

test("validateMessages rejects invalid role", () => {
  assert.throws(() => validateMessages([{ role: "root", content: "x" }]), /invalid/i);
});

test("validateStateKey blocks prototype pollution keys", () => {
  assert.throws(() => validateStateKey("__proto__"), /blocked/i);
  assert.throws(() => validateStateKey("constructor"), /blocked/i);
});

test("validateStateUpdates requires plain object", () => {
  assert.throws(() => validateStateUpdates([]), /object/i);
  assert.doesNotThrow(() => validateStateUpdates({ tokens: 1 }));
});

test("validateSessionName and passphrase enforce non-empty strings", () => {
  assert.equal(validateSessionName(" demo "), "demo");
  assert.equal(validatePassphrase(" pass "), "pass");
  assert.throws(() => validateSessionName(""), /required/i);
  assert.throws(() => validatePassphrase(""), /required/i);
});

test("validateModel enforces bounds", () => {
  assert.equal(validateModel("llama3"), "llama3");
  assert.throws(() => validateModel(""), /required/i);
});

test("validateLog normalizes and validates level", () => {
  const payload = validateLog("WARN", "sample");
  assert.equal(payload.level, "warn");
  assert.equal(payload.message, "sample");
  assert.throws(() => validateLog("fatal", "x"), /invalid/i);
});

test("validateSettings normalizes provider-aware bridge profiles", () => {
  const settings = validateSettings({
    connectionProfiles: [
      {
        id: "hosted",
        name: "Hosted OpenAI",
        provider: "openai",
        baseUrl: "https://api.openai.com",
        defaultModel: "gpt-4.1-mini",
        apiKey: "secret-key"
      }
    ]
  });

  assert.equal(settings.connectionProfiles[0].provider, "openai");
  assert.equal(settings.connectionProfiles[0].defaultModel, "gpt-4.1-mini");
  assert.equal(settings.connectionProfiles[0].apiKey, "secret-key");
});

test("validateSettings rejects out-of-range RGB ports", () => {
  assert.throws(() => validateSettings({ rgbPort: 70000 }), /rgbPort out of range/i);
});

test("validateWorkspaceActionRequest normalizes directories and rejects traversal", () => {
  const payload = validateWorkspaceActionRequest({
    kind: "file_replace",
    rootPath: ".",
    directory: "nested/../keep",
    filename: "README.md",
    content: "update",
    title: "patch"
  });
  assert.equal(payload.directory, "keep");
  assert.throws(
    () => validateWorkspaceActionRequest({ kind: "file_replace", rootPath: ".", directory: "../bad", filename: "x", content: "y" }),
    /workspace action directory is invalid/i
  );
});

test("validatePatchPlanRequest enforces file paths and selections", () => {
  const request = validatePatchPlanRequest({
    rootPath: ".",
    plan: {
      outputMode: "patch_plan",
      files: [
        {
          path: "docs/README.md",
          lines: [],
          hunks: [
            {
              lines: [{ type: "add", text: "a" }]
            }
          ]
        }
      ]
    },
    selectedFileIds: ["  ", "file-1"]
  });
  assert.ok(request.plan.files[0].path.endsWith("docs/README.md"));
  assert.deepEqual(request.selectedFileIds, ["file-1"]);
});

test("validateVerificationRunRequest handles missing and invalid checks", () => {
  assert.throws(
    () => validateVerificationRunRequest({ rootPath: ".", checkIds: [] }),
    /must include at least one check/i
  );
  const valid = validateVerificationRunRequest({
    rootPath: ".",
    checkIds: ["lint", "  lint  "]
  });
  assert.deepEqual(valid.checkIds, ["lint", "lint"]);
});

test("validateVerificationRunHistory enforces checks and selected ids", () => {
  const item = validateVerificationRunHistory([
    {
      rootPath: ".",
      checks: [{ id: "lint", status: "passed" }],
      selectedCheckIds: ["lint"]
    }
  ]);
  assert.equal(item[0].workflowId, "bridge_diagnostics");
  assert.equal(item[0].selectedCheckIds[0], "lint");
});

test("validateImportedState covers optional metadata", () => {
  const imported = validateImportedState({
    model: "llama3",
    theme: "dark",
    tokens: "42",
    chat: [{ role: "user", content: "hi" }],
    settings: { timeoutMs: 500, retryCount: 1, rgbTargets: ["keyboard"] },
    workflowId: "bridge_diagnostics",
    outputMode: "checklist",
    workspaceAttachment: { rootPath: ".", label: "deck" },
    contextPack: { rootPath: ".", rootLabel: "context", entries: [{ relativePath: "notes/info.md" }] },
    contextPackProfiles: [
      { workspaceRoot: ".", workspaceLabel: "deck", filePaths: ["notes/info.md"] }
    ],
    activeContextPackProfileId: "profile-1",
    lastArtifact: { outputMode: "release_packet", content: "ok" },
    releasePacketHistory: [{ outputMode: "release_packet", content: "ok" }],
    patchPlan: {
      outputMode: "patch_plan",
      files: [
        { path: "docs/guide.md", hunks: [{ lines: [{ type: "context", text: "ok" }] }] }
      ]
    },
    promotedPaletteActions: [{ groupId: "custom", label: "check", checks: ["lint"] }],
    commandPaletteShortcutScope: "workflow",
    verificationRunPlan: {
      rootPath: ".",
      checks: [{ id: "lint", status: "running" }]
    },
    verificationRunHistory: [
      {
        rootPath: ".",
        checks: [{ id: "lint", status: "passed" }],
        selectedCheckIds: ["lint"]
      }
    ]
  });
  assert.equal(imported.model, "llama3");
  assert.equal(imported.settings.timeoutMs, 500);
  assert.equal(imported.workspaceAttachment.label, "deck");
  assert.equal(imported.commandPaletteShortcutScope, "workflow");
});

test("validateImportedState handles deep provenance and release artifacts", () => {
  const imported = validateImportedState({
    model: "mistral",
    chat: [{ role: "assistant", content: "ready" }],
    settings: { timeoutMs: 600, retryCount: 3, rgbTargets: ["keyboard", "mouse"] },
    workspaceAttachment: { rootPath: ".", label: "workspace", attachedAt: "now", signals: ["ready"] },
    contextPack: {
      rootPath: ".",
      rootLabel: "pack",
      entries: [
        {
          relativePath: "docs/key.md",
          absolutePath: "C:/docs/key.md",
          modifiedAt: "today",
          content: "note"
        }
      ]
    },
    contextPackProfiles: [
      {
        workspaceRoot: ".",
        workspaceLabel: "workspace",
        name: "profile",
        filePaths: ["docs/key.md"],
        fileSnapshots: [
          {
            relativePath: "docs/key.md",
            modifiedAt: "now"
          }
        ]
      }
    ],
    lastArtifact: {
      id: "artifact",
      workflowId: "bridge_diagnostics",
      outputMode: "release_packet",
      title: "artifact",
      content: "payload",
      provenance: {
        contextPack: { id: "pack", name: "context", filePaths: ["docs/key.md"], fileCount: 1 },
        contextPackProfile: { id: "profile", name: "profile", fileCount: 1 },
        sourceArtifact: { id: "source", outputMode: "release_packet", title: "src" },
        patchPlan: { id: "plan", totalFiles: 1 },
        verification: { runIds: ["lint"] },
        lineage: { packetId: "packet", parentPacketId: "parent", sourceArtifactId: "source", generation: 2 }
      }
    },
    releasePacketHistory: [
      {
        outputMode: "release_packet",
        content: "history",
        title: "history"
      }
    ],
    patchPlan: {
      outputMode: "patch_plan",
      workflowId: "bridge_diagnostics",
      verification: ["lint"],
      files: [
        {
          path: "docs/guide.md",
          status: "new",
          rationale: "fix",
          diffText: "diff",
          hunks: [
            {
              lines: [
                { type: "add", text: "add" },
                { type: "remove", text: "rem" }
              ]
            }
          ]
        }
      ],
      provenance: {
        contextPack: { id: "pack", name: "context" },
        contextPackProfile: { id: "profile", name: "profile" }
      }
    },
    promotedPaletteActions: [
      {
        workflowId: "bridge_diagnostics",
        groupId: "group",
        label: "action",
        checks: ["lint"],
        filePaths: ["docs/guide.md"]
      }
    ],
    commandPaletteShortcutScope: "all",
    verificationRunPlan: {
      rootPath: ".",
      checks: [
        { id: "lint", status: "running", selected: true, stdout: "ok", stderr: "" }
      ]
    },
    verificationRunHistory: [
      {
        rootPath: ".",
        checks: [{ id: "lint", status: "passed" }],
        selectedCheckIds: ["lint"],
        workflowId: "bridge_diagnostics"
      }
    ]
  });
  assert.equal(imported.patchPlan.files[0].status, "new");
  assert.equal(imported.promotedPaletteActions[0].groupId, "group");
  assert.equal(imported.verificationRunHistory[0].workflowId, "bridge_diagnostics");
});

test("validateCommand helpers enforce format", () => {
  assert.equal(validateCommandName("My_Cmd"), "my_cmd");
  assert.throws(() => validateCommandName("Bad Name"), /invalid command name/i);
  assert.deepEqual(validateCommandArgs([1, null, undefined]), ["1", "", ""]);
  assert.throws(() => validateCommandArgs("not array"), /must be an array/i);
});

test("validateImportedState rejects malformed artifact provenance", () => {
  const base = {
    model: "llama3",
    chat: [{ role: "user", content: "hi" }]
  };
  const cases = [
    [
      "contextPack must be object",
      {
        lastArtifact: {
          outputMode: "release_packet",
          content: "ok",
          provenance: { contextPack: "bad" }
        }
      },
      /contextPack must be an object/i
    ],
    [
      "contextPackProfile must be object",
      {
        lastArtifact: {
          outputMode: "release_packet",
          content: "ok",
          provenance: { contextPackProfile: "bad" }
        }
      },
      /contextPackProfile must be an object/i
    ],
    [
      "sourceArtifact outputMode invalid",
      {
        lastArtifact: {
          outputMode: "release_packet",
          content: "ok",
          provenance: {
            sourceArtifact: { outputMode: "invalid_mode" }
          }
        }
      },
      /invalid artifact provenance sourceArtifact\.outputMode/i
    ],
    [
      "verification must be object",
      {
        lastArtifact: {
          outputMode: "release_packet",
          content: "ok",
          provenance: { verification: "bad" }
        }
      },
      /artifact provenance verification must be an object/i
    ],
    [
      "lineage must be object",
      {
        lastArtifact: {
          outputMode: "release_packet",
          content: "ok",
          provenance: { lineage: "bad" }
        }
      },
      /artifact provenance lineage must be an object/i
    ]
  ];
  for (const [name, payload, pattern] of cases) {
    assert.throws(() => validateImportedState({ ...base, ...payload }), pattern, name);
  }
});

test("validatePatchPlanRequest rejects malformed hunks and provenance", () => {
  const badPlan = {
    outputMode: "patch_plan",
    files: [
      {
        path: "docs/guide.md",
        hunks: [
          {
            lines: [{ type: "bad", text: "x" }]
          }
        ]
      }
    ],
  };
  assert.throws(
    () => validatePatchPlanRequest({ rootPath: ".", plan: badPlan }),
    /patchPlan\.files\[\]\.hunks\[\d+\]\.lines\[\d+\] type is invalid/i
  );
});

test("validateImportedState rejects release packet history without content", () => {
  const payload = {
    model: "llama3",
    releasePacketHistory: [
      {
        outputMode: "release_packet",
        content: "   "
      }
    ]
  };
  assert.throws(
    () => validateImportedState(payload),
    /releasePacketHistory\[0\] must include content/i
  );
});

test("validateImportedState rejects release packet history with wrong output mode", () => {
  const payload = {
    model: "llama3",
    releasePacketHistory: [
      {
        outputMode: "checklist",
        content: "ok"
      }
    ]
  };
  assert.throws(
    () => validateImportedState(payload),
    /must use release_packet outputMode/i
  );
});

test("validatePatchPlanRequest rejects files outside the workspace", () => {
  const payload = {
    rootPath: ".",
    plan: {
      outputMode: "patch_plan",
      files: [
        {
          path: "../outside.md",
          hunks: [{ lines: [] }]
        }
      ]
    }
  };
  assert.throws(
    () => validatePatchPlanRequest(payload),
    /patchPlan file path is invalid/i
  );
});

test("validatePatchPlanRequest preserves nested provenance data", () => {
  const request = validatePatchPlanRequest({
    rootPath: ".",
    plan: {
      outputMode: "patch_plan",
      workflowId: "bridge_diagnostics",
      files: [
        {
          path: "docs/guide.md",
          hunks: [{ lines: [] }]
        }
      ],
      provenance: {
        contextPack: { workspaceRoot: ".", filePaths: ["docs/guide.md"] },
        contextPackProfile: { workspaceRoot: ".", workspaceLabel: "workspace", filePaths: ["docs/guide.md"] }
      }
    }
  });
  assert.equal(request.plan.provenance.contextPack.filePaths[0], "docs/guide.md");
  assert.ok(request.plan.provenance.contextPackProfile);
  assert.equal(request.plan.provenance.contextPackProfile.fileCount, 0);
});

test("validateVerificationRunPlan rejects unknown workflow id", () => {
  assert.throws(
    () => internal.validateVerificationRunPlan({ rootPath: ".", workflowId: "bogus", checks: [{ id: "lint" }] }),
    /invalid verificationRunPlan\.workflowId/i
  );
});

test("validateVerificationRunHistory rejects entries without checks", () => {
  assert.throws(
    () => validateVerificationRunHistory([{ rootPath: ".", checks: [], selectedCheckIds: ["lint"] }]),
    /must include checks/i
  );
});

test("validateVerificationRunHistory rejects invalid selected checks", () => {
  assert.throws(
    () =>
      validateVerificationRunHistory([
        { rootPath: ".", checks: [{ id: "lint" }], selectedCheckIds: ["missing"] }
      ]),
    /invalid verificationRunHistory selected check/i
  );
});

test("validateWorkspaceActionRequest rejects unsupported kind and blank content", () => {
  assert.throws(
    () =>
      validateWorkspaceActionRequest({
        kind: "unsupported",
        rootPath: ".",
        directory: ".",
        filename: "file.txt",
        content: "x"
      }),
    /unsupported workspace action kind/i
  );
  assert.throws(
    () =>
      validateWorkspaceActionRequest({
        kind: "file_replace",
        rootPath: ".",
        directory: ".",
        filename: "file.txt",
        content: "  "
      }),
    /workspace action content is required/i
  );
});

test("internal helpers cover workspace, artifact, context pack, and release flows", () => {
  assert.equal(internal.normalizeBridgeProviderId(" OpenAI "), "openai");
  const provider = internal.getBridgeProvider("openai");
  assert.equal(provider.id, "openai");

  assert.equal(internal.normalizeUtcOffset("+05:30"), "+05:30");
  assert.throws(() => internal.normalizeUtcOffset("bad"), /clockUtcOffset/i);

  const attachment = internal.validateWorkspaceAttachment({
    rootPath: ".",
    label: "deck",
    signals: ["ready"]
  });
  assert.equal(attachment.label, "deck");
  assert.deepEqual(attachment.signals, ["ready"]);

  const contextPack = internal.validateContextPack({
    rootPath: ".",
    rootLabel: "pack",
    name: "context pack",
    entries: [{ relativePath: "notes/info.md" }]
  });
  assert.equal(contextPack.entries[0].relativePath, "notes/info.md");

  const profile = internal.validateContextPackProfile(
    {
      workspaceRoot: ".",
      workspaceLabel: "desk",
      filePaths: ["notes/info.md"]
    },
    0
  );
  assert.equal(profile.workspaceLabel, "desk");

  const profiles = internal.validateContextPackProfiles([
    {
      workspaceRoot: ".",
      workspaceLabel: "desk",
      filePaths: ["notes/info.md"]
    }
  ]);
  assert.equal(profiles.length, 1);

  const artifact = internal.validateArtifact({
    outputMode: "release_packet",
    content: "payload",
    provenance: {
      contextPack: { filePaths: ["notes/info.md"], workspaceRoot: "." },
      patchPlan: { id: "plan", totalFiles: 1 }
    }
  });
  assert.equal(artifact.content, "payload");

  const provenance = internal.validateArtifactProvenance({
    workspaceRoot: ".",
    contextPack: { filePaths: ["notes/info.md"], workspaceRoot: "." },
    contextPackProfile: { filePaths: ["notes/info.md"], workspaceRoot: "." },
    sourceArtifact: { id: "source", outputMode: "release_packet" },
    patchPlan: { id: "plan", totalFiles: 1 },
    verification: { runIds: ["lint"], selectedCount: 1 },
    lineage: { packetId: "packet", generation: 1 }
  });
  assert.equal(provenance.contextPack.filePaths[0], "notes/info.md");

  const history = internal.validateReleasePacketHistory([
    { outputMode: "release_packet", content: "ok" }
  ]);
  assert.equal(history[0].title, "Release Packet");
});

test("internal patch plan helpers normalize paths, hunks, and promoted actions", () => {
  assert.equal(internal.validatePatchPlanFilePath("docs/guide.md"), "docs/guide.md");
  assert.throws(
    () => internal.validatePatchPlanFilePath("../bad.md"),
    /patchPlan file path is invalid/i
  );

  const line = internal.validatePatchPlanHunkLine({ type: "add", text: "a" }, 0, 0);
  assert.equal(line.type, "add");

  const hunk = internal.validatePatchPlanHunk(
    {
      lines: [{ type: "context", text: "ctx" }],
      selected: false
    },
    0
  );
  assert.equal(hunk.selected, false);

  const provenance = internal.validatePatchPlanProvenance({
    workspaceRoot: ".",
    contextPack: { workspaceRoot: ".", filePaths: ["docs/guide.md"] },
    contextPackProfile: { workspaceRoot: ".", filePaths: ["docs/guide.md"] }
  });
  assert.equal(provenance.contextPack.filePaths[0], "docs/guide.md");

  const plan = internal.validatePatchPlan({
    workflowId: "bridge_diagnostics",
    files: [
      {
        path: "docs/guide.md",
        hunks: [{ lines: [{ type: "context", text: "" }] }]
      }
    ],
    provenance: {
      contextPack: { workspaceRoot: ".", filePaths: ["docs/guide.md"] }
    }
  });
  assert.equal(plan.files[0].path, "docs/guide.md");

  const action = internal.validatePromotedPaletteAction(
    {
      workflowId: "bridge_diagnostics",
      groupId: "group",
      label: "check",
      checks: ["lint"],
      filePaths: ["docs/guide.md"]
    },
    0
  );
  assert.equal(action.groupId, "group");

  const actions = internal.validatePromotedPaletteActions([
    {
      workflowId: "bridge_diagnostics",
      groupId: "group",
      label: "check",
      checks: ["lint"],
      filePaths: ["docs/guide.md"]
    }
  ]);
  assert.equal(actions.length, 1);
});

test("internal verification helpers process run plans and history", () => {
  const check = internal.validateVerificationRunCheck({ id: "lint", status: "running" }, 0);
  assert.equal(check.status, "running");

  const plan = internal.validateVerificationRunPlan({
    rootPath: ".",
    checks: [{ id: "lint", status: "running" }]
  });
  assert.equal(plan.checks[0].id, "lint");

  const historyEntry = internal.validateVerificationRunHistoryEntry(
    {
      rootPath: ".",
      checks: [{ id: "lint", status: "passed" }],
      selectedCheckIds: ["lint"]
    },
    0
  );
  assert.equal(historyEntry.selectedCheckIds[0], "lint");

  const history = internal.validateVerificationRunHistory([historyEntry]);
  assert.equal(history[0].selectedCheckIds[0], "lint");
});

test("validateContextPack handles various optional fields and entry objects", () => {
  const pack = internal.validateContextPack({
    rootPath: ".",
    rootLabel: "label",
    id: "id",
    name: "name",
    builtAt: "now",
    filePaths: ["a.js"],
    entries: [
      {
        relativePath: "a.js",
        absolutePath: "/tmp/a.js",
        modifiedAt: "then",
        content: "content"
      }
    ]
  });
  assert.equal(pack.id, "id");
  assert.equal(pack.entries[0].absolutePath, "/tmp/a.js");
  assert.equal(pack.entries[0].content, "content");

  // entry without absolutePath/modifiedAt/content
  const pack2 = internal.validateContextPack({
    rootPath: ".",
    entries: [{ relativePath: "b.js" }]
  });
  assert.equal(pack2.entries[0].absolutePath, "");
  assert.equal(pack2.entries[0].content, "");
});

test("validateContextPackProfile handles optional fields and snapshots", () => {
  const profile = internal.validateContextPackProfile({
    workspaceRoot: ".",
    workflowId: "bridge_diagnostics",
    filePaths: ["a.js"],
    fileSnapshots: [
      { relativePath: "a.js", modifiedAt: "now" }
    ]
  }, 0);
  assert.equal(profile.workflowId, "bridge_diagnostics");
  assert.equal(profile.fileSnapshots[0].relativePath, "a.js");

  // workflowId validation
  assert.throws(() => internal.validateContextPackProfile({
    workspaceRoot: ".",
    workflowId: "invalid",
    filePaths: ["a.js"]
  }, 0), /invalid contextPackProfiles\[0\]\.workflowId/i);
});

test("validateArtifactProvenance handles all optional blockers", () => {
  const prov = internal.validateArtifactProvenance({
    contextPack: { id: "cp", name: "cp", fileCount: 5, builtAt: "now", filePaths: ["f1.js"] },
    contextPackProfile: { id: "cpp", name: "cpp", fileCount: 2, savedAt: "now" },
    sourceArtifact: { id: "sa", title: "sa", outputMode: "release_packet", generatedAt: "now" },
    patchPlan: { id: "pp", generatedAt: "now", totalFiles: 3 },
    verification: {
      groupId: "g1",
      runIds: ["r1"],
      executedAt: "now",
      previousRunId: "prev",
      ok: true,
      selectedCount: 1,
      passedCount: 1,
      failedCount: 0,
      pendingCount: 0,
      summary: "sum"
    },
    lineage: { packetId: "pk", parentPacketId: "ppk", sourceArtifactId: "said", generation: 1 }
  });
  assert.equal(prov.contextPack.id, "cp");
  assert.equal(prov.contextPack.filePaths[0], "f1.js");
  assert.equal(prov.contextPackProfile.id, "cpp");
  assert.equal(prov.sourceArtifact.outputMode, "release_packet");
  assert.equal(prov.patchPlan.totalFiles, 3);
  assert.equal(prov.verification.ok, true);
  assert.equal(prov.lineage.generation, 1);
});

test("validatePatchPlanProvenance handles empty/missing workspaceRoot", () => {
  const prov = internal.validatePatchPlanProvenance({
    workspaceRoot: "",
    contextPack: { id: "cp" }
  });
  assert.equal(prov.workspaceRoot, "");
  assert.equal(prov.contextPack.id, "cp");
});

test("validateImportedState handles missing optional fields across the board", () => {
  const state = validateImportedState({
    activeContextPackProfileId: "  some-id  ",
  });
  assert.equal(state.activeContextPackProfileId, "some-id");
});

test("validatePatchPlanHunk covers counts and selection defaults", () => {
  const hunk = internal.validatePatchPlanHunk({
    oldStart: 10,
    oldCount: 5,
    newStart: 12,
    newCount: 6,
    appliedAt: "now"
  }, 0);
  assert.equal(hunk.oldStart, 10);
  assert.equal(hunk.selected, true);
  assert.equal(hunk.appliedAt, "now");
  assert.equal(hunk.addedCount, 0);
});

test("validatePatchPlan file status and hunks error paths", () => {
  const planPayload = {
    outputMode: "patch_plan",
    files: [
      {
        path: "a.js",
        status: "invalid",
        hunks: []
      }
    ]
  };
  assert.throws(() => internal.validatePatchPlan(planPayload), /file status must be new or modify/i);

  const planPayload2 = {
    outputMode: "patch_plan",
    files: [
      {
        path: "a.js",
        status: "new",
        hunks: "not-array"
      }
    ]
  };
  const plan2 = internal.validatePatchPlan(planPayload2);
  assert.deepEqual(plan2.files[0].hunks, []);
});

test("validatePromotedPaletteAction handles default id and missing workflowId", () => {
  const action = internal.validatePromotedPaletteAction({
    groupId: "g1",
    label: "lab"
  }, 0);
  assert.ok(action.id.includes("g1"));
  assert.equal(action.workflowId, "bridge_diagnostics");
});
