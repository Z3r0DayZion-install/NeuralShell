import React from "react";
import PartnerEnablementTracker from "./PartnerEnablementTracker.jsx";
import { downloadJson } from "../utils/recordIO.js";

const STORAGE_KEY = "neuralshell_partner_certification_registry_v1";

function readState() {
    try {
        const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
        return {};
    }
}

function clamp(value) {
    return Math.min(Math.max(Number(value || 0), 0), 100);
}

export default function PartnerCertificationHub({ open, onClose }) {
    const initial = typeof window === "undefined" ? {} : readState();
    const [partnerName, setPartnerName] = React.useState(String(initial.partnerName || "Institutional Partner Network"));
    const [registry, setRegistry] = React.useState(() => (
        Array.isArray(initial.registry) && initial.registry.length
            ? initial.registry
            : [
                { partnerId: "partner-cert-1", role: "sales", track: "Partner Co-Sell Specialist", completion: 84, status: "in_progress", expiresAt: new Date(Date.now() + 32 * 86400000).toISOString() },
                { partnerId: "partner-cert-2", role: "support", track: "Partner Support Operator", completion: 91, status: "certified", expiresAt: new Date(Date.now() + 58 * 86400000).toISOString() },
                { partnerId: "partner-cert-3", role: "operator", track: "Partner Deployment Operator", completion: 77, status: "in_progress", expiresAt: new Date(Date.now() + 18 * 86400000).toISOString() },
            ]
    ));
    const [status, setStatus] = React.useState("");

    React.useEffect(() => {
        if (typeof window === "undefined" || !window.localStorage) return;
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ partnerName, registry }));
    }, [partnerName, registry]);

    if (!open) return null;

    const coSellReadiness = Number((registry.reduce((acc, row) => acc + clamp(row.completion), 0) / Math.max(registry.length, 1)).toFixed(2));
    const expiringSoon = registry.filter((row) => {
        const days = Math.floor((new Date(String(row.expiresAt || "")).getTime() - Date.now()) / 86400000);
        return Number.isFinite(days) && days <= 30;
    });

    return (
        <>
            <div className="fixed inset-0 z-[190] bg-black/60" onClick={onClose} />
            <section data-testid="partner-certification-hub" className="fixed inset-x-6 top-14 bottom-4 z-[191] rounded-2xl border border-cyan-300/25 bg-slate-950 shadow-[0_20px_90px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-white/10 bg-black/30 flex items-center justify-between">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300 font-bold">Partner Certification & Enablement Hub</div>
                        <div className="text-[10px] font-mono text-slate-500">Certification paths, co-sell readiness, and recertification control.</div>
                    </div>
                    <button type="button" data-testid="partner-certification-close-btn" onClick={onClose} className="h-8 w-8 rounded-full border border-white/10 text-slate-300 hover:bg-white/10">x</button>
                </div>

                <div className="flex-1 min-h-0 p-3 overflow-auto grid grid-cols-[1fr_1fr] gap-3">
                    <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                        <label className="block text-[10px] font-mono text-slate-300">
                            Partner Registry Name
                            <input
                                data-testid="partner-certification-partner-input"
                                value={partnerName}
                                onChange={(event) => setPartnerName(event.target.value)}
                                className="mt-1 w-full rounded border border-white/10 bg-slate-900 px-2 py-1 text-slate-100"
                            />
                        </label>
                        <div className="grid grid-cols-1 gap-2" role="list" aria-label="Partner certification tracks">
                            {registry.map((track) => <PartnerEnablementTracker key={track.partnerId} track={track} />)}
                        </div>
                        <button
                            type="button"
                            data-testid="partner-certification-track-progress-btn"
                            onClick={() => {
                                setRegistry((prev) => prev.map((row, index) => {
                                    if (index !== 0) return row;
                                    const completion = clamp(Number(row.completion || 0) + 5);
                                    return {
                                        ...row,
                                        completion,
                                        status: completion >= 85 ? "certified" : "in_progress",
                                    };
                                }));
                            }}
                            className="w-full px-3 py-1.5 rounded border border-amber-300/30 bg-amber-500/10 text-[10px] font-mono uppercase tracking-[0.12em] text-amber-100"
                        >
                            Increment Lead Track Progress
                        </button>
                    </section>

                    <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                        <div className="rounded border border-cyan-300/30 bg-cyan-500/10 px-2 py-1.5 text-[10px] font-mono text-cyan-100">
                            co-sell readiness {coSellReadiness}
                        </div>
                        <div className="rounded border border-amber-300/25 bg-amber-500/10 px-2 py-1.5 text-[10px] font-mono text-amber-100">
                            expiring within 30d {expiringSoon.length}
                        </div>
                        <div className="space-y-1 max-h-56 overflow-auto pr-1">
                            {expiringSoon.map((entry) => (
                                <div key={entry.partnerId} className="rounded border border-amber-300/25 bg-black/30 px-2 py-1 text-[9px] font-mono text-amber-100">
                                    {entry.track} expires {new Date(entry.expiresAt).toISOString().slice(0, 10)}
                                </div>
                            ))}
                            {!expiringSoon.length && <div className="text-[10px] font-mono text-slate-500">No near-term expiry warnings.</div>}
                        </div>
                        <button
                            type="button"
                            data-testid="partner-certification-export-btn"
                            onClick={() => {
                                const payload = {
                                    generatedAt: new Date().toISOString(),
                                    partnerName,
                                    coSellReadiness,
                                    registry,
                                    expiringSoon,
                                };
                                downloadJson("partner_enablement_pack.json", payload);
                                setStatus(`Exported partner enablement pack for ${partnerName}.`);
                            }}
                            className="w-full px-3 py-1.5 rounded border border-emerald-300/30 bg-emerald-500/10 text-[10px] font-mono uppercase tracking-[0.12em] text-emerald-100"
                        >
                            Export Enablement Pack
                        </button>
                    </section>
                </div>

                {status && <div className="px-3 py-2 border-t border-white/10 text-[10px] font-mono text-emerald-100 bg-emerald-500/10">{status}</div>}
            </section>
        </>
    );
}
