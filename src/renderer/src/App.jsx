import React, { useState, useEffect } from 'react';
import { useNeuralState } from './hooks/useNeuralState';
import TopStatusBar from './components/TopStatusBar';
import ThreadRail from './components/ThreadRail';
import WorkspacePanel from './components/WorkspacePanel';
import WorkbenchRail from './components/WorkbenchRail';
import CommandPalette from './components/CommandPalette';

function App() {
    // 1. Core Sync'd State (IPC)
    const [activeModel, setActiveModel] = useNeuralState('activeModel', 'llama3');
    const [activeSession, setActiveSession] = useNeuralState('activeSession', 'default');
    const [xpState] = useNeuralState('nt_xp_state', { xp: 0, tier: 1 });
    const [stats, setStats] = useState({ cpuPercent: 0, memoryMb: 0 });
    const [sessions, setSessions] = useState([]);

    // 2. UI Local State
    const [prompt, setPrompt] = useState("");
    const [chatLog, setChatLog] = useState([]);
    const [showPalette, setShowPalette] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    // 3. Effect: Telemetry & Listeners
    useEffect(() => {
        const interval = setInterval(async () => {
            const data = await window.api.system.getStats();
            setStats(data);
        }, 3000);

        const handleKey = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setShowPalette(p => !p);
            }
            if (e.key === 'Escape') {
                setShowPalette(false);
                setShowSettings(false);
            }
        };

        const loadSessions = async () => {
            const list = await window.api.session.list();
            setSessions(list || []);
        };

        window.addEventListener('keydown', handleKey);
        loadSessions();
        return () => {
            clearInterval(interval);
            window.removeEventListener('keydown', handleKey);
        };
    }, []);

    // 4. Handlers
    const handleSend = () => {
        if (!prompt.trim()) return;
        setChatLog(prev => [...prev, { role: 'user', content: prompt }]);
        setPrompt("");
        // Simulated kernel response
        setTimeout(() => {
            setChatLog(prev => [...prev, { role: 'kernel', content: `Signal processed via ${activeModel}. Narrative drift stabilized.` }]);
        }, 800);
    };

    return (
        <div className="h-screen w-screen bg-[#02080e] text-slate-200 flex flex-col overflow-hidden font-sans selection:bg-cyan-500/30">
            {/* 1. Global Status Header (Sovereign Command Strip) */}
            <TopStatusBar
                model={activeModel}
                setModel={setActiveModel}
                stats={stats}
                xpState={xpState}
                onOpenPalette={() => setShowPalette(true)}
                onOpenSettings={() => setShowSettings(true)}
            />

            {/* 2. Primary Three-Column Shell */}
            <div className="flex-1 flex min-h-0 overflow-hidden relative">
                {/* Subtle ambient depth (Disciplined) */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-cyan-500/[0.03] blur-[120px] pointer-events-none" />

                <ThreadRail
                    sessions={sessions}
                    activeSession={activeSession}
                    onSelectSession={setActiveSession}
                />

                <WorkspacePanel
                    chatLog={chatLog}
                    prompt={prompt}
                    setPrompt={setPrompt}
                    onSend={handleSend}
                />

                <WorkbenchRail stats={stats} />
            </div>

            {/* 3. Command Palette Overlay (Modular) */}
            {showPalette && (
                <CommandPalette onClose={() => setShowPalette(false)} />
            )}

            {/* 4. Settings Drawer */}
            {showSettings && (
                <>
                    <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setShowSettings(false)} />
                    <div className="fixed right-0 top-0 bottom-0 w-[450px] z-50 bg-[#071321] border-l border-cyan-400/20 shadow-[-10px_0_30px_rgba(0,0,0,0.4)] p-8 flex flex-col animate-in slide-in-from-right duration-300">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-bold text-white tracking-tight">Configuration</h2>
                            <button onClick={() => setShowSettings(false)} className="h-10 w-10 rounded-full hover:bg-white/5 flex items-center justify-center text-slate-400">✕</button>
                        </div>

                        <div className="space-y-8 flex-1 overflow-y-auto pr-4 no-scrollbar">
                            <section>
                                <div className="text-[10px] uppercase tracking-widest text-cyan-400 mb-4 font-bold">Bridge Settings</div>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center p-4 bg-black/20 rounded-2xl border border-white/5">
                                        <div>
                                            <div className="text-sm font-medium text-slate-200">Safe Defaults</div>
                                            <div className="text-[10px] text-slate-500">Enable OMEGA-hardened prompts</div>
                                        </div>
                                        <div className="h-5 w-10 bg-cyan-400/20 border border-cyan-400/40 rounded-full flex items-center px-1">
                                            <div className="h-3 w-3 bg-cyan-400 rounded-full ml-auto" />
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center p-4 bg-black/20 rounded-2xl border border-white/5 opacity-40">
                                        <div>
                                            <div className="text-sm font-medium text-slate-200">Network Tunnel</div>
                                            <div className="text-[10px] text-slate-500">Requires APEX tier license</div>
                                        </div>
                                        <div className="h-5 w-10 bg-slate-800 rounded-full" />
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default App;
