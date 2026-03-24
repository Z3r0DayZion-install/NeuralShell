import React from 'react';
import { getPaletteCommands } from '../state/moduleRegistry';

export function CommandPalette({ onClose }) {
    const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
    const mod = isMac ? '⌘' : 'Ctrl';

    // Pull commands from the module registry instead of hardcoding
    const registeredCommands = getPaletteCommands();
    const commands = registeredCommands.map((cmd, i) => ({
        id: cmd.id,
        label: cmd.title,
        shortcut: `${mod} + ${i + 1}`,
        action: cmd.action,
    }));

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 backdrop-blur-md bg-black/60 animate-in fade-in duration-200" onClick={onClose}>
            <div
                className="w-full max-w-2xl bg-[#0b1726]/80 backdrop-blur-xl border border-cyan-400/30 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_30px_rgba(34,211,238,0.1)] overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-4 border-b border-white/5 flex items-center gap-3">
                    <span className="text-cyan-400 font-mono text-xl">/</span>
                    <input
                        autoFocus
                        className="flex-1 bg-transparent border-none outline-none text-lg text-slate-100 placeholder-slate-600"
                        placeholder="Execute command or find thread..."
                    />
                    <div className="text-[10px] text-slate-500 bg-white/5 px-2 py-1 rounded border border-white/10 uppercase font-bold">ESC to close</div>
                </div>
                <div className="p-2 max-h-[400px] overflow-y-auto no-scrollbar">
                    {commands.map((cmd) => (
                        <button
                            key={cmd.id}
                            className="w-full text-left p-3 hover:bg-cyan-400/10 rounded-xl flex items-center justify-between group transition-all"
                            onClick={() => { if (cmd.action) cmd.action(); onClose(); }}
                        >
                            <span className="text-slate-300 group-hover:text-cyan-200">{cmd.label}</span>
                            <span className="text-[9px] text-slate-600 group-hover:text-cyan-400 font-mono uppercase">{cmd.shortcut}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default CommandPalette;
