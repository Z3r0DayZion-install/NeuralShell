import React from "react";

const PLAYBOOKS = [
    {
        id: "provider_bridge_failure",
        title: "Provider Bridge Failure",
        steps: [
            "Retry provider bridge probe.",
            "Switch to safe policy profile if probe fails twice.",
            "Capture diagnostics bundle and attach to incident.",
        ],
    },
    {
        id: "relay_failure_repeated",
        title: "Repeated Relay Failure",
        steps: [
            "Disable relay path after threshold.",
            "Force local-only mode.",
            "Review relay channel mapping and retry once.",
        ],
    },
    {
        id: "proof_engine_stall",
        title: "Proof Engine Stall",
        steps: [
            "Abort stalled proof run and capture stdout tail.",
            "Run health probe before retry.",
            "Escalate incident if second run stalls.",
        ],
    },
    {
        id: "policy_corruption",
        title: "Policy Corruption",
        steps: [
            "Block policy apply and freeze rollout queue.",
            "Restore known-good signed policy bundle.",
            "Run policy verification before reopening rollout.",
        ],
    },
    {
        id: "update_verification_failure",
        title: "Update Verification Failure",
        steps: [
            "Freeze update lane immediately.",
            "Reject pending pack and keep current version.",
            "Notify operator with evidence hash details.",
        ],
    },
    {
        id: "vault_access_failure",
        title: "Vault Access Failure",
        steps: [
            "Lock runtime and block sensitive actions.",
            "Prompt sealed recovery flow.",
            "Require manual operator acknowledgement before unlock.",
        ],
    },
    {
        id: "fleet_node_degraded",
        title: "Fleet Node Degraded/Unreachable",
        steps: [
            "Mark node degraded in fleet panel.",
            "Attempt one health re-probe and capture delta.",
            "Open incident if node stays degraded for next cycle.",
        ],
    },
];

export default function RecoveryPlaybookView({
    onApply,
}) {
    return (
        <section data-testid="recovery-playbook-view" className="rounded-xl border border-white/10 bg-black/25 p-3 space-y-2">
            <div className="text-[9px] uppercase tracking-[0.14em] text-cyan-300 font-bold">Recovery Playbooks</div>
            <div className="max-h-64 overflow-auto space-y-2 pr-1">
                {PLAYBOOKS.map((playbook) => (
                    <article key={playbook.id} className="rounded border border-white/10 bg-black/30 p-2">
                        <div className="flex items-center justify-between gap-2">
                            <div className="text-[10px] font-mono text-slate-100">{playbook.title}</div>
                            <button
                                type="button"
                                data-testid={`playbook-apply-${playbook.id}`}
                                onClick={() => {
                                    if (typeof onApply === "function") onApply(playbook);
                                }}
                                className="px-2 py-1 rounded border border-cyan-300/30 bg-cyan-500/10 text-[9px] uppercase tracking-[0.12em] font-mono text-cyan-100"
                            >
                                Apply
                            </button>
                        </div>
                        <ul className="mt-1 space-y-1 text-[9px] font-mono text-slate-400">
                            {playbook.steps.map((step, index) => (
                                <li key={`${playbook.id}-${index}`}>{index + 1}. {step}</li>
                            ))}
                        </ul>
                    </article>
                ))}
            </div>
        </section>
    );
}