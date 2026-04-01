import React from 'react';
import { useVoiceStats } from '../hooks/useVoiceStats.ts';
import * as voiceStatsUtils from '../utils/voiceStats.js';

const { classifyVoiceRtt } = voiceStatsUtils;

function safePayload(eventRecord) {
    return eventRecord && eventRecord.payload && typeof eventRecord.payload === 'object'
        ? eventRecord.payload
        : {};
}

export default function VoicePanel({ collab }) {
    const [joined, setJoined] = React.useState(false);
    const [status, setStatus] = React.useState('idle');
    const [remotePeerId, setRemotePeerId] = React.useState('');
    const [pttActive, setPttActive] = React.useState(false);

    const audioRef = React.useRef(null);
    const localStreamRef = React.useRef(null);
    const pcRef = React.useRef(null);
    const voiceStats = useVoiceStats({
        enabled: joined && status === 'connected',
        pollMs: 5000,
        getPeerConnection: () => pcRef.current,
    });
    const rttTier = classifyVoiceRtt(voiceStats.medianRttMs);

    const publishSignal = React.useCallback((type, payload = {}) => {
        if (!(collab && typeof collab.publish === 'function')) return;
        collab.publish('voice-signal', {
            type,
            toPeerId: String(payload.toPeerId || ''),
            fromPeerId: String(collab.peerId || ''),
            sdp: payload.sdp || null,
            candidate: payload.candidate || null,
        });
    }, [collab]);

    const PeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection;
    const SessionDescription = window.RTCSessionDescription || window.webkitRTCSessionDescription;
    const IceCandidate = window.RTCIceCandidate || window.webkitRTCIceCandidate;

    const ensurePeerConnection = React.useCallback(() => {
        if (pcRef.current) return pcRef.current;
        if (!PeerConnection) {
            throw new Error('WebRTC is unavailable in this runtime.');
        }
        const pc = new PeerConnection();
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                publishSignal('candidate', {
                    toPeerId: remotePeerId,
                    candidate: event.candidate,
                });
            }
        };
        pc.ontrack = (event) => {
            if (audioRef.current) {
                audioRef.current.srcObject = event.streams[0];
            }
        };
        pcRef.current = pc;
        return pc;
    }, [PeerConnection, publishSignal, remotePeerId]);

    const leaveVoice = React.useCallback(() => {
        if (pcRef.current) {
            pcRef.current.close();
            pcRef.current = null;
        }
        if (localStreamRef.current) {
            for (const track of localStreamRef.current.getTracks()) {
                track.stop();
            }
            localStreamRef.current = null;
        }
        if (audioRef.current) {
            audioRef.current.srcObject = null;
        }
        setJoined(false);
        setRemotePeerId('');
        setStatus('idle');
    }, []);

    const joinVoice = React.useCallback(async () => {
        try {
            const localStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    channelCount: 1,
                },
            });
            localStreamRef.current = localStream;
            const pc = ensurePeerConnection();
            for (const track of localStream.getTracks()) {
                track.enabled = false;
                pc.addTrack(track, localStream);
            }
            setJoined(true);
            setStatus('waiting');
            publishSignal('hello', { toPeerId: '' });
        } catch (err) {
            setStatus(`join_failed:${err && err.message ? err.message : String(err)}`);
        }
    }, [ensurePeerConnection, publishSignal]);

    React.useEffect(() => {
        if (!joined || !localStreamRef.current) return;
        const enableTracks = (enabled) => {
            for (const track of localStreamRef.current.getAudioTracks()) {
                track.enabled = enabled;
            }
        };
        enableTracks(Boolean(pttActive));
    }, [joined, pttActive]);

    React.useEffect(() => {
        const onKeyDown = (event) => {
            if (event.code === 'Space' && joined) {
                setPttActive(true);
            }
        };
        const onKeyUp = (event) => {
            if (event.code === 'Space' && joined) {
                setPttActive(false);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        return () => {
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
        };
    }, [joined]);

    React.useEffect(() => {
        const eventRecord = collab && collab.lastEvent ? collab.lastEvent : null;
        if (!eventRecord || eventRecord.eventType !== 'voice-signal') return;
        const payload = safePayload(eventRecord);
        const fromPeerId = String(payload.fromPeerId || eventRecord.fromPeerId || '');
        if (!fromPeerId || fromPeerId === String(collab && collab.peerId || '')) return;
        const toPeerId = String(payload.toPeerId || '');
        if (toPeerId && toPeerId !== String(collab && collab.peerId || '')) return;
        const signalType = String(payload.type || '');

        const run = async () => {
            try {
                const pc = ensurePeerConnection();
                if (signalType === 'hello') {
                    if (!joined) return;
                    setRemotePeerId(fromPeerId);
                    if (String(collab && collab.peerId || '') < fromPeerId) {
                        const offer = await pc.createOffer();
                        await pc.setLocalDescription(offer);
                        publishSignal('offer', {
                            toPeerId: fromPeerId,
                            sdp: offer,
                        });
                        setStatus('offer_sent');
                    }
                    return;
                }
                if (signalType === 'offer') {
                    if (!joined) return;
                    setRemotePeerId(fromPeerId);
                    await pc.setRemoteDescription(new SessionDescription(payload.sdp));
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    publishSignal('answer', {
                        toPeerId: fromPeerId,
                        sdp: answer,
                    });
                    setStatus('answer_sent');
                    return;
                }
                if (signalType === 'answer') {
                    await pc.setRemoteDescription(new SessionDescription(payload.sdp));
                    setStatus('connected');
                    return;
                }
                if (signalType === 'candidate' && payload.candidate) {
                    await pc.addIceCandidate(new IceCandidate(payload.candidate));
                }
            } catch (err) {
                setStatus(`voice_error:${err && err.message ? err.message : String(err)}`);
            }
        };
        run();
    }, [IceCandidate, SessionDescription, collab, ensurePeerConnection, joined, publishSignal]);

    React.useEffect(() => () => leaveVoice(), [leaveVoice]);

    return (
        <section data-testid="voice-panel" className="rounded-xl border border-white/10 bg-black/30 p-3 space-y-2">
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-[10px] uppercase tracking-[0.14em] font-bold text-fuchsia-300">Voice Room</div>
                    <div className="text-[10px] text-slate-500 font-mono">DTLS-SRTP via WebRTC · Push-to-talk Space</div>
                </div>
                <div
                    data-testid="voice-rtt-badge"
                    className={`px-2 py-1 rounded border text-[9px] font-mono uppercase tracking-[0.14em] ${
                        rttTier === 'green'
                            ? 'border-emerald-300/30 bg-emerald-500/10 text-emerald-200'
                            : rttTier === 'amber'
                                ? 'border-amber-300/40 bg-amber-500/10 text-amber-200'
                                : rttTier === 'red'
                                    ? 'border-rose-300/40 bg-rose-500/10 text-rose-200'
                                    : 'border-slate-300/20 bg-slate-500/10 text-slate-300'
                    }`}
                    title="Median voice round-trip time, refreshed every 5 seconds."
                >
                    {Number.isFinite(Number(voiceStats.medianRttMs))
                        ? `RTT ${Math.round(Number(voiceStats.medianRttMs))}ms`
                        : 'RTT --'}
                </div>
                <button
                    type="button"
                    data-testid="voice-toggle-btn"
                    onClick={() => (joined ? leaveVoice() : joinVoice())}
                    className={`px-2 py-1 rounded border text-[9px] font-mono uppercase tracking-[0.14em] ${
                        joined
                            ? 'border-rose-300/30 bg-rose-500/10 text-rose-200'
                            : 'border-fuchsia-300/30 bg-fuchsia-500/10 text-fuchsia-200'
                    }`}
                >
                    {joined ? 'Leave' : 'Join'}
                </button>
            </div>
            <div className="text-[10px] font-mono text-slate-300">
                {joined ? `Status: ${status} · remote=${remotePeerId || 'none'} · PTT=${pttActive ? 'on' : 'off'}` : 'Voice idle.'}
            </div>
            <audio ref={audioRef} autoPlay playsInline />
        </section>
    );
}
