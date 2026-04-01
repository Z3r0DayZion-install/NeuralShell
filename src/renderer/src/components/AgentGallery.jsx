import React from 'react';

export default function AgentGallery() {
    const [agents, setAgents] = React.useState([]);
    const [busyId, setBusyId] = React.useState('');
    const [status, setStatus] = React.useState('');

    React.useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const rows = await window.api.agents.list();
                if (!mounted) return;
                setAgents(Array.isArray(rows) ? rows : []);
            } catch (err) {
                if (!mounted) return;
                setStatus(`Agent list load failed: ${err && err.message ? err.message : String(err)}`);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    const installAgent = async (agentId) => {
        setBusyId(String(agentId || ''));
        try {
            const result = await window.api.agents.install(agentId);
            setStatus(result && result.ok
                ? `Installed ${result.id} -> ${result.installPath}`
                : 'Install failed.');
        } catch (err) {
            setStatus(`Install failed: ${err && err.message ? err.message : String(err)}`);
        } finally {
            setBusyId('');
        }
    };

    return (
        <section data-testid="agent-gallery" className="space-y-3 p-5 bg-black/30 rounded-2xl border border-white/5 shadow-inner">
            <div>
                <div className="text-[10px] uppercase tracking-widest text-cyan-300 font-bold">Agent Marketplace</div>
                <div className="text-[11px] text-slate-400 font-mono">Core agents are signature and SHA-256 validated before install.</div>
            </div>
            <div className="grid grid-cols-1 gap-2">
                {agents.map((agent) => (
                    <article key={agent.id} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <div className="text-[11px] text-slate-200 font-semibold">{agent.name}</div>
                                <div className="text-[10px] text-slate-500 font-mono">{agent.id}@{agent.version}</div>
                                <div className="text-[10px] text-slate-400">{agent.description}</div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <span className={`text-[9px] font-mono uppercase tracking-[0.14em] ${agent.verified ? 'text-emerald-300' : 'text-rose-300'}`}>
                                    {agent.verified ? 'Verified' : 'Unverified'}
                                </span>
                                <button
                                    type="button"
                                    data-testid={`agent-install-${agent.id}`}
                                    disabled={busyId === agent.id || !agent.verified}
                                    onClick={() => installAgent(agent.id)}
                                    className="px-2 py-1 rounded border border-cyan-300/30 bg-cyan-500/10 text-[9px] font-mono uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-500/20 disabled:opacity-50"
                                >
                                    {busyId === agent.id ? 'Installing' : 'Install'}
                                </button>
                            </div>
                        </div>
                    </article>
                ))}
                {agents.length === 0 && (
                    <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-[10px] text-slate-500 font-mono">
                        No core agents found.
                    </div>
                )}
            </div>
            {status && (
                <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-[10px] font-mono text-slate-300">
                    {status}
                </div>
            )}
        </section>
    );
}

