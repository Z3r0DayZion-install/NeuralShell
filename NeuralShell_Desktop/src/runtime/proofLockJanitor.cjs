const fs = require("fs");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isPidAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const parentPid = Number(process.argv[2]);
  const lockPath = String(process.argv[3] || "");

  if (!Number.isFinite(parentPid) || parentPid <= 0) process.exit(2);
  if (!lockPath) process.exit(2);

  const deadlineAt = Date.now() + 60000;
  while (Date.now() < deadlineAt) {
    if (!isPidAlive(parentPid)) break;
    await sleep(250);
  }

  try {
    fs.unlinkSync(lockPath);
  } catch {
    // ignore
  }
}

main()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));

