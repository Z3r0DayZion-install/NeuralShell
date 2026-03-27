import React from 'react';
import trainingTracks from '../config/training_tracks.json';
import { downloadJson, readTextFile, toSafeNumber } from '../utils/recordIO.js';
import {
    fingerprintPublicKey,
    getOrCreateSigningKeyPair,
    signArtifactPayload,
    verifyArtifactSignature,
} from '../utils/signedArtifacts.js';

const STORAGE_KEY = 'neuralshell_certification_center_v1';

function loadProgress() {
    if (typeof window === 'undefined' || !window.localStorage) return {};
    try {
        return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}') || {};
    } catch {
        return {};
    }
}

function normalizeTrack(track = {}) {
    const payload = track && typeof track === 'object' ? track : {};
    return {
        id: String(payload.id || '').trim(),
        title: String(payload.title || 'Untitled Track').trim(),
        description: String(payload.description || '').trim(),
        passScore: Math.max(1, Math.min(100, toSafeNumber(payload.passScore, 80))),
        questions: Array.isArray(payload.questions) ? payload.questions.map((question) => ({
            id: String(question && question.id ? question.id : `${payload.id || 'q'}_${Math.random().toString(36).slice(2, 6)}`),
            prompt: String(question && question.prompt ? question.prompt : 'Question'),
            options: Array.isArray(question && question.options) ? question.options.map((option) => String(option || '')) : [],
            answerIndex: Math.max(0, toSafeNumber(question && question.answerIndex, 0)),
        })) : [],
    };
}

function scoreTrack(track, answers) {
    const questions = Array.isArray(track && track.questions) ? track.questions : [];
    if (!questions.length) return { score: 0, correct: 0, total: 0 };
    const correct = questions.reduce((sum, question) => {
        const answer = toSafeNumber(answers[question.id], -1);
        return sum + (answer === toSafeNumber(question.answerIndex, -2) ? 1 : 0);
    }, 0);
    const total = questions.length;
    const score = Math.round((correct / total) * 100);
    return { score, correct, total };
}

