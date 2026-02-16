"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { PermissionManager } = require("../src/core/permissionManager");

test("PermissionManager persists and audits toggles", async () => {
  const dir = path.join(os.tmpdir(), `neuralshell_perm_${Date.now()}`);
  await fs.promises.mkdir(dir, { recursive: true });
  const pm = new PermissionManager(dir);
  await pm.init();
  assert.equal(pm.allowed("autoMode"), true);
  await pm.set("autoMode", false, "test");
  assert.equal(pm.allowed("autoMode"), false);
  const audit = await pm.auditTail(10);
  assert.equal(audit.length > 0, true);
});
