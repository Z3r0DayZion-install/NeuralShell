import React from 'react';
import { decryptEnvelopeObject, decodeShareEnvelope, loadStaticShareEnvelope } from '../../utils/share.ts';

function normalizeMessages(payload) {
    if (!payload) return [];
    if (Array.isArray(payload.messages)) {
        return payload.messages.map((entry) => ({
            role: String(entry && entry.role ? entry.role : 'assistant'),
            content: String(entry && entry.content ? entry.content : ''),
        }));
    }
    if (payload.content) {
        return [
            {
                role: 'assistant',
                content: String(payload.content),
            },
        ];
    }
    return [];
}

export function ShareRoutePage({ hash }) {
    const [status, setStatus] = React.useState('loading');
    const [error, setError] = React.useState('');
    const [payload, setPayload] = React.useState(null);

    React.useEffect(() => {
        let active = true;
        const load = async () => {
            try {
                const fragment = String(window.location.hash || '').replace(/^#/, '').trim();
                let decoded = null;
                if (fragment) {
                    decoded = await decodeShareEnvelope(fragment);
                } else {
                    const envelope = await loadStaticShareEnvelope(hash);
                    decoded = await decryptEnvelopeObject(envelope);
                }
                if (!active) return;
                setPayload(decoded);
                setStatus('ready');
            } catch (err) {
                if (!active) return;
                setError(err && err.message ? String(err.message) : 'Unable to load share payload.');
                setStatus('error');
            }
        };
        load();
        return () => {
            active = false;
        };
    }, [hash]);

    const messages = normalizeMessages(payload);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 px-6 py-10">
            <div className="max-w-3xl mx-auto">
                <div className="mb-6">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-400/70 font-bold">NeuralShell Share</div>
                    <h1 className="text-2xl font-bold tracking-tight mt-1">Read-Only Conversation</h1>
                    <div className="text-[11px] font-mono text-slate-400 mt-1">/share/{hash}</div>
                </div>

                {status === 'loading' && (
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-5 text-[12px] font-mono text-slate-300">
                        Decrypting shared payload...
                    </div>
                )}

                {status === 'error' && (
                    <div className="rounded-2xl border border-rose-300/30 bg-rose-500/10 p-5 text-[12px] font-mono text-rose-200">
                        {error || 'Failed to load shared conversation.'}
                    </div>
                )}

                {status === 'ready' && (
                    <div className="space-y-4">
                        {messages.length === 0 && (
                            <div className="rounded-2xl border border-white/10 bg-black/30 p-5 text-[12px] font-mono text-slate-300">
                                Share payload is valid but empty.
                            </div>
                        )}
                        {messages.map((entry, index) => (
                            <div
                                key={`${entry.role}-${index}`}
                                className={`rounded-2xl border p-4 text-[13px] leading-relaxed whitespace-pre-wrap ${
                                    entry.role === 'user'
                                        ? 'border-cyan-300/30 bg-cyan-500/10 text-cyan-50 ml-10'
                                        : 'border-white/10 bg-black/35 text-slate-200 mr-10'
                                }`}
                            >
                                <div className="text-[9px] uppercase tracking-[0.2em] text-slate-500 mb-2">
                                    {entry.role}
                                </div>
                                {entry.content}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ShareRoutePage;
