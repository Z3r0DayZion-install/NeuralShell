import React from "react";

function renderJson(data) {
    return JSON.stringify(data || {}, null, 2);
}

export default function ResultPaneRouter({
    paneId,
    payload,
}) {
    const id = String(paneId || "runtime_snapshots");
    if (id === "proof_stdout") {
        return (
            <section data-testid="result-pane-proof" className="rounded-2xl border border-white/10 bg-black/30 p-3">
                <div className="text-[9px] uppercase tracking-[0.14em] text-cyan-300 font-bold mb-2">Proof Stdout</div>
                <pre className="text-[10px] font-mono text-slate-200 whitespace-pre-wrap">{String(payload && payload.text ? payload.text : "No proof output yet.")}</pre>
            </section>
        );
    }
    if (id === "watchdog_alerts") {
        return (
            <section data-testid="result-pane-watchdog" className="rounded-2xl border border-white/10 bg-black/30 p-3">
                <div className="text-[9px] uppercase tracking-[0.14em] text-amber-300 font-bold mb-2">Watchdog Alerts</div>
                <pre className="text-[10px] font-mono text-slate-200 whitespace-pre-wrap">{renderJson(payload)}</pre>
            </section>
        );
    }
    if (id === "release_health") {
        return (
            <section data-testid="result-pane-release-health" className="rounded-2xl border border-white/10 bg-black/30 p-3">
                <div className="text-[9px] uppercase tracking-[0.14em] text-cyan-300 font-bold mb-2">Release Health</div>
                <pre className="text-[10px] font-mono text-slate-200 whitespace-pre-wrap">{renderJson(payload)}</pre>
            </section>
        );
    }
    if (id === "snapshot_compare") {
        return (
            <section data-testid="result-pane-snapshot-compare" className="rounded-2xl border border-white/10 bg-black/30 p-3">
                <div className="text-[9px] uppercase tracking-[0.14em] text-blue-300 font-bold mb-2">Snapshot Compare</div>
                <pre className="text-[10px] font-mono text-slate-200 whitespace-pre-wrap">{renderJson(payload)}</pre>
            </section>
        );
    }
    return (
        <section data-testid="result-pane-default" className="rounded-2xl border border-white/10 bg-black/30 p-3">
            <div className="text-[9px] uppercase tracking-[0.14em] text-cyan-300 font-bold mb-2">Runtime Snapshots</div>
            <pre className="text-[10px] font-mono text-slate-200 whitespace-pre-wrap">{renderJson(payload)}</pre>
        </section>
    );
}

