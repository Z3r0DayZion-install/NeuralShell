"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const { createPathGuard } = require("../src/core/pathGuard");

test("PathGuard allows only configured roots", () => {
  const root = path.resolve("C:/tmp/root");
  const guard = createPathGuard([root]);

  assert.equal(guard.isAllowed(path.join(root, "a.txt")), true);
  assert.equal(guard.isAllowed(path.resolve("C:/tmp/other/b.txt")), false);
  assert.throws(() => guard.assertAllowed(path.resolve("C:/tmp/other/b.txt")));
});
