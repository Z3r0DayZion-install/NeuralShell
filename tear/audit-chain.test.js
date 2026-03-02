const fs = require("fs");
const os = require("os");
const path = require("path");
const assert = require("node:assert/strict");
const { AuditChain } = require("../src/core/auditChain");

function run() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ns5-audit-"));
  const file = path.join(tmpDir, "audit.jsonl");

  const chain = new AuditChain(file);
  chain.init();
  chain.append({ event: "one" });
  chain.append({ event: "two" });
  const verify1 = chain.verify();
  assert.equal(verify1.ok, true);
  assert.equal(chain.tail(5).length, 2);

  // Tamper one line to ensure verification catches it.
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/).filter(Boolean);
  const first = JSON.parse(lines[0]);
  first.payload.event = "hacked";
  lines[0] = JSON.stringify(first);
  fs.writeFileSync(file, `${lines.join("\n")}\n`, "utf8");

  const verify2 = chain.verify();
  assert.equal(verify2.ok, false);

  console.log("Audit chain test passed.");
}

run();
