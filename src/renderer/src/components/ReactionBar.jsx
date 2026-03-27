import React from 'react';
import { ArrowLeftRight, Copy, MessageSquarePlus, Share2 } from 'lucide-react';

function ActionButton({ testId, label, title, onClick, children }) {
    return (
        <button
            type="button"
            data-testid={testId}
            aria-label={label}
            title={title || label}
            onClick={onClick}
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded border border-white/10 bg-black/40 text-[9px] font-mono text-slate-200 hover:border-cyan-300/35 hover:text-cyan-100 hover:bg-cyan-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/45"
        >
            {children}
            <span>{label}</span>
        </button>
    );
}

export default function ReactionBar({
    copyTooltip,
    onCopy,
    onDiff,
    onShare,
    onStartThread,
    diffAvailable,
}) {
    return (
        <div
            data-testid="reaction-bar"
            className="absolute top-3 right-3 z-20 flex items-center gap-1.5 opacity-0 pointer-events-none transition-opacity duration-200 group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto"
        >
            <ActionButton
                testId="reaction-copy-btn"
                label="Copy"
                title={copyTooltip || 'Copy message'}
                onClick={onCopy}
            >
                <Copy size={12} />
            </ActionButton>
            {diffAvailable && typeof onDiff === 'function' && (
                <ActionButton
                    testId="reaction-diff-btn"
                    label="Diff"
                    title="Open regeneration diff"
                    onClick={onDiff}
                >
                    <ArrowLeftRight size={12} />
                </ActionButton>
            )}
            {typeof onShare === 'function' && (
                <ActionButton
                    testId="reaction-share-btn"
                    label="Share"
                    title="Share this response"
                    onClick={onShare}
                >
                    <Share2 size={12} />
                </ActionButton>
            )}
            {typeof onStartThread === 'function' && (
                <ActionButton
                    testId="reaction-thread-btn"
                    label="Start thread"
                    title="Start a threaded reply lane"
                    onClick={onStartThread}
                >
                    <MessageSquarePlus size={12} />
                </ActionButton>
            )}
        </div>
    );
}
