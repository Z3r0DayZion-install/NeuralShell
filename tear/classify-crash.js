const fs = require("fs");
const path = require("path");

function classify(text) {
  const sample = String(text || "");
  if (/MODULE_NOT_FOUND/i.test(sample)) return "module-resolution";
  if (/EACCES|EPERM/i.test(sample)) return "permissions";
  if (/ENOENT/i.test(sample)) return "missing-file";
  if (/ECONNREFUSED|ETIMEDOUT|ENOTFOUND/i.test(sample)) return "network";
  return "unknown";
}

function main() {
  const inputArg = process.argv[2];
  const payload = {
    generatedAt: new Date().toISOString(),
    source: null,
    classification: "unknown",
    excerpt: ""
  };

  if (inputArg) {
    const filePath = path.resolve(process.cwd(), inputArg);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Crash input not found: ${filePath}`);
    }
    const text = fs.readFileSync(filePath, "utf8");
    payload.source = filePath;
    payload.classification = classify(text);
    payload.excerpt = text.slice(0, 500);
  }

  console.log(JSON.stringify(payload, null, 2));
}

main();
