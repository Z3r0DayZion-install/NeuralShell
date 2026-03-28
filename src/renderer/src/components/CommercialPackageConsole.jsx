import React from "react";
import packagesCatalog from "../config/commercial_packages.json";

export default function CommercialPackageConsole({ open, onClose }) {
    if (!open) return null;

    const packages = Array.isArray(packagesCatalog && packagesCatalog.packages) ? packagesCatalog.packages : [];

    return (
        <>
            <div className="fixed inset-0 z-[172] bg-black/60" onClick={onClose} />
            <section data-testid="commercial-package-console" className="fixed inset-x-8 top-16 bottom-6 z-[173] rounded-2xl border border-cyan-300/25 bg-slate-950 shadow-[0_20px_90px_rgba(0,0,0,0.75)] overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-white/10 bg-black/30 flex items-center justify-between">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300 font-bold">Commercial Package Console</div>
                        <div className="text-[10px] font-mono text-slate-500">SKU, deployment, and support entitlement alignment view.</div>
                    </div>
                    <button type="button" data-testid="commercial-close-btn" onClick={onClose} className="h-8 w-8 rounded-full border border-white/10 text-slate-300 hover:bg-white/10">x</button>
                </div>

                <div className="flex-1 min-h-0 p-3 overflow-auto">
                    <div className="grid grid-cols-2 gap-2">
                        {packages.map((entry) => (
                            <article key={entry.skuId} className="rounded border border-white/10 bg-black/20 p-2 space-y-1">
                                <div className="text-[10px] font-mono text-slate-100">{entry.title}</div>
                                <div className="text-[9px] font-mono text-slate-400">tier {entry.tier}</div>
                                <div className="text-[9px] font-mono text-slate-400">deployment {(entry.deployment || []).join(", ")}</div>
                                <div className="text-[9px] font-mono text-slate-500">support {entry.supportPlan}</div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>
        </>
    );
}
