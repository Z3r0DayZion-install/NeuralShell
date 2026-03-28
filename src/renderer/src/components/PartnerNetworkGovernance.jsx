import React from "react";
import { downloadJson } from "../utils/recordIO.js";

const STORAGE_KEY = "neuralshell_partner_network_state_v1";

function readState() {
    try {
        const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
        return {};
    }
}

export default function PartnerNetworkGovernance({ open, onClose }) {
    const initial = typeof window === "undefined" ? {} : readState();
    const [partners, setPartners] = React.useState(() => (
        Array.isArray(initial.partners) && initial.partners.length
            ? initial.partners
            : [
                { partnerId: "pn-001", partnerName: "NorthGrid Alliance", tier: "certified", compliance: "good" },
                { partnerId: "pn-002", partnerName: "Metro Integrators", tier: "strategic", compliance: "attention" },
                { partnerId: "pn-003", partnerName: "Regional Ops MSP", tier: "registered", compliance: "good" },
            ]
    ));
    const [status, setStatus] = React.useState("");

    React.useEffect(() => {
        if (typeof window === "undefined" || !window.localStorage) return;
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ partners }));
    }, [partners]);

    if (!open) return null;

    return (
        <>
            <div className="fixed inset-0 z-[210] bg-black/60" onClick={onClose} />
            <section data-testid="partner-network-governance" className="fixed inset-x-6 top-14 bottom-4 z-[211] rounded-2xl border border-cyan-300/25 bg-slate-950 shadow-[0_20px_90px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-white/10 bg-black/30 flex items-center justify-between">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300 font-bold">Partner Network Governance</div>
                        <div className="text-[10px] font-mono text-slate-500">Tier governance, compliance state, and escalation flow control.</div>
                    </div>
                    <button type="button" data-testid="partner-network-close-btn" onClick={onClose} className="h-8 w-8 rounded-full border border-white/10 text-slate-300 hover:bg-white/10">x</button>
                </div>
                <div className="flex-1 min-h-0 p-3 overflow-auto grid grid-cols-[1fr_1fr] gap-3">
                    <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                        <div className="space-y-1.5" role="list" aria-label="Partner network map">
                            {partners.map((entry) => (
                                <article key={entry.partnerId} className="rounded border border-white/10 bg-black/30 px-2 py-1.5" role="listitem">
                                    <div className="text-[10px] font-mono text-slate-100">{entry.partnerName}</div>
                                    <div className="text-[9px] font-mono text-slate-400">tier {entry.tier}</div>
                                    <div className="text-[9px] font-mono text-slate-500">compliance {entry.compliance}</div>
                                </article>
                            ))}
                        </div>
                        <button
                            type="button"
                            data-testid="partner-network-suspend-btn"
                            onClick={() => {
                                setPartners((prev) => prev.map((entry, index) => (
                                    index !== 0 ? entry : { ...entry, tier: "suspended", compliance: "attention" }
                                )));
                            }}
                            className="w-full px-3 py-1.5 rounded border border-rose-300/30 bg-rose-500/10 text-[10px] font-mono uppercase tracking-[0.12em] text-rose-100"
                        >
                            Suspend Lead Partner
                        </button>
                    </section>
                    <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                        <div className="rounded border border-rose-300/25 bg-rose-500/10 px-2 py-1 text-[10px] font-mono text-rose-100">
                            suspended partners {partners.filter((entry) => entry.tier === "suspended").length}
                        </div>
                        <button
                            type="button"
                            data-testid="partner-network-export-btn"
                            onClick={() => {
                                const payload = {
                                    generatedAt: new Date().toISOString(),
                                    partners,
                                    flowsLogged: true,
                                };
                                downloadJson("partner_network_governance_report.json", payload);
                                setStatus("Exported partner network governance report.");
                            }}
                            className="w-full px-3 py-1.5 rounded border border-emerald-300/30 bg-emerald-500/10 text-[10px] font-mono uppercase tracking-[0.12em] text-emerald-100"
                        >
                            Export Governance Report
                        </button>
                    </section>
                </div>
                {status && <div className="px-3 py-2 border-t border-white/10 text-[10px] font-mono text-emerald-100 bg-emerald-500/10">{status}</div>}
            </section>
        </>
    );
}