export default function CertificationCenter() {
    const tracks = React.useMemo(() => (
        (Array.isArray(trainingTracks) ? trainingTracks : []).map((track) => normalizeTrack(track))
    ), []);
    const [activeTrackId, setActiveTrackId] = React.useState(() => (tracks[0] ? tracks[0].id : ''));
    const [answersByTrack, setAnswersByTrack] = React.useState(() => loadProgress());
    const [certificateStatus, setCertificateStatus] = React.useState('');
    const [error, setError] = React.useState('');
    const [verifyResult, setVerifyResult] = React.useState('');

    React.useEffect(() => {
        if (typeof window === 'undefined' || !window.localStorage) return;
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(answersByTrack));
    }, [answersByTrack]);

    const activeTrack = React.useMemo(
        () => tracks.find((track) => track.id === activeTrackId) || tracks[0] || null,
        [activeTrackId, tracks],
    );

    const activeAnswers = React.useMemo(
        () => (activeTrack ? (answersByTrack[activeTrack.id] || {}) : {}),
        [activeTrack, answersByTrack],
    );

    const grading = React.useMemo(
        () => (activeTrack ? scoreTrack(activeTrack, activeAnswers) : { score: 0, correct: 0, total: 0 }),
        [activeTrack, activeAnswers],
    );

    const updateAnswer = (questionId, answerIndex) => {
        if (!activeTrack) return;
        setAnswersByTrack((prev) => ({
            ...prev,
            [activeTrack.id]: {
                ...(prev[activeTrack.id] || {}),
                [questionId]: answerIndex,
            },
        }));
    };

    const issueCertificate = async () => {
        if (!activeTrack) return;
        try {
            const nextGrade = scoreTrack(activeTrack, activeAnswers);
            if (nextGrade.score < activeTrack.passScore) {
                setError(`Passing score is ${activeTrack.passScore}%. Current score: ${nextGrade.score}%.`);
                return;
            }
            const keypair = await getOrCreateSigningKeyPair('neuralshell_cert_signing_v1');
            const payload = {
                schema: 'neuralshell_certificate_v1',
                issuedAt: new Date().toISOString(),
                certificateId: `cert-${activeTrack.id}-${Date.now()}`,
                trackId: activeTrack.id,
                trackTitle: activeTrack.title,
                score: nextGrade.score,
                correct: nextGrade.correct,
                total: nextGrade.total,
                issuer: 'NeuralShell Certification Center',
            };
            const signature = await signArtifactPayload(payload, keypair.privateKeyPem);
            const signerFingerprint = await fingerprintPublicKey(keypair.publicKeyPem);
            const certificate = {
                payload,
                signature,
                signer: {
                    algorithm: 'ECDSA_P256_SHA256',
                    publicKeyPem: keypair.publicKeyPem,
                    fingerprint: signerFingerprint,
                },
            };
            downloadJson(`neuralshell_certificate_${activeTrack.id}_${Date.now()}.json`, certificate);
            setCertificateStatus(`Certificate issued (${payload.certificateId}) with signature ${signerFingerprint.slice(0, 22)}...`);
            setError('');
        } catch (err) {
            setError(err && err.message ? err.message : String(err));
        }
    };

    const verifyCertificateImport = async (event) => {
        const file = event && event.target && event.target.files ? event.target.files[0] : null;
        if (!file) return;
        try {
            const text = await readTextFile(file);
            const parsed = JSON.parse(String(text || '{}'));
            const payload = parsed && typeof parsed === 'object' ? parsed.payload : null;
            const signature = parsed && typeof parsed === 'object' ? String(parsed.signature || '') : '';
            const publicKeyPem = parsed && parsed.signer && typeof parsed.signer === 'object'
                ? String(parsed.signer.publicKeyPem || '')
                : '';
            if (!payload || !signature || !publicKeyPem) {
                throw new Error('Certificate file missing payload/signature/public key.');
            }
            const verified = await verifyArtifactSignature(payload, signature, publicKeyPem);
            const fingerprint = await fingerprintPublicKey(publicKeyPem);
            setVerifyResult(verified
                ? `Verified certificate ${payload.certificateId || ''} (${fingerprint.slice(0, 28)}...)`
                : 'Certificate signature check failed.');
            setError('');
        } catch (err) {
            setVerifyResult('');
            setError(err && err.message ? err.message : String(err));
        }
    };

    return (
        <section data-testid="certification-center" className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
                <div>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300 font-bold">Certification Center</div>
                    <div className="text-[10px] text-slate-500 font-mono">Local training modules with quiz scoring and signed certificate exports.</div>
                </div>
                <label className="px-2 py-1 rounded border border-white/15 bg-white/5 text-[9px] uppercase tracking-[0.12em] font-mono text-slate-200 cursor-pointer">
                    Verify Certificate
                    <input
                        type="file"
                        accept=".json,application/json"
                        className="hidden"
                        data-testid="certification-verify-input"
                        onChange={verifyCertificateImport}
                    />
                </label>
            </div>

            <div className="flex flex-wrap gap-2">
                {tracks.map((track) => (
                    <button
                        key={track.id}
                        type="button"
                        data-testid={`certification-track-${track.id}`}
                        onClick={() => setActiveTrackId(track.id)}
                        className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-mono uppercase tracking-[0.12em] ${
                            activeTrack && activeTrack.id === track.id
                                ? 'border-cyan-300/40 bg-cyan-500/20 text-cyan-100'
                                : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                        }`}
                    >
                        {track.title}
                    </button>
                ))}
            </div>

            {activeTrack && (
                <div className="rounded-lg border border-white/10 bg-black/30 p-3 space-y-3">
                    <div>
                        <div className="text-[11px] font-bold text-slate-100">{activeTrack.title}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{activeTrack.description}</div>
                    </div>
                    <div className="space-y-2">
                        {activeTrack.questions.map((question, index) => (
                            <div key={question.id} className="rounded-lg border border-white/10 bg-black/20 p-2">
                                <div className="text-[10px] text-slate-200 mb-1">
                                    {index + 1}. {question.prompt}
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {question.options.map((option, optionIndex) => (
                                        <button
                                            key={`${question.id}-${optionIndex}`}
                                            type="button"
                                            onClick={() => updateAnswer(question.id, optionIndex)}
                                            className={`px-2 py-1 rounded border text-[9px] font-mono ${
                                                toSafeNumber(activeAnswers[question.id], -1) === optionIndex
                                                    ? 'border-cyan-300/40 bg-cyan-500/20 text-cyan-100'
                                                    : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                                            }`}
                                        >
                                            {option}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                        <div className="text-[10px] font-mono text-slate-300">
                            Score {grading.score}% ({grading.correct}/{grading.total}) · Pass {activeTrack.passScore}%
                        </div>
                        <button
                            type="button"
                            data-testid="certification-issue-certificate-btn"
                            onClick={issueCertificate}
                            className="px-3 py-1.5 rounded border border-emerald-300/30 bg-emerald-500/10 text-[10px] uppercase tracking-[0.12em] font-mono text-emerald-100"
                        >
                            Issue Certificate
                        </button>
                    </div>
                </div>
            )}

            {certificateStatus && (
                <div className="rounded-lg border border-emerald-300/30 bg-emerald-500/10 px-3 py-2 text-[10px] text-emerald-100 font-mono">
                    {certificateStatus}
                </div>
            )}
            {verifyResult && (
                <div className="rounded-lg border border-cyan-300/30 bg-cyan-500/10 px-3 py-2 text-[10px] text-cyan-100 font-mono">
                    {verifyResult}
                </div>
            )}
            {error && (
                <div className="rounded-lg border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-[10px] text-rose-200 font-mono">
                    {error}
                </div>
            )}
        </section>
    );
}

