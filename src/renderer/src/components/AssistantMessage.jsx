import React from 'react';
import { ChevronDown, Code2, Copy, GitCommitHorizontal, Share2 } from 'lucide-react';
import { copyToastLabel, copyWithMode } from '../utils/copy.ts';

export function AssistantMessage({ content, onToast, onShare }) {
    const [open, setOpen] = React.useState(false);
    const [contextMenu, setContextMenu] = React.useState(null);
    const menuRef = React.useRef(null);

    React.useEffect(() => {
        const onOutsideClick = (event) => {
            const node = menuRef.current;
            if (!node) return;
            if (node.contains(event.target)) return;
            setOpen(false);
            setContextMenu(null);
        };
        window.addEventListener('mousedown', onOutsideClick);
        return () => {
            window.removeEventListener('mousedown', onOutsideClick);
        };
    }, []);

    const emitToast = (message) => {
        if (typeof onToast === 'function') {
            onToast(message);
        }
    };

    const runCopy = async (mode) => {
        try {
            await copyWithMode(content, mode);
            emitToast(copyToastLabel(mode));
        } catch {
            emitToast('Copy failed');
        } finally {
            setOpen(false);
            setContextMenu(null);
        }
    };

    const runShare = async () => {
        if (typeof onShare !== 'function') return;
        try {
            await onShare(content);
        } finally {
            setOpen(false);
            setContextMenu(null);
        }
    };

    return (
        <div
            data-testid="chat-message"
            className="max-w-[85%] 2xl:max-w-[75%] mr-auto animate-in fade-in slide-in-from-bottom-2 duration-500 relative"
            onContextMenu={(event) => {
                event.preventDefault();
                setContextMenu({ x: event.clientX, y: event.clientY });
            }}
        >
            <div className="flex items-center gap-3 mb-2.5 opacity-30">
                <div className="h-px w-6 bg-slate-400" />
                <div className="text-[8px] uppercase tracking-[0.3em] font-black">
                    Neural_Response
                </div>
            </div>
            <div className="p-6 rounded-2xl text-[14px] leading-relaxed shadow-2xl transition-all duration-300 bg-black/30 border border-white/[0.04] text-slate-300">
                <div className="mb-2.5 flex items-center justify-end gap-1" ref={menuRef}>
                    <button
                        type="button"
                        data-testid="assistant-copy-btn"
                        onClick={() => runCopy('default')}
                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded border border-white/10 bg-white/5 text-[9px] font-mono text-slate-300 hover:text-cyan-200 hover:border-cyan-300/35"
                    >
                        <Copy size={12} />
                        Copy
                    </button>
                    <button
                        type="button"
                        data-testid="assistant-copy-menu-btn"
                        onClick={() => setOpen((prev) => !prev)}
                        className="inline-flex items-center px-2 py-1 rounded border border-white/10 bg-white/5 text-[9px] font-mono text-slate-300 hover:text-cyan-200 hover:border-cyan-300/35"
                    >
                        <ChevronDown size={12} />
                    </button>
                    {open && (
                        <div
                            data-testid="assistant-copy-dropdown"
                            className="absolute z-20 right-6 mt-20 min-w-44 rounded-xl border border-cyan-300/25 bg-slate-950/95 p-1.5 shadow-[0_12px_30px_rgba(0,0,0,0.45)]"
                        >
                            <button
                                type="button"
                                data-testid="assistant-copy-option-codeblock"
                                onClick={() => runCopy('codeblock')}
                                className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-cyan-500/10 text-[10px] font-mono text-slate-200 flex items-center gap-2"
                            >
                                <Code2 size={12} />
                                Copy as CodeBlock
                            </button>
                            <button
                                type="button"
                                data-testid="assistant-copy-option-commit"
                                onClick={() => runCopy('commit')}
                                className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-cyan-500/10 text-[10px] font-mono text-slate-200 flex items-center gap-2"
                            >
                                <GitCommitHorizontal size={12} />
                                Copy as Commit
                            </button>
                            <button
                                type="button"
                                data-testid="assistant-share-option"
                                onClick={runShare}
                                className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-cyan-500/10 text-[10px] font-mono text-slate-200 flex items-center gap-2"
                            >
                                <Share2 size={12} />
                                Share
                            </button>
                        </div>
                    )}
                </div>
                <div className="whitespace-pre-wrap">{content}</div>
            </div>

            {contextMenu && (
                <div
                    data-testid="assistant-context-menu"
                    className="fixed z-50 min-w-32 rounded-lg border border-cyan-300/25 bg-slate-950/95 p-1 shadow-[0_12px_30px_rgba(0,0,0,0.45)]"
                    style={{
                        left: `${contextMenu.x}px`,
                        top: `${contextMenu.y}px`,
                    }}
                >
                    <button
                        type="button"
                        data-testid="assistant-context-share"
                        onClick={runShare}
                        className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-cyan-500/10 text-[10px] font-mono text-slate-200 flex items-center gap-2"
                    >
                        <Share2 size={12} />
                        Share
                    </button>
                </div>
            )}
        </div>
    );
}

export default AssistantMessage;
