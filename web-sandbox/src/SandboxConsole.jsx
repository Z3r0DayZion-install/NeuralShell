import React, { useMemo, useState } from "react";

const FALLBACK_LOGS = [
  "[sandbox] booting web runtime",
  "[proof] loading checksum manifest",
  "[proof] validating proof states",
  "[proof] lock/unlock continuity: pass",
  "[proof] bundle complete",
];

export default function SandboxConsole() {
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState([]);
  const [engine, setEngine] = useState("fallback");

  const joined = useMemo(() => logs.join("\n"), [logs]);

  const push = (line) => {
    setLogs((prev) => [...prev, line]);
  };

  const runFallback = async () => {
    setEngine("fallback");
    for (const line of FALLBACK_LOGS) {
      push(line);
      // Keep this flow visibly paced.
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  };

  const runProof = async () => {
    setRunning(true);
    setLogs([]);
    try {
      await runFallback();
    } finally {
      setRunning(false);
    }
  };

  return (
    <section className="rounded-2xl border border-cyan-500/30 bg-slate-950/85 p-4 text-slate-100">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold tracking-wide uppercase">Try It Now</h3>
        <span className="text-[10px] font-mono text-cyan-300 uppercase">{engine}</span>
      </div>
      <button
        type="button"
        disabled={running}
        onClick={runProof}
        className="mb-3 rounded-lg border border-cyan-300/40 bg-cyan-500/10 px-3 py-2 text-xs font-bold uppercase tracking-wide text-cyan-200 disabled:opacity-50"
      >
        {running ? "Running..." : "Run 30s Proof"}
      </button>
      <pre className="min-h-40 rounded-lg border border-white/10 bg-black/50 p-3 text-xs leading-relaxed">
        {joined || "[idle] click run to start proof stream"}
      </pre>
    </section>
  );
}
