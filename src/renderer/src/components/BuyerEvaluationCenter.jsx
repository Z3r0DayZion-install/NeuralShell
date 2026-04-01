import React from "react";

export default function BuyerEvaluationCenter({ open, onClose }) {
    if (!open) return null;

    return (
        <>
            <div className="fixed inset-0 z-[168] bg-black/60" onClick={onClose} />
            <section data-testid="buyer-evaluation-center" className="fixed inset-x-8 top-16 bottom-6 z-[169] rounded-2xl border border-cyan-300/25 bg-slate-950 shadow-[0_20px_90px_rgba(0,0,0,0.75)] overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-white/10 bg-black/30 flex items-center justify-between">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300 font-bold">Buyer Evaluation Journey</div>
                        <div className="text-[10px] font-mono text-slate-500">Evaluator quickstart and approval path aligned to runtime truth.</div>
                    </div>
                    <button type="button" data-testid="buyer-close-btn" onClick={onClose} className="h-8 w-8 rounded-full border border-white/10 text-slate-300 hover:bg-white/10">x</button>
                </div>
                <div className="flex-1 min-h-0 p-3 overflow-auto grid grid-cols-2 gap-3">
                    <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2 text-[10px] font-mono text-slate-300">
                        <div className="text-[9px] uppercase tracking-[0.14em] text-slate-300 font-bold">Evaluation Sequence</div>
                        <div>1. What this is / is not</div>
                        <div>2. Use-case matrix review</div>
                        <div>3. 30-minute demo walkthrough</div>
                        <div>4. Security/procurement fast path</div>
                        <div>5. Pilot request and success criteria worksheet</div>
                    </section>
                    <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2 text-[10px] font-mono text-slate-300">
                        <div className="text-[9px] uppercase tracking-[0.14em] text-slate-300 font-bold">Defensible Messaging</div>
                        <div>- No unsupported compliance claim language</div>
                        <div>- No fake telemetry or customer claims</div>
                        <div>- Every claim must map to visible control or artifact</div>
                        <div>- Buyer docs reference local-first and air-gap reality only</div>
                    </section>
                </div>
            </section>
        </>
    );
}
