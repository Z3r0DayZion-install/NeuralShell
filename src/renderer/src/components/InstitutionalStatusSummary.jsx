import React from "react";

function tone(status) {
    const safe = String(status || "").toLowerCase();
    if (safe === "healthy" || safe === "locked" || safe === "verified") return "border-emerald-300/30 bg-emerald-500/10 text-emerald-100";
    if (safe === "warning" || safe === "expiring" || safe === "degraded" || safe === "pending") return "border-amber-300/35 bg-amber-500/10 text-amber-100";
    if (safe === "critical" || safe === "revoked" || safe === "failed") return "border-rose-300/35 bg-rose-500/10 text-rose-100";
    return "border-cyan-300/30 bg-cyan-500/10 text-cyan-100";
}

export default function InstitutionalStatusSummary({
    summary,
}) {
    const safe = summary && typeof summary === "object" ? summary : {};
    const airGapPosture = String(safe.airGapPosture || "unlocked");
    const trustHealth = safe.trustHealth && typeof safe.trustHealth === "object" ? safe.trustHealth : { certificates: 0, revoked: 0 };
    const courierChain = safe.courierChain && typeof safe.courierChain === "object" ? safe.courierChain : { quarantined: 0, released: 0 };
    const continuityReadiness = Number(safe.continuityReadiness || 0);
    const releaseTruthStatus = String(safe.releaseTruthStatus || "unknown");

    return (
        <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
            <div>
                <div className="text-[9px] uppercase tracking-[0.14em] text-slate-300 font-bold">Institutional Status Summary</div>
                <div className="text-[10px] text-slate-500 font-mono">Executive snapshot across trust, transfer, continuity, and release posture.</div>
            </div>
            <div className="grid grid-cols-4 gap-2 text-[9px] font-mono">
                <div className={`rounded border px-2 py-1 ${tone(airGapPosture)}`}>airgap {airGapPosture}</div>
                <div className={`rounded border px-2 py-1 ${tone(trustHealth.revoked > 0 ? "warning" : "healthy")}`}>
                    trust {trustHealth.certificates} / revoked {trustHealth.revoked}
                </div>
                <div className={`rounded border px-2 py-1 ${tone(courierChain.quarantined > 0 ? "pending" : "verified")}`}>
                    courier q={courierChain.quarantined} r={courierChain.released}
                </div>
                <div className={`rounded border px-2 py-1 ${tone(continuityReadiness >= 80 ? "healthy" : continuityReadiness >= 50 ? "warning" : "critical")}`}>
                    continuity {continuityReadiness}
                </div>
            </div>
            <div className={`rounded border px-2 py-1 text-[9px] font-mono ${tone(releaseTruthStatus)}`}>
                release truth: {releaseTruthStatus}
            </div>
        </section>
    );
}
