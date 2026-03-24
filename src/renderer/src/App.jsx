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
        chatLog, appendChat,
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
    const handleSend = () => {
        if (!prompt.trim()) return;
        appendChat({ role: 'user', content: prompt });
        setPrompt("");
        setTimeout(() => {
            appendChat({ role: 'kernel', content: `Signal processed via ${activeModel}. Narrative drift stabilized.` });
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
                    prompt={prompt}
                    setPrompt={setPrompt}
                    onSend={handleSend}
                />

                <WorkbenchRail stats={stats} />
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
