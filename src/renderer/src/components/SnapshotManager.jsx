import React from "react";

export default function SnapshotManager({
    snapshots = [],
    onCapture,
    onRestore,
    onCompare,
    activeSnapshotId = "",
}) {
    const [nameDraft, setNameDraft] = React.useState("");
    const safeSnapshots = Array.isArray(snapshots) ? snapshots : [];

    return (
        <section data-testid="snapshot-manager" className="rounded-2xl border border-white/10 bg-black/30 p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
                <div>
                    <div className="text-[9px] uppercase tracking-[0.14em] text-cyan-300 font-bold">State Snapshots</div>
                    <div className="text-[10px] font-mono text-slate-500">Capture, restore, and compare runtime state safely.</div>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <input
                    data-testid="snapshot-name-input"
                    value={nameDraft}
                    onChange={(event) => setNameDraft(event.target.value)}
                    placeholder="Snapshot name"
                    className="flex-1 rounded border border-white/10 bg-black/40 px-2 py-1 text-[10px] font-mono text-slate-200"
                />
                <button
                    type="button"
                    data-testid="snapshot-capture-btn"
                    onClick={() => {
                        const name = String(nameDraft || "").trim() || `Snapshot ${new Date().toLocaleTimeString()}`;
                        onCapture(name);
                        setNameDraft("");
                    }}
                    className="px-2.5 py-1.5 rounded border border-cyan-300/30 bg-cyan-500/10 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-500/20"
                >
                    Capture
                </button>
            </div>
            <div className="max-h-[220px] overflow-auto space-y-1.5 pr-1">
                {safeSnapshots.map((snapshot) => (
                    <article
                        key={snapshot.id}
                        className={`rounded-lg border px-2 py-1.5 ${
                            String(snapshot.id || "") === String(activeSnapshotId || "")
                                ? "border-cyan-300/30 bg-cyan-500/10"
                                : "border-white/10 bg-black/20"
                        }`}
                    >
                        <div className="flex items-center justify-between gap-2">
                            <div>
                                <div className="text-[10px] font-mono text-slate-200">{String(snapshot.name || snapshot.id)}</div>
                                <div className="text-[9px] font-mono text-slate-500">{String(snapshot.createdAt || "")}</div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    data-testid={`snapshot-restore-${snapshot.id}`}
                                    onClick={() => onRestore(snapshot.id)}
                                    className="px-2 py-1 rounded border border-emerald-300/30 bg-emerald-500/10 text-[9px] font-mono uppercase tracking-[0.12em] text-emerald-100"
                                >
                                    Restore
                                </button>
                                <button
                                    type="button"
                                    data-testid={`snapshot-compare-${snapshot.id}`}
                                    onClick={() => onCompare(snapshot.id)}
                                    className="px-2 py-1 rounded border border-white/10 bg-white/5 text-[9px] font-mono uppercase tracking-[0.12em] text-slate-200"
                                >
                                    Compare
                                </button>
                            </div>
                        </div>
                    </article>
                ))}
                {safeSnapshots.length === 0 && (
                    <div className="text-[10px] font-mono text-slate-500">No snapshots captured yet.</div>
                )}
            </div>
        </section>
    );
}

