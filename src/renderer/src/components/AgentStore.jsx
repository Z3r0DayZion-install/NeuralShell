import React from 'react';
import UpgradeModal from './UpgradeModal';
import TierGateNotice from './TierGateNotice';
import AgentReputationCard from './AgentReputationCard';

export default function AgentStore() {
    const [agents, setAgents] = React.useState([]);
    const [receipts, setReceipts] = React.useState({});
    const [settings, setSettings] = React.useState({ capabilities: [] });
    const [status, setStatus] = React.useState('');
    const [busyId, setBusyId] = React.useState('');
    const [receiptDrafts, setReceiptDrafts] = React.useState({});
    const [gatedAgent, setGatedAgent] = React.useState(null);

    const refresh = React.useCallback(async () => {
        const [agentRows, receiptPayload, runtimeSettings] = await Promise.all([
            window.api.agents.list(),
            window.api.agents.receipts().catch(() => ({ receipts: {} })),
            window.api.settings.get(),
        ]);
        setAgents(Array.isArray(agentRows) ? agentRows : []);
        setReceipts(receiptPayload && receiptPayload.receipts ? receiptPayload.receipts : {});
        setSettings(runtimeSettings && typeof runtimeSettings === 'object' ? runtimeSettings : { capabilities: [] });
    }, []);

    React.useEffect(() => {
        refresh().catch((err) => {
            setStatus(`Agent store load failed: ${err && err.message ? err.message : String(err)}`);
        });
    }, [refresh]);

    const capabilities = Array.isArray(settings && settings.capabilities) ? settings.capabilities : [];
    const canInstallPaid = capabilities.includes('marketplace_paid_install');

    const installAgent = async (agent) => {
        if (!agent) return;
        if (agent.paid && !canInstallPaid) {
            setGatedAgent(agent);
            return;
        }
        setBusyId(agent.id);
        try {
            const receiptCode = String(receiptDrafts[agent.id] || '').trim();
            const result = await window.api.agents.install(agent.id, {
                receiptCode,
            });
            if (result && result.ok) {
                const receiptSuffix = result.receipt && result.receipt.code ? ' (receipt stored)' : '';
                setStatus(`Installed ${result.id}${receiptSuffix}`);
            } else {
                setStatus(`Install failed for ${agent.id}.`);
            }
            await refresh();
        } catch (err) {
            setStatus(`Install failed: ${err && err.message ? err.message : String(err)}`);
        } finally {
            setBusyId('');
        }
    };

    return (
        <section data-testid="agent-store" className="space-y-3 p-5 bg-black/30 rounded-2xl border border-white/5 shadow-inner">
            <div>
                <div className="text-[10px] uppercase tracking-widest text-emerald-300 font-bold">Agent Store</div>
                <div className="text-[11px] text-slate-400 font-mono">Free + paid agents with local receipts and trust reputation.</div>
            </div>

            {gatedAgent && (
                <TierGateNotice
                    featureLabel={`Install ${gatedAgent.name}`}
                    requiredPlan="Pro"
                    onUpgrade={() => setGatedAgent(gatedAgent)}
                />
            )}

            <div className="grid grid-cols-1 gap-2">
                {agents.map((agent) => {
                    const existingReceipt = receipts && receipts[agent.id] ? receipts[agent.id] : null;
                    return (
                        <article key={agent.id} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 space-y-2">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="text-[11px] text-slate-100 font-semibold">{agent.name}</div>
                                    <div className="text-[10px] text-slate-500 font-mono">{agent.id}@{agent.version}</div>
                                    <div className="text-[10px] text-slate-400">{agent.description}</div>
                                    <div className="mt-1 text-[9px] font-mono text-slate-400">
                                        {agent.paid ? `Paid $${Number(agent.priceUsd || 0)}` : 'Free'} · {agent.publisher || 'Community'}
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className={`text-[9px] font-mono uppercase tracking-[0.14em] ${agent.verified ? 'text-emerald-300' : 'text-rose-300'}`}>
                                        {agent.verified ? 'Verified' : 'Unverified'}
                                    </span>
                                    <button
                                        type="button"
                                        data-testid={`agent-store-install-${agent.id}`}
                                        disabled={busyId === agent.id || !agent.verified}
                                        onClick={() => installAgent(agent)}
                                        className="px-2 py-1 rounded border border-cyan-300/30 bg-cyan-500/10 text-[9px] font-mono uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-500/20 disabled:opacity-50"
                                    >
                                        {busyId === agent.id ? 'Installing' : 'Install'}
                                    </button>
                                </div>
                            </div>

                            {agent.paid && (
                                <div className="flex flex-wrap items-center gap-2">
                                    <input
                                        data-testid={`agent-store-receipt-${agent.id}`}
                                        value={receiptDrafts[agent.id] || ''}
                                        onChange={(event) => setReceiptDrafts((prev) => ({
                                            ...prev,
                                            [agent.id]: event.target.value,
                                        }))}
                                        placeholder="Receipt code (rcpt_...)"
                                        className="flex-1 min-w-40 bg-black/40 border border-white/10 rounded px-2 py-1 text-[10px] font-mono text-slate-100"
                                    />
                                    <span className="text-[9px] font-mono text-slate-500">
                                        <span data-testid={`agent-store-receipt-status-${agent.id}`}>
                                        {existingReceipt ? 'Receipt stored' : 'Receipt required'}
                                        </span>
                                    </span>
                                </div>
                            )}

                            <AgentReputationCard agent={agent} />
                        </article>
                    );
                })}
            </div>

            {status && (
                <div data-testid="agent-store-status" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-[10px] font-mono text-slate-300">
                    {status}
                </div>
            )}

            <UpgradeModal
                open={Boolean(gatedAgent)}
                featureKey={gatedAgent ? `agent-store:${gatedAgent.id}` : ''}
                featureLabel={gatedAgent ? `Install ${gatedAgent.name}` : ''}
                requiredPlan="pro"
                onClose={() => setGatedAgent(null)}
            />
        </section>
    );
}
