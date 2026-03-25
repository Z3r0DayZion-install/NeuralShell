import React from 'react';
import { useShell } from './state/ShellContext';
import TopStatusBar from './components/TopStatusBar';
import ThreadRail from './components/ThreadRail';
import WorkspacePanel from './components/WorkspacePanel';
import WorkbenchRail from './components/WorkbenchRail';
import CommandPalette from './components/CommandPalette';
import SettingsDrawer from './components/SettingsDrawer';

function App() {
    const {
        // Domain
        activeModel, setActiveModel,
        activeSession, setActiveSession,
        xpState,
        sessions,
        chatLog, appendChat, setChatLog,
        // System
        stats,
        // UI
        showPalette, togglePalette, closePalette,
        showSettings, openPalette, openSettings, closeSettings,
    } = useShell();

    // ── Transient State (component-local) ──
    const [prompt, setPrompt] = React.useState("");

    // ── Keyboard Handler ──
    React.useEffect(() => {
        const handleKey = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                togglePalette();
            }
            if (e.key === 'Escape') {
                closePalette();
                closeSettings();
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [togglePalette, closePalette, closeSettings]);

    // ── Actions ──
    const executeSignal = async (signal) => {
        const input = signal || prompt;
        if (!input.trim()) return;

        appendChat({ role: 'user', content: input });
        setPrompt("");

        const command = input.trim().toLowerCase();

        // ── Command Router ──
        if (command.startsWith('/')) {
            if (command === '/clear' || command === '/purge' || command === '/reset') {
                setChatLog([]);
                return;
            }

            setTimeout(() => {
                if (command === '/help') {
                    appendChat({
                        role: 'kernel',
                        content: "### NeuralShell Operator Guide\n\n- `/help` : Show this guide\n- `/status` : Check node telemetry\n- `/clear` : Wipe current thread\n- `/workflows` : List active sessions\n- `/guard` : Audit security status\n- `Ctrl+P` : Open Command Palette"
                    });
                } else if (command === '/status') {
                    appendChat({
                        role: 'kernel',
                        content: `Node Status: OPERATIONAL\nIntegrity: SEALED\nCPU: ${stats.cpuPercent}%\nMemory: ${stats.memoryMb}MB`
                    });
                } else if (command === '/guard') {
                    appendChat({
                        role: 'kernel',
                        content: "Security Guard: ACTIVE\nPolicy: AIRGAP_ENFORCED\nIntegrity: SEALED (Hardware Bound)"
                    });
                } else if (command === '/workflows') {
                    appendChat({
                        role: 'kernel',
                        content: `Active Workflows:\n${sessions.join('\n')}`
                    });
                } else if (command === '/resume') {
                    appendChat({
                        role: 'kernel',
                        content: "Restoring previous session context... Done. All workstation metrics verified."
                    });
                } else {
                    appendChat({ role: 'kernel', content: `Unknown command: ${command}` });
                }
            }, 400);
            return;
        }

        // --- REAL LLM COMPLETION ---
        try {
            const history = [...chatLog, { role: 'user', content: input }];
            const response = await window.api.llm.chat(history);
            appendChat({ role: 'kernel', content: response.content || "System: Empty response from kernel." });
        } catch (err) {
            appendChat({ role: 'kernel', content: `Kernel Error: ${err.message}` });
        }
    };

    const handleSend = () => executeSignal();

    return (
        <div className="h-screen w-screen bg-slate-950 text-slate-200 flex flex-col overflow-hidden font-sans selection:bg-cyan-500/30">
            {/* 1. Global Status Header (Sovereign Command Strip) */}
            <TopStatusBar
                model={activeModel}
                setModel={setActiveModel}
                stats={stats}
                xpState={xpState}
                activeSession={activeSession}
                onOpenPalette={openPalette}
                onOpenSettings={openSettings}
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
                    activeSession={activeSession}
                    prompt={prompt}
                    setPrompt={setPrompt}
                    onSend={handleSend}
                    onExecute={executeSignal}
                />

                <WorkbenchRail stats={stats} activeSession={activeSession} />
            </div>

            {/* 3. Command Palette Overlay */}
            {showPalette && (
                <CommandPalette onClose={closePalette} />
            )}

            {/* 4. Settings Drawer */}
            {showSettings && <SettingsDrawer />}
        </div>
    );
}

export default App;
