import React from "react";
import trainingTracks from "../config/training_delivery_tracks.json";
import { downloadJson } from "../utils/recordIO.js";

const HISTORY_KEY = "neuralshell_training_bundle_history_v1";

function readHistory() {
    try {
        const parsed = JSON.parse(window.localStorage.getItem(HISTORY_KEY) || "[]");
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export default function TrainingDeliveryCenter({ open, onClose }) {
    const [history, setHistory] = React.useState(() => (typeof window === "undefined" ? [] : readHistory()));
    const [status, setStatus] = React.useState("");

    React.useEffect(() => {
        if (typeof window === "undefined" || !window.localStorage) return;
        window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    }, [history]);

    if (!open) return null;

    const tracks = Array.isArray(trainingTracks && trainingTracks.tracks) ? trainingTracks.tracks : [];

    return (
        <>
            <div className="fixed inset-0 z-[164] bg-black/60" onClick={onClose} />
            <section data-testid="training-delivery-center" className="fixed inset-x-8 top-16 bottom-6 z-[165] rounded-2xl border border-cyan-300/25 bg-slate-950 shadow-[0_20px_90px_rgba(0,0,0,0.75)] overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-white/10 bg-black/30 flex items-center justify-between">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300 font-bold">Training Delivery Center</div>
                        <div className="text-[10px] font-mono text-slate-500">Offline-capable role training tracks and scenario labs.</div>
                    </div>
                    <button type="button" data-testid="training-close-btn" onClick={onClose} className="h-8 w-8 rounded-full border border-white/10 text-slate-300 hover:bg-white/10">x</button>
                </div>

                <div className="flex-1 min-h-0 grid grid-cols-[1.1fr_0.9fr] gap-3 p-3 overflow-auto">
                    <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                        <div className="text-[9px] uppercase tracking-[0.14em] text-slate-300 font-bold">Role Tracks</div>
                        <div className="space-y-1.5 max-h-80 overflow-auto pr-1">
                            {tracks.map((track) => (
                                <article key={track.trackId} className="rounded border border-white/10 bg-black/30 px-2 py-1.5">
                                    <div className="text-[10px] font-mono text-slate-100">{track.title}</div>
                                    <div className="text-[9px] font-mono text-slate-400">Duration {Number(track.durationMinutes || 0)} minutes</div>
                                </article>
                            ))}
                        </div>
                        <button
                            type="button"
                            data-testid="training-generate-bundle-btn"
                            onClick={() => {
                                const generatedAt = new Date().toISOString();
                                const bundle = {
                                    generatedAt,
                                    offlineReady: true,
                                    tracks,
                                    labs: trainingTracks.labs || [],
                                };
                                downloadJson("training_delivery_bundle.json", bundle);
                                const next = [{ generatedAt, trackCount: tracks.length }, ...history].slice(0, 80);
                                setHistory(next);
                                setStatus("Generated offline training bundle.");
                            }}
                            className="w-full px-3 py-1.5 rounded border border-emerald-300/30 bg-emerald-500/10 text-[10px] font-mono uppercase tracking-[0.12em] text-emerald-100"
                        >
                            Generate Offline Bundle
                        </button>
                    </section>

                    <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                        <div className="text-[9px] uppercase tracking-[0.14em] text-slate-300 font-bold">Generation History</div>
                        <div className="space-y-1.5 max-h-80 overflow-auto pr-1">
                            {history.map((entry, index) => (
                                <article key={`${entry.generatedAt}-${index}`} className="rounded border border-cyan-300/25 bg-cyan-500/10 px-2 py-1.5">
                                    <div className="text-[10px] font-mono text-cyan-100">{new Date(entry.generatedAt).toLocaleString()}</div>
                                    <div className="text-[9px] font-mono text-slate-300">tracks {entry.trackCount}</div>
                                </article>
                            ))}
                            {!history.length && <div className="text-[10px] font-mono text-slate-500">No bundles generated yet.</div>}
                        </div>
                    </section>
                </div>

                {status && <div className="px-3 py-2 border-t border-white/10 text-[10px] font-mono text-emerald-100 bg-emerald-500/10">{status}</div>}
            </section>
        </>
    );
}
