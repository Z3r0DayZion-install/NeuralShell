import React from 'react';

const MAX_LATENCY_MS = 2500;

function clampLatency(value: number): number {
    const safe = Number.isFinite(Number(value)) ? Number(value) : MAX_LATENCY_MS;
    return Math.max(0, Math.min(MAX_LATENCY_MS, Math.round(safe)));
}

export function useLatencyHistory(options: { windowMs?: number; pollMs?: number } = {}) {
    const windowMs = Number(options.windowMs || 5000);
    const pollMs = Number(options.pollMs || 1000);
    const [samples, setSamples] = React.useState<Array<{ at: number; ms: number; ok: boolean; reason: string }>>([]);

    React.useEffect(() => {
        let active = true;
        let timer: ReturnType<typeof setTimeout> | null = null;

        const tick = async () => {
            const started = typeof performance !== 'undefined' ? performance.now() : Date.now();
            let ok = false;
            let reason = 'api_unavailable';
            let latencyMs = MAX_LATENCY_MS;

            try {
                if (window.api && window.api.llm && typeof window.api.llm.ping === 'function') {
                    const pingResult = await window.api.llm.ping();
                    ok = Boolean(pingResult);
                    reason = ok ? 'ok' : 'ping_false';
                    const ended = typeof performance !== 'undefined' ? performance.now() : Date.now();
                    latencyMs = clampLatency(ended - started);
                }
            } catch (err) {
                reason = err && err.message ? String(err.message) : 'ping_failed';
                const ended = typeof performance !== 'undefined' ? performance.now() : Date.now();
                latencyMs = clampLatency(ended - started);
            }

            if (!active) return;

            setSamples((prev) => {
                const now = Date.now();
                const merged = [
                    ...prev,
                    {
                        at: now,
                        ms: latencyMs,
                        ok,
                        reason,
                    },
                ].filter((entry) => now - entry.at <= windowMs);

                const maxEntries = Math.max(5, Math.ceil(windowMs / Math.max(200, pollMs)) + 2);
                return merged.slice(-maxEntries);
            });

            timer = setTimeout(tick, pollMs);
        };

        tick();
        return () => {
            active = false;
            if (timer) {
                clearTimeout(timer);
            }
        };
    }, [pollMs, windowMs]);

    const lastSample = samples.length ? samples[samples.length - 1] : null;
    const latencyMs = lastSample ? lastSample.ms : 0;
    const avgLatencyMs = samples.length
        ? Math.round(samples.reduce((sum, sample) => sum + sample.ms, 0) / samples.length)
        : 0;
    const online = lastSample ? lastSample.ok : false;

    return {
        samples,
        latencyMs,
        avgLatencyMs,
        online,
        lastReason: lastSample ? lastSample.reason : 'not_checked',
    };
}

export default useLatencyHistory;
