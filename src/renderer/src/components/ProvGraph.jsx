import React from 'react';

function buildGraph(chatLog, threadList) {
    const nodes = [];
    const links = [];
    const safeChat = Array.isArray(chatLog) ? chatLog : [];
    const safeThreads = Array.isArray(threadList) ? threadList : [];

    safeChat.forEach((message, index) => {
        const id = `msg-${index}`;
        nodes.push({
            id,
            label: `${String(message && message.role ? message.role : 'message')} ${index + 1}`,
            kind: 'message',
            x: 80 + (index % 6) * 150,
            y: 80 + Math.floor(index / 6) * 120,
        });
        if (index > 0) {
            links.push({
                source: `msg-${index - 1}`,
                target: id,
                label: 'next',
            });
        }
    });

    safeThreads.forEach((thread, index) => {
        const threadNodeId = `thread-${String(thread && thread.id ? thread.id : index)}`;
        nodes.push({
            id: threadNodeId,
            label: `thread ${index + 1}`,
            kind: 'thread',
            x: 120 + (index % 4) * 200,
            y: 420 + Math.floor(index / 4) * 120,
        });
        const rootMessageId = String(thread && thread.messageId ? thread.messageId : '').trim();
        const msgNode = safeChat.findIndex((entry) => String(entry && entry.id ? entry.id : '') === rootMessageId);
        if (msgNode >= 0) {
            links.push({
                source: `msg-${msgNode}`,
                target: threadNodeId,
                label: 'thread',
            });
        }
    });

    return { nodes, links };
}

export default function ProvGraph({
    open,
    onClose,
    chatLog,
    threads,
}) {
    const [scale, setScale] = React.useState(1);
    const [offset, setOffset] = React.useState({ x: 0, y: 0 });
    const dragRef = React.useRef({ active: false, x: 0, y: 0 });
    const graph = React.useMemo(() => buildGraph(chatLog, threads), [chatLog, threads]);

    React.useEffect(() => {
        if (!open) {
            setScale(1);
            setOffset({ x: 0, y: 0 });
        }
    }, [open]);

    if (!open) return null;

    return (
        <>
            <div className="fixed inset-0 z-[140] bg-black/55" onClick={onClose} />
            <section className="fixed inset-8 z-[141] rounded-2xl border border-cyan-300/20 bg-slate-950/95 backdrop-blur-md overflow-hidden">
                <header className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.14em] text-cyan-300 font-bold">Graph Provenance Explorer</div>
                        <div className="text-[10px] font-mono text-slate-500">Pan, zoom, and inspect chat/thread lineage.</div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setScale((prev) => Math.min(2.5, prev + 0.1))}
                            className="px-2 py-1 rounded border border-white/15 bg-white/5 text-[10px] font-mono text-slate-200"
                        >
                            Zoom+
                        </button>
                        <button
                            type="button"
                            onClick={() => setScale((prev) => Math.max(0.6, prev - 0.1))}
                            className="px-2 py-1 rounded border border-white/15 bg-white/5 text-[10px] font-mono text-slate-200"
                        >
                            Zoom-
                        </button>
                        <button
                            type="button"
                            data-testid="prov-graph-close-btn"
                            onClick={onClose}
                            className="h-8 w-8 rounded-full border border-white/15 text-slate-300 hover:bg-white/10"
                        >
                            ✕
                        </button>
                    </div>
                </header>
                <div
                    className="h-[calc(100%-56px)] w-full overflow-hidden cursor-grab active:cursor-grabbing"
                    onMouseDown={(event) => {
                        dragRef.current = {
                            active: true,
                            x: event.clientX - offset.x,
                            y: event.clientY - offset.y,
                        };
                    }}
                    onMouseMove={(event) => {
                        if (!dragRef.current.active) return;
                        setOffset({
                            x: event.clientX - dragRef.current.x,
                            y: event.clientY - dragRef.current.y,
                        });
                    }}
                    onMouseUp={() => {
                        dragRef.current.active = false;
                    }}
                    onMouseLeave={() => {
                        dragRef.current.active = false;
                    }}
                >
                    <svg data-testid="prov-graph-canvas" className="h-full w-full">
                        <g transform={`translate(${offset.x}, ${offset.y}) scale(${scale})`}>
                            {graph.links.map((link) => {
                                const source = graph.nodes.find((node) => node.id === link.source);
                                const target = graph.nodes.find((node) => node.id === link.target);
                                if (!source || !target) return null;
                                return (
                                    <line
                                        key={`${link.source}-${link.target}`}
                                        x1={source.x}
                                        y1={source.y}
                                        x2={target.x}
                                        y2={target.y}
                                        stroke="rgba(148,163,184,0.5)"
                                        strokeWidth="1.5"
                                    />
                                );
                            })}
                            {graph.nodes.map((node) => (
                                <g key={node.id}>
                                    <circle
                                        cx={node.x}
                                        cy={node.y}
                                        r="24"
                                        fill={node.kind === 'thread' ? 'rgba(34,211,238,0.25)' : 'rgba(148,163,184,0.22)'}
                                        stroke={node.kind === 'thread' ? 'rgba(34,211,238,0.8)' : 'rgba(148,163,184,0.8)'}
                                    />
                                    <text
                                        x={node.x}
                                        y={node.y + 38}
                                        textAnchor="middle"
                                        fill="#e2e8f0"
                                        fontSize="11"
                                        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                                    >
                                        {node.label}
                                    </text>
                                </g>
                            ))}
                        </g>
                    </svg>
                </div>
            </section>
        </>
    );
}

