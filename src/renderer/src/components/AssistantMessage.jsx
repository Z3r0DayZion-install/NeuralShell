import React from 'react';
import { copyToastLabel, copyWithMode } from '../utils/copy.ts';
import { formatTokenCostTooltip } from '../utils/tokenCost.ts';
import LazyImage from './LazyImage';
import ReactionBar from './ReactionBar';
import StdoutPane from './StdoutPane';

function parseContentTokens(content) {
    const source = String(content || '');
    const pattern = /!\[([^\]]*)\]\(([^)\s]+)\)/g;
    const tokens = [];
    let lastIndex = 0;
    let match = pattern.exec(source);

    while (match) {
        if (match.index > lastIndex) {
            tokens.push({ type: 'text', value: source.slice(lastIndex, match.index) });
        }
        tokens.push({
            type: 'image',
            alt: String(match[1] || 'image'),
            src: String(match[2] || ''),
        });
        lastIndex = match.index + match[0].length;
        match = pattern.exec(source);
    }

    if (lastIndex < source.length) {
        tokens.push({ type: 'text', value: source.slice(lastIndex) });
    }

    return tokens.length ? tokens : [{ type: 'text', value: source }];
}

function renderMessageBody(content) {
    const tokens = parseContentTokens(content);
    if (tokens.length === 1 && tokens[0].type === 'text') {
        return <div className="whitespace-pre-wrap">{tokens[0].value}</div>;
    }

    return (
        <div className="space-y-3">
            {tokens.map((token, index) => {
                if (token.type === 'text') {
                    const text = String(token.value || '');
                    if (!text.trim()) return null;
                    return (
                        <div key={`text-${index}`} className="whitespace-pre-wrap">
                            {text}
                        </div>
                    );
                }
                return (
                    <LazyImage
                        key={`img-${index}`}
                        src={token.src}
                        alt={token.alt}
                        className="w-full rounded-xl border border-white/10 min-h-20"
                        placeholderClassName="rounded-xl"
                    />
                );
            })}
        </div>
    );
}

export function AssistantMessage({
    messageId,
    content,
    onToast,
    onShare,
    onStartThread,
    providerId,
    modelId,
    diffAvailable,
    onOpenDiff,
    stdoutLines,
    stdoutDone,
}) {
    const copyCostTooltip = formatTokenCostTooltip(content, providerId, modelId);

    const emitToast = (message) => {
        if (typeof onToast === 'function') {
            onToast(message);
        }
    };

    const runCopy = async () => {
        try {
            await copyWithMode(content, 'default');
            emitToast(`${copyToastLabel('default')} · ${copyCostTooltip}`);
        } catch {
            emitToast('Copy failed');
        }
    };

    const runShare = async () => {
        if (typeof onShare !== 'function') return;
        await onShare(content);
    };

    return (
        <div
            data-testid="chat-message"
            className="group max-w-[85%] 2xl:max-w-[75%] mr-auto animate-in fade-in slide-in-from-bottom-2 duration-500 relative"
        >
            <div className="flex items-center gap-3 mb-2.5 opacity-30">
                <div className="h-px w-6 bg-slate-400" />
                <div className="text-[8px] uppercase tracking-[0.3em] font-black">
                    Neural_Response
                </div>
            </div>
            <div className="p-6 rounded-2xl text-[14px] leading-relaxed shadow-2xl transition-all duration-300 bg-black/30 border border-white/[0.04] text-slate-300">
                <ReactionBar
                    copyTooltip={copyCostTooltip}
                    onCopy={runCopy}
                    onDiff={onOpenDiff}
                    onShare={runShare}
                    onStartThread={() => {
                        if (typeof onStartThread === 'function') {
                            onStartThread(messageId, content);
                        }
                    }}
                    diffAvailable={diffAvailable}
                />
                {renderMessageBody(content)}
                <StdoutPane lines={stdoutLines} done={stdoutDone} />
            </div>
        </div>
    );
}

export default AssistantMessage;
