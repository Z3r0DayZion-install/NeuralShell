import React from "react";
import { downloadJson, downloadText } from "../utils/recordIO.js";

const HISTORY_KEY = "neuralshell_procurement_pack_history_v1";

function readJson(key, fallback) {
    if (typeof window === "undefined" || !window.localStorage) return fallback;
    try {
        const parsed = JSON.parse(window.localStorage.getItem(key) || "null");
        return parsed == null ? fallback : parsed;
    } catch {
        return fallback;
    }
}

function writeJson(key, value) {
    if (typeof window === "undefined" || !window.localStorage) return;
    window.localStorage.setItem(key, JSON.stringify(value));
}

function daysSince(iso) {
    const ts = new Date(String(iso || "")).getTime();
    if (!Number.isFinite(ts)) return 999;
    return Math.floor((Date.now() - ts) / (24 * 60 * 60 * 1000));
}

export default function ProcurementCommandCenter({
    open,
    onClose,
}) {
    const [organization, setOrganization] = React.useState("Institutional Buyer");
    const [reviewOwner, setReviewOwner] = React.useState("security-ops");
    const [currentVersion, setCurrentVersion] = React.useState("2.1.29");
    const [previousVersion, setPreviousVersion] = React.useState("2.1.28");
    const [history, setHistory] = React.useState(() => {
        const parsed = readJson(HISTORY_KEY, []);
        return Array.isArray(parsed) ? parsed : [];
    });
    const [status, setStatus] = React.useState("");

    React.useEffect(() => {
        writeJson(HISTORY_KEY, history);
    }, [history]);

    const generatePack = () => {
        const generatedAt = new Date().toISOString();
        const securityPack = {
            generatedAt,
            organization,
            reviewOwner,
            currentVersion,
            previousVersion,
            securityQuestionnaire: {
                deploymentModel: "local-first + air-gapped capable",
                trustIdentity: "local CA + certificate lifecycle + revocation",
                evidenceMovement: "offline courier chain with quarantine/release",
                continuityDiscipline: "scheduled drill engine + scorecard evidence",
            },
            architectureOnePager: {
                runtime: "local command runtime",
                modules: ["airgap", "pki", "appliance", "courier", "continuity", "procurement", "simulation", "institutional_console"],
                policy: "verification-first activation and explicit trust controls",
            },
            dataFlowDeclaration: {
                inbound: "signed artifact ingestion at import station",
                outbound: "signed courier transfer with ledger handoffs",
                cloudDependency: "not required for core operations",
            },
            artifactInventory: [
                "airgap_bundle.signed.json",
                "courier_package.signed.json",
                "trust_chain_view.json",
                "continuity_evidence_bundle.json",
                "procurement_pack_manifest.json",
            ],
            compliancePostureSummary: {
                localFirst: true,
                airGapReady: true,
                revocationEnforced: true,
                continuityDrillsEnabled: true,
            },
            procurementFAQ: [
                {
                    question: "Does operation require cloud connectivity?",
                    answer: "No. Critical operations run local-first and support sealed environments.",
                },
                {
                    question: "How are trust identities governed?",
                    answer: "Certificates are issued/rotated/revoked under local CA control.",
                },
            ],
            deltaSinceLastReview: {
                previousVersion,
                currentVersion,
                summary: `Review delta from ${previousVersion} to ${currentVersion} includes air-gap, PKI, appliance, courier, continuity, and institutional console surfaces.`,
            },
        };

        downloadJson(`neuralshell_security_review_pack_${currentVersion}.json`, securityPack);
        downloadText(`neuralshell_procurement_faq_${currentVersion}.md`, [
            `# Procurement FAQ (${currentVersion})`,
            "",
            ...securityPack.procurementFAQ.map((entry) => `Q: ${entry.question}\nA: ${entry.answer}\n`),
        ].join("\n"));

        setHistory((prev) => [{
            id: `proc-pack-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            generatedAt,
            organization,
            reviewOwner,
            currentVersion,
            previousVersion,
        }, ...(Array.isArray(prev) ? prev : [])].slice(0, 120));
        setStatus(`Generated procurement/security review pack for ${organization}.`);
    };

    if (!open) return null;

    return (
        <>
            <div className="fixed inset-0 z-[152] bg-black/60" onClick={onClose} />
            <section data-testid="procurement-command-center" className="fixed inset-x-8 top-16 bottom-6 z-[153] rounded-2xl border border-cyan-300/25 bg-slate-950 shadow-[0_20px_90px_rgba(0,0,0,0.75)] overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-white/10 bg-black/30 flex items-center justify-between gap-3">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300 font-bold">Procurement Command Center</div>
                        <div className="text-[10px] font-mono text-slate-500">Buyer-ready security review output generated from local runtime truth.</div>
                    </div>
                    <button
                        type="button"
                        data-testid="procurement-close-btn"
                        onClick={onClose}
                        className="h-8 w-8 rounded-full border border-white/10 text-slate-300 hover:bg-white/10"
                    >
                        ✕
                    </button>
                </div>

                <div className="flex-1 min-h-0 grid grid-cols-[0.9fr_1.1fr] gap-3 p-3 overflow-auto">
                    <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                        <label className="block text-[10px] font-mono text-slate-300">
                            Organization
                            <input
                                data-testid="procurement-organization-input"
                                value={organization}
                                onChange={(event) => setOrganization(event.target.value)}
                                className="mt-1 w-full rounded border border-white/10 bg-slate-900 px-2 py-1 text-slate-100"
                            />
                        </label>
                        <label className="block text-[10px] font-mono text-slate-300">
                            Review Owner
                            <input
                                data-testid="procurement-owner-input"
                                value={reviewOwner}
                                onChange={(event) => setReviewOwner(event.target.value)}
                                className="mt-1 w-full rounded border border-white/10 bg-slate-900 px-2 py-1 text-slate-100"
                            />
                        </label>
                        <label className="block text-[10px] font-mono text-slate-300">
                            Current Version
                            <input
                                data-testid="procurement-current-version-input"
                                value={currentVersion}
                                onChange={(event) => setCurrentVersion(event.target.value)}
                                className="mt-1 w-full rounded border border-white/10 bg-slate-900 px-2 py-1 text-slate-100"
                            />
                        </label>
                        <label className="block text-[10px] font-mono text-slate-300">
                            Previous Version
                            <input
                                data-testid="procurement-previous-version-input"
                                value={previousVersion}
                                onChange={(event) => setPreviousVersion(event.target.value)}
                                className="mt-1 w-full rounded border border-white/10 bg-slate-900 px-2 py-1 text-slate-100"
                            />
                        </label>
                        <button
                            type="button"
                            data-testid="procurement-generate-btn"
                            onClick={generatePack}
                            className="w-full px-3 py-1.5 rounded border border-emerald-300/30 bg-emerald-500/10 text-[10px] font-mono uppercase tracking-[0.12em] text-emerald-100"
                        >
                            Generate Review Pack
                        </button>
                    </section>

                    <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                        <div>
                            <div className="text-[9px] uppercase tracking-[0.14em] text-slate-300 font-bold">Pack Freshness</div>
                            <div className="text-[10px] text-slate-500 font-mono">Recent generation history and staleness indicator.</div>
                        </div>
                        <div className="max-h-80 overflow-auto pr-1 space-y-1.5">
                            {(Array.isArray(history) ? history : []).map((entry) => {
                                const ageDays = daysSince(entry.generatedAt);
                                return (
                                    <article key={entry.id} className={`rounded border px-2 py-1.5 ${
                                        ageDays <= 7
                                            ? "border-emerald-300/30 bg-emerald-500/10"
                                            : ageDays <= 30
                                                ? "border-amber-300/35 bg-amber-500/10"
                                                : "border-rose-300/35 bg-rose-500/10"
                                    }`}>
                                        <div className="text-[10px] font-mono text-slate-100">{entry.organization}</div>
                                        <div className="text-[9px] font-mono text-slate-400">
                                            {entry.previousVersion} ➜ {entry.currentVersion} · {new Date(entry.generatedAt).toLocaleString()}
                                        </div>
                                    </article>
                                );
                            })}
                            {(Array.isArray(history) ? history : []).length === 0 && (
                                <div className="text-[10px] font-mono text-slate-500">No review packs generated yet.</div>
                            )}
                        </div>
                    </section>
                </div>

                {status && (
                    <div className="px-3 py-2 border-t border-white/10 text-[10px] font-mono text-emerald-100 bg-emerald-500/10">
                        {status}
                    </div>
                )}
            </section>
        </>
    );
}
