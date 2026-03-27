import React from 'react';
import { computeMedianRtt } from '../utils/voiceStats.js';

type VoiceStatsOptions = {
    enabled?: boolean;
    pollMs?: number;
    getPeerConnection?: () => any;
};

function extractRttsFromStats(report: any): number[] {
    const values: number[] = [];
    if (!report || typeof report.forEach !== 'function') {
        return values;
    }
    report.forEach((stat: any) => {
        if (!stat || typeof stat !== 'object') return;

        // WebRTC stats express RTT in seconds; convert to milliseconds.
        if (typeof stat.currentRoundTripTime === 'number' && Number.isFinite(stat.currentRoundTripTime)) {
            values.push(stat.currentRoundTripTime * 1000);
        } else if (typeof stat.roundTripTime === 'number' && Number.isFinite(stat.roundTripTime)) {
            values.push(stat.roundTripTime * 1000);
        }
    });
    return values;
}

export function useVoiceStats(options: VoiceStatsOptions = {}) {
    const enabled = Boolean(options.enabled);
    const pollMs = Math.max(5000, Number(options.pollMs || 5000));
    const getPeerConnection = typeof options.getPeerConnection === 'function'
        ? options.getPeerConnection
        : () => null;
    const [samples, setSamples] = React.useState<number[]>([]);

    React.useEffect(() => {
        if (!enabled) {
            setSamples([]);
            return undefined;
        }

        let active = true;
        let timer: ReturnType<typeof setTimeout> | null = null;

        const tick = async () => {
            try {
                const peer = getPeerConnection();
                if (peer && typeof peer.getStats === 'function') {
                    const report = await peer.getStats();
                    const values = extractRttsFromStats(report);
                    if (active && values.length) {
                        setSamples((prev) => [...prev, ...values].slice(-30));
                    }
                }
            } catch {
                // Keep the previous median on transient stats read failures.
            }
            if (!active) return;
            timer = setTimeout(tick, pollMs);
        };

        tick();
        return () => {
            active = false;
            if (timer) {
                clearTimeout(timer);
            }
        };
    }, [enabled, getPeerConnection, pollMs]);

    const medianRttMs = React.useMemo(() => computeMedianRtt(samples), [samples]);

    return {
        medianRttMs,
        sampleCount: samples.length,
    };
}

export default useVoiceStats;
