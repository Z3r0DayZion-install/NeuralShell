function toNumber(value) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
}

function computeMedianRtt(values) {
    const safe = Array.isArray(values)
        ? values
            .map((value) => toNumber(value))
            .filter((value) => Number.isFinite(value) && value >= 0)
            .sort((a, b) => a - b)
        : [];
    if (!safe.length) return null;
    const mid = Math.floor(safe.length / 2);
    if (safe.length % 2 === 0) {
        return Number(((safe[mid - 1] + safe[mid]) / 2).toFixed(1));
    }
    return Number(safe[mid].toFixed(1));
}

function classifyVoiceRtt(ms) {
    if (ms == null || ms === '') return 'neutral';
    if (!Number.isFinite(Number(ms)) || Number(ms) < 0) return 'neutral';
    if (Number(ms) < 150) return 'green';
    if (Number(ms) <= 250) return 'amber';
    return 'red';
}

export {
    computeMedianRtt,
    classifyVoiceRtt,
};
