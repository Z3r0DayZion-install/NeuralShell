import React from "react";

function tone(status) {
    const safe = String(status || "").toLowerCase();
    if (safe === "released") return "border-emerald-300/30 bg-emerald-500/10";
    if (safe === "verified") return "border-cyan-300/30 bg-cyan-500/10";
    if (safe === "quarantined") return "border-amber-300/35 bg-amber-500/10";
    return "border-white/10 bg-black/20";
}

export default function TransferLedgerView({
    entries,
    onVerifyReceipt,
    onReleaseFromQuarantine,
}) {
    const safeEntries = Array.isArray(entries) ? entries : [];
    return (
        <section data-testid="transfer-ledger-view" className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
            <div>
                <div className="text-[9px] uppercase tracking-[0.14em] text-slate-300 font-bold">Transfer Ledger</div>
                <div className="text-[10px] text-slate-500 font-mono">Each handoff is recorded with quarantine, verification, and release transitions.</div>
            </div>
            <div className="max-h-[350px] overflow-auto pr-1 space-y-1.5">
                {safeEntries.map((entry) => (
                    <article key={entry.entryId} className={`rounded border px-2 py-1.5 ${tone(entry.status)}`}>
                        <div className="flex items-center justify-between gap-2">
                            <div className="text-[10px] font-mono text-slate-100">{entry.packageId}</div>
                            <div className="text-[9px] font-mono text-slate-400">{entry.courierClass}</div>
                        </div>
                        <div className="text-[9px] font-mono text-slate-400">
                            {entry.sender} ➜ {entry.receiver} · {entry.status}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <button
                                type="button"
                                data-testid={`courier-verify-${entry.entryId}`}
                                onClick={() => {
                                    if (typeof onVerifyReceipt === "function") onVerifyReceipt(entry.entryId);
                                }}
                                className="px-2 py-1 rounded border border-cyan-300/30 bg-cyan-500/10 text-[9px] font-mono text-cyan-100"
                            >
                                verify receipt
                            </button>
                            <button
                                type="button"
                                data-testid={`courier-release-${entry.entryId}`}
                                onClick={() => {
                                    if (typeof onReleaseFromQuarantine === "function") onReleaseFromQuarantine(entry.entryId);
                                }}
                                className="px-2 py-1 rounded border border-emerald-300/30 bg-emerald-500/10 text-[9px] font-mono text-emerald-100"
                            >
                                release
                            </button>
                        </div>
                    </article>
                ))}
                {safeEntries.length === 0 && (
                    <div className="text-[10px] font-mono text-slate-500">No transfer ledger entries yet.</div>
                )}
            </div>
        </section>
    );
}
