"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { CheckpointManager } = require("../src/core/checkpointManager");

test("CheckpointManager saves, lists, and loads", async () => {
  const dir = path.join(os.tmpdir(), `neuralshell_cp_${Date.now()}`);
  await fs.promises.mkdir(dir, { recursive: true });
  const cm = new CheckpointManager(dir);
  await cm.init();
  const name = await cm.save({ foo: "bar" }, "test");
  assert.equal(typeof name, "string");
  const list = await cm.list();
  assert.equal(list.length > 0, true);
  const latest = await cm.latest();
  assert.equal(typeof latest, "string");
  const loaded = await cm.load(name);
  assert.equal(loaded.state.foo, "bar");
});
