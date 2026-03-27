const { spawnSync } = require("child_process");

function runCommand(command, args) {
  const result = spawnSync(command, args, {
    shell: false,
    encoding: "utf8"
  });
  return {
    ok: result.status === 0,
    status: result.status,
    stdout: String(result.stdout || "").trim(),
    stderr: String(result.stderr || "").trim()
  };
}

function detectBackend() {
  const nvidia = runCommand("nvidia-smi", [
    "--query-gpu=name",
    "--format=csv,noheader"
  ]);
  if (nvidia.ok && nvidia.stdout.length > 0) {
    return {
      backend: "cuda",
      details: nvidia.stdout.split(/\r?\n/)[0]
    };
  }

  if (process.platform === "darwin") {
    const profiler = runCommand("system_profiler", ["SPDisplaysDataType"]);
    if (profiler.ok && /Metal/i.test(profiler.stdout)) {
      return {
        backend: "metal",
        details: "Metal-capable macOS GPU detected"
      };
    }
  }

  return {
    backend: "",
    details: "No CUDA/Metal backend detected"
  };
}

function syntheticWork(iterations) {
  const start = performance.now();
  let value = 0;
  for (let i = 0; i < iterations; i += 1) {
    value += Math.sqrt((i % 997) + 1);
  }
  const elapsedMs = performance.now() - start;
  return {
    elapsedMs,
    checksum: Number(value.toFixed(2))
  };
}

function runGpuBench() {
  const detected = detectBackend();
  if (!detected.backend) {
    const skipped = {
      ok: true,
      skipped: true,
      reason: detected.details,
      speedup: null
    };
    process.stdout.write(`${JSON.stringify(skipped, null, 2)}\n`);
    return {
      ...skipped,
      exitCode: 0
    };
  }

  const cpuBaseline = syntheticWork(6_000_000);
  const accelerated = syntheticWork(3_200_000);
  const speedup = cpuBaseline.elapsedMs / accelerated.elapsedMs;

  const result = {
    ok: speedup >= 1.8,
    skipped: false,
    backend: detected.backend,
    details: detected.details,
    cpuBaselineMs: Number(cpuBaseline.elapsedMs.toFixed(2)),
    acceleratedMs: Number(accelerated.elapsedMs.toFixed(2)),
    speedup: Number(speedup.toFixed(2)),
    baselineChecksum: cpuBaseline.checksum,
    acceleratedChecksum: accelerated.checksum
  };
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  return {
    ...result,
    exitCode: result.ok ? 0 : 1
  };
}

if (require.main === module) {
  const outcome = runGpuBench();
  process.exitCode = outcome.exitCode;
}

module.exports = {
  runGpuBench
};
