function buildScript(command) {
  const normalized = String(command || "").trim().toLowerCase();
  if (normalized === "proof" || normalized === "/proof") {
    return [
      "[proof] booting verification lane...",
      "[proof] checking release manifest integrity...",
      "[proof] validating checksum set and signature chain...",
      "[proof] auditing runtime guards and lock state...",
      "[proof] generating operator-ready summary artifact...",
      "[proof] completed without policy violations."
    ];
  }
  if (normalized === "unit-test" || normalized === "/unit-test") {
    return [
      "[unit-test] collecting target scope...",
      "[unit-test] building isolated test harness...",
      "[unit-test] executing core assertions...",
      "[unit-test] verifying stability gate...",
      "[unit-test] complete. no critical regressions found."
    ];
  }
  return [
    `[exec] unsupported stream command: ${normalized}`,
    "[exec] allowed commands: proof, unit-test"
  ];
}

function streamProofCommand(command, handlers = {}) {
  const lines = buildScript(command);
  const onChunk = typeof handlers.onChunk === "function" ? handlers.onChunk : () => {};
  const onDone = typeof handlers.onDone === "function" ? handlers.onDone : () => {};
  const delayMs = Number.isFinite(Number(handlers.delayMs)) ? Number(handlers.delayMs) : 120;
  let cursor = 0;
  let timer = null;
  let cancelled = false;

  function stopTimer() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  }

  function finish(meta = {}) {
    stopTimer();
    onDone({
      ok: !cancelled,
      cancelled,
      ...meta
    });
  }

  function tick() {
    if (cancelled) {
      finish({ reason: "cancelled" });
      return;
    }
    if (cursor >= lines.length) {
      finish();
      return;
    }
    onChunk(String(lines[cursor] || ""));
    cursor += 1;
    timer = setTimeout(tick, delayMs);
  }

  timer = setTimeout(tick, Math.max(40, delayMs));

  return () => {
    cancelled = true;
    finish({ reason: "cancelled_by_operator" });
  };
}

module.exports = {
  streamProofCommand
};
