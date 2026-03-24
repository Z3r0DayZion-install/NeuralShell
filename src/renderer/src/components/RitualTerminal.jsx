import React, { useState, useEffect, useRef } from 'react';
import { getRituals, dispatchRitual } from '../lib/NeuralEngine';
import { useNeuralState } from '../hooks/useNeuralState';
import Panel from './Panel';

export function RitualTerminal() {
    const [input, setInput] = useState('');
    const [log, setLog] = useState([]);
    const [overlay, setOverlay] = useState(null);
    const [xpState, setXPState] = useNeuralState('nt_xp_state', { xp: 0, fatigue: 0, tier: 1 });
    const logRef = useRef(null);

    useEffect(() => {
        if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
    }, [log]);

    const addLog = (msg, color = '#39ff14') =>
        setLog(l => [...l.slice(-80), { msg, color, ts: new Date().toLocaleTimeString() }]);

    const flash = (ritual) => {
        setOverlay(ritual);
        setTimeout(() => setOverlay(null), 2000);
    };

    const handleSubmit = async (e) => {
        e?.preventDefault();
        const cmd = input.trim();
        if (!cmd) return;
        setInput('');

        addLog(`> ${cmd}`, '#fff');

        const result = await dispatchRitual(cmd);
        if (result) {
            flash(result.ritual);
            addLog(`✓ ${result.ritual.label}`, `rgba(${result.ritual.color},1)`);
            addLog(`  ${result.ritual.desc}`, 'rgba(255,255,255,0.4)');
            addLog(`  XP +${result.xpResult.gained} → ${result.xpResult.xp} total`, '#ffd700');
            setXPState(result.xpResult);
        } else {
            addLog(`! UNKNOWN_COMMAND: "${cmd}"`, 'rgba(255,0,60,0.6)');
            addLog(`  Valid: ${Object.keys(getRituals()).join(' | ')}`, 'rgba(255,255,255,0.3)');
        }
    };

    return (
        <Panel className="p-4 border-cyan-400/20 bg-black/40">
            {/* Ritual overlay flash */}
            {overlay && (
                <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center animate-pulse" style={{ background: `radial-gradient(circle at center, rgba(${overlay.color},0.2), transparent 70%)` }}>
                    <div className="text-2xl font-bold tracking-widest uppercase" style={{ color: `rgb(${overlay.color})`, textShadow: `0 0 20px rgb(${overlay.color})` }}>
                        {overlay.label}
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center mb-3">
                <div className="text-[10px] uppercase tracking-widest text-cyan-400 opacity-60">Ritual Console // Input required</div>
                <div className="flex gap-3 text-[10px]">
                    <span className="text-amber-300">XP: {xpState.xp}</span>
                    <span className="text-cyan-300">TIER: {xpState.tier}</span>
                </div>
            </div>

            <div ref={logRef} className="h-32 overflow-y-auto font-mono text-[11px] space-y-1 mb-3 pr-2 custom-scrollbar">
                {log.length === 0 ? (
                    <div className="opacity-30 italic">Type ignite, freeze, shadow, or mutate...</div>
                ) : log.map((entry, i) => (
                    <div key={i} style={{ color: entry.color }}>
                        <span className="opacity-40 mr-2">[{entry.ts}]</span>{entry.msg}
                    </div>
                ))}
            </div>

            <form onSubmit={handleSubmit} className="relative">
                <span className="absolute left-2 top-1.5 text-cyan-400 text-xs">{'>'}</span>
                <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    className="w-full bg-black/30 border border-cyan-400/20 rounded-lg pl-6 py-1.5 text-cyan-300 text-xs font-mono focus:outline-none focus:border-cyan-400/50 transition-colors"
                    placeholder="ENTER_RITUAL_COMMAND"
                    autoComplete="off"
                />
            </form>
        </Panel>
    );
}

export default RitualTerminal;
