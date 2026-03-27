import React from 'react';

export default function ThreadDrawer({
    open,
    thread,
    onClose,
    onReply,
    onUseContext,
}) {
    const [draft, setDraft] = React.useState('');

    React.useEffect(() => {
        if (!open) {
            setDraft('');
        }
    }, [open, thread && thread.id]);

    React.useEffect(() => {
        if (!open) return undefined;
        const onKeyDown = (event) => {
            if (event.key === 'Escape' && typeof onClose === 'function') {
                onClose();
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [open, onClose]);

    if (!open || !thread) return null;

    const submitReply = () => {
        if (typeof onReply !== 'function') return;
        const safe = String(draft || '').trim();
        if (!safe) return;
        onReply(thread.id, safe);
        setDraft('');
    };

    return (
        <>
            <div className="fixed inset-0 z-[87] bg-black/35" onClick={onClose} />
            <aside
                data-testid="thread-drawer"
                role="dialog"
                aria-label="Thread drawer"
                className="fixed right-0 top-0 bottom-0 z-[88] w-[min(40vw,560px)] border-l border-cyan-300/20 bg-slate-950/95 backdrop-blur-md shadow-[-20px_0_45px_rgba(0,0,0,0.55)]"
            >
                <div className="h-full flex flex-col">
                    <header className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                        <div>
                            <div className="text-[10px] uppercase tracking-[0.14em] text-cyan-300 font-bold">Threaded Replies</div>
                            <div className="text-[10px] text-slate-500 font-mono">Thread ID: {thread.id}</div>
                        </div>
                        <button
                            type="button"
                            data-testid="thread-drawer-close"
                            onClick={onClose}
                            className="h-8 w-8 rounded-full border border-white/10 text-slate-300 hover:bg-white/10"
                        >
                            ✕
                        </button>
                    </header>

                    <div className="px-4 py-3 border-b border-white/10 bg-black/25">
                        <div className="text-[9px] uppercase tracking-[0.14em] text-slate-500 font-bold mb-1">Root Message</div>
                        <pre className="m-0 whitespace-pre-wrap text-[11px] font-mono text-slate-300 max-h-28 overflow-auto custom-scrollbar">
                            {String(thread.rootContent || '')}
                        </pre>
                    </div>

                    <div className="flex-1 overflow-auto p-4 space-y-3 custom-scrollbar">
                        {(Array.isArray(thread.replies) ? thread.replies : []).length === 0 ? (
                            <div className="text-[10px] font-mono text-slate-500">
                                No replies yet. Add one to build a focused thread context.
                            </div>
                        ) : (
                            thread.replies.map((reply) => (
                                <article key={reply.id} className="rounded-lg border border-white/10 bg-black/30 p-3">
                                    <div className="text-[9px] text-slate-500 font-mono mb-1">{reply.createdAt}</div>
                                    <div className="text-[11px] text-slate-200 whitespace-pre-wrap">{reply.content}</div>
                                </article>
                            ))
                        )}
                    </div>

                    <div className="p-4 border-t border-white/10 bg-black/30 space-y-2">
                        <textarea
                            data-testid="thread-reply-input"
                            value={draft}
                            onChange={(event) => setDraft(event.target.value)}
                            placeholder="Add threaded reply..."
                            className="w-full min-h-24 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-[11px] text-slate-200 font-mono outline-none focus:border-cyan-300/35"
                        />
                        <div className="flex items-center justify-between gap-2">
                            <button
                                type="button"
                                data-testid="thread-use-context-btn"
                                onClick={() => {
                                    if (typeof onUseContext === 'function') {
                                        onUseContext(thread.id);
                                    }
                                }}
                                className="px-3 py-2 rounded-lg border border-cyan-300/30 bg-cyan-500/10 text-[10px] uppercase tracking-[0.14em] font-bold text-cyan-100 hover:bg-cyan-500/20"
                            >
                                Use Context
                            </button>
                            <button
                                type="button"
                                data-testid="thread-reply-send"
                                onClick={submitReply}
                                className="px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-[10px] uppercase tracking-[0.14em] font-bold text-slate-200 hover:bg-white/10"
                            >
                                Add Reply
                            </button>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}
