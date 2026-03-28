import React from "react";

function readObject(key) {
    try {
        const parsed = JSON.parse(window.localStorage.getItem(key) || "{}");
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
        return {};
    }
}

export default function ExecutiveScaleDashboard({ open, onClose, onOpenPanel }) {
    const [summary, setSummary] = React.useState({});

    const refresh = React.useCallback(() => {
        if (typeof window === "undefined" || !window.localStorage) return;
        const partnerCertification = readObject("neuralshell_partner_certification_registry_v1");
        const managedServices = readObject("neuralshell_managed_services_state_v1");
        const strategicAccount = readObject("neuralshell_strategic_account_state_v1");
        const portfolioRollout = readObject("neuralshell_portfolio_rollout_state_v1");
        const revenueOps = readObject("neuralshell_revenue_ops_state_v1");
        const channelExpansion = readObject("neuralshell_channel_expansion_state_v1");
        const crossAccountRenewal = readObject("neuralshell_cross_account_renewal_state_v1");

        const certRegistry = Array.isArray(partnerCertification.registry) ? partnerCertification.registry : [];
        const managedAccounts = Array.isArray(managedServices.accounts) ? managedServices.accounts : [];
        const strategicRisks = Array.isArray(strategicAccount.risks) ? strategicAccount.risks : [];
        const rolloutRows = Array.isArray(portfolioRollout.rows) ? portfolioRollout.rows : [];
        const revenueRows = Array.isArray(revenueOps.pipeline) ? revenueOps.pipeline : [];
        const channelRows = Array.isArray(channelExpansion.scorecards) ? channelExpansion.scorecards : [];
        const renewalRows = Array.isArray(crossAccountRenewal.rows) ? crossAccountRenewal.rows : [];

        setSummary({
            certifiedPartners: certRegistry.filter((entry) => String(entry.status || "") === "certified").length,
            managedAccounts: managedAccounts.length,
            strategicRiskAccounts: strategicRisks.length,
            rolloutBlocked: rolloutRows.reduce((acc, row) => acc + Number(row.blockerCount || 0), 0),
            revenueTotal: revenueRows.reduce((acc, row) => acc + Number(row.estimatedValueUsd || 0), 0),
            renewalPressure: renewalRows.filter((entry) => String(entry.riskBand || "") === "high").length,
            channelReady: channelRows.filter((entry) => String(entry.status || "") === "ready").length,
            fieldExecutionHealthTrend: "stable",
        });
    }, []);

    React.useEffect(() => {
        if (!open) return;
        refresh();
        const timer = window.setInterval(refresh, 5000);
        return () => window.clearInterval(timer);
    }, [open, refresh]);

    if (!open) return null;

    const cards = [
        ["Certified partners", `${Number(summary.certifiedPartners || 0)}`],
        ["Managed accounts", `${Number(summary.managedAccounts || 0)}`],
        ["Strategic risk accounts", `${Number(summary.strategicRiskAccounts || 0)}`],
        ["Rollout blockers", `${Number(summary.rolloutBlocked || 0)}`],
        ["Revenue pipeline", `$${Number(summary.revenueTotal || 0).toLocaleString()}`],
        ["Renewal pressure", `${Number(summary.renewalPressure || 0)}`],
        ["Channel-ready", `${Number(summary.channelReady || 0)}`],
        ["Field execution trend", String(summary.fieldExecutionHealthTrend || "unknown")],
    ];

    const drilldowns = [
        ["partner-certification", "Partner Cert"],
        ["managed-services", "Managed Services"],
        ["strategic-account", "Strategic Account"],
        ["portfolio-rollout", "Portfolio Rollout"],
        ["revenue-ops", "Revenue Ops"],
        ["channel-expansion", "Channel Expansion"],
        ["cross-account-renewal", "Renewal Matrix"],
    ];

    return (
        <>
            <div className="fixed inset-0 z-[204] bg-black/60" onClick={onClose} />
            <section data-testid="executive-scale-dashboard" className="fixed inset-x-6 top-14 bottom-4 z-[205] rounded-2xl border border-cyan-300/25 bg-slate-950 shadow-[0_20px_90px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-white/10 bg-black/30 flex items-center justify-between">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300 font-bold">Executive Scale Dashboard</div>
                        <div className="text-[10px] font-mono text-slate-500">One-screen scale-stage operations summary with drill-down paths.</div>
                    </div>
                    <button type="button" data-testid="executive-scale-close-btn" onClick={onClose} className="h-8 w-8 rounded-full border border-white/10 text-slate-300 hover:bg-white/10">x</button>
                </div>
                <div className="flex-1 min-h-0 grid grid-cols-[1fr_1fr] gap-3 p-3 overflow-auto">
                    <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                        <div className="text-[9px] uppercase tracking-[0.14em] text-slate-300 font-bold">Scale Summary</div>
                        <div className="grid grid-cols-2 gap-2" role="list" aria-label="Executive scale summary cards">
                            {cards.map(([label, value]) => (
                                <article key={label} className="rounded border border-white/10 bg-black/30 px-2 py-1.5" role="listitem">
                                    <div className="text-[9px] font-mono text-slate-500 uppercase tracking-[0.1em]">{label}</div>
                                    <div className="text-[10px] font-mono text-slate-100">{value}</div>
                                </article>
                            ))}
                        </div>
                    </section>
                    <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                        <div className="text-[9px] uppercase tracking-[0.14em] text-slate-300 font-bold">Drill-Down</div>
                        <div className="grid grid-cols-2 gap-2">
                            {drilldowns.map(([panelId, label]) => (
                                <button
                                    key={panelId}
                                    type="button"
                                    data-testid={`executive-scale-open-${panelId}`}
                                    onClick={() => {
                                        if (typeof onOpenPanel === "function") onOpenPanel(panelId);
                                    }}
                                    className="px-3 py-2 rounded border border-cyan-300/30 bg-cyan-500/10 text-[10px] font-mono uppercase tracking-[0.12em] text-cyan-100 hover:bg-cyan-500/20 text-left"
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </section>
                </div>
            </section>
        </>
    );
}
