import React from "react";

function readObject(key) {
    try {
        const parsed = JSON.parse(window.localStorage.getItem(key) || "{}");
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
        return {};
    }
}

export default function EcosystemCommandCenter({ open, onClose, onOpenPanel }) {
    const [summary, setSummary] = React.useState({});

    const refresh = React.useCallback(() => {
        if (typeof window === "undefined" || !window.localStorage) return;
        const portfolio = readObject("neuralshell_ecosystem_portfolio_state_v1");
        const services = readObject("neuralshell_service_line_state_v1");
        const partnerNetwork = readObject("neuralshell_partner_network_state_v1");
        const globalPlanning = readObject("neuralshell_global_planning_state_v1");
        const revenue = readObject("neuralshell_ecosystem_revenue_state_v1");
        const boardPack = readObject("neuralshell_board_operating_pack_state_v1");
        const operator = readObject("neuralshell_licensed_operator_state_v1");

        setSummary({
            portfolioLines: Array.isArray(portfolio.lines) ? portfolio.lines.length : 0,
            serviceLines: Array.isArray(services.rows) ? services.rows.length : 0,
            partnerCount: Array.isArray(partnerNetwork.partners) ? partnerNetwork.partners.length : 0,
            globalRegions: Array.isArray(globalPlanning.rows) ? globalPlanning.rows.length : 0,
            revenueLines: Array.isArray(revenue.rows) ? revenue.rows.length : 0,
            boardSections: Array.isArray(boardPack.sections) ? boardPack.sections.length : 0,
            operatorChecklist: Array.isArray(operator.checklist) ? operator.checklist.filter((entry) => entry.complete).length : 0,
            criticalBlockers: 3,
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
        ["Portfolio lines", `${Number(summary.portfolioLines || 0)}`],
        ["Partner network", `${Number(summary.partnerCount || 0)}`],
        ["Service lines", `${Number(summary.serviceLines || 0)}`],
        ["Global regions", `${Number(summary.globalRegions || 0)}`],
        ["Revenue lines", `${Number(summary.revenueLines || 0)}`],
        ["Board pack sections", `${Number(summary.boardSections || 0)}`],
        ["Operator readiness", `${Number(summary.operatorChecklist || 0)}`],
        ["Critical blockers", `${Number(summary.criticalBlockers || 0)}`],
    ];

    const drilldowns = [
        ["ecosystem-portfolio", "Portfolio"],
        ["service-line", "Service Lines"],
        ["partner-network-governance", "Partner Network"],
        ["global-planning", "Global Planning"],
        ["ecosystem-revenue", "Revenue Mix"],
        ["board-operating-pack", "Board Pack"],
        ["licensed-operator", "Operator Framework"],
    ];

    return (
        <>
            <div className="fixed inset-0 z-[220] bg-black/60" onClick={onClose} />
            <section data-testid="ecosystem-command-center" className="fixed inset-x-6 top-14 bottom-4 z-[221] rounded-2xl border border-cyan-300/25 bg-slate-950 shadow-[0_20px_90px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-white/10 bg-black/30 flex items-center justify-between">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300 font-bold">Ecosystem Command Center</div>
                        <div className="text-[10px] font-mono text-slate-500">Top-level ecosystem posture with drill-down into Δ18 systems.</div>
                    </div>
                    <button type="button" data-testid="ecosystem-command-close-btn" onClick={onClose} className="h-8 w-8 rounded-full border border-white/10 text-slate-300 hover:bg-white/10">x</button>
                </div>
                <div className="flex-1 min-h-0 grid grid-cols-[1fr_1fr] gap-3 p-3 overflow-auto">
                    <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                        <div className="text-[9px] uppercase tracking-[0.14em] text-slate-300 font-bold">Ecosystem Summary</div>
                        <div className="grid grid-cols-2 gap-2" role="list" aria-label="Ecosystem command summary cards">
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
                                    data-testid={`ecosystem-command-open-${panelId}`}
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
