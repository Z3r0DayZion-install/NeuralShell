/**
 * NeuralEngine.js — XR Intelligence Core v2 (React Adaption)
 * Ported from Archives/NeuralTube/frontend/src/lib/NeuralEngine.js
 */
import StateManager from './stateManager';

const XP_STATE_KEY = 'nt_xp_state';
const ACHIEVEMENTS_KEY = 'nt_achievements';
const LEAN_HISTORY_KEY = 'nt_lean_history';

const XP_THRESHOLDS = [0, 200, 600, 1200, 2500, 5000, 10000, 20000, 50000];
const TIER_NAMES = ['INITIATE', 'OPERATOR', 'ANALYST', 'EXECUTOR', 'WARLORD', 'EXECUTIONER', 'APEX', 'GOD_MODE', 'PHASE_24_MUTANT'];

const RITUALS = {
    ignite: { color: '255,0,80', label: 'RITUAL: IGNITE', xp: 15, desc: 'Narrative ignition protocol engaged.' },
    freeze: { color: '0,200,255', label: 'RITUAL: FREEZE', xp: 10, desc: 'Signal freeze executed. Pattern locked.' },
    shadow: { color: '120,0,255', label: 'RITUAL: SHADOW', xp: 12, desc: 'Ghost protocol activated.' },
    mutate: { color: '255,215,0', label: 'MUTATION_TRIGGERED', xp: 8, desc: 'Feed mutation cascade initiated.' },
    detonate: { color: '255,60,0', label: 'DETONATION_SEQUENCE', xp: 50, desc: 'Full signal detonation. Maximum XP awarded.' },
    purge: { color: '200,0,200', label: 'PURGE_PROTOCOL', xp: 20, desc: 'Purge directive sent. Feed reset.' },
    apex: { color: '255,255,255', label: 'APEX_UNLOCKED', xp: 100, desc: 'APEX form achieved. You are the algorithm.' },
    void: { color: '0,0,0', label: 'VOID_CHANNEL', xp: 5, desc: 'Null signal processed.' },
};

export async function getXPState() {
    const fresh = {
        xp: 0,
        tier: 1,
        fatigue: 0,
        decayPaused: false,
        godMode: false,
        momentum: { streak: 0, lastInteraction: 0 }
    };
    const s = await StateManager.get(XP_STATE_KEY, fresh);
    return s;
}

export async function saveXPState(s) {
    await StateManager.set(XP_STATE_KEY, s);
}

export function getTierName(tier) {
    return TIER_NAMES[Math.min(tier - 1, TIER_NAMES.length - 1)] || 'INITIATE';
}

export function calcTier(xp) {
    for (let i = XP_THRESHOLDS.length - 1; i >= 0; i--) {
        if (xp >= XP_THRESHOLDS[i]) return i + 1;
    }
    return 1;
}

export async function gainXP(rawAmount) {
    const s = await getXPState();
    const now = Date.now();

    // Simple momentum
    if (now - (s.momentum?.lastInteraction || 0) < 300000) {
        s.momentum.streak += 1;
    } else {
        s.momentum = { streak: 1, lastInteraction: now };
    }
    s.momentum.lastInteraction = now;

    const gained = Math.max(1, Math.round(rawAmount * (1 + s.momentum.streak * 0.05)));
    s.xp += gained;
    s.tier = calcTier(s.xp);
    await saveXPState(s);

    return {
        xp: s.xp,
        tier: s.tier,
        tierName: getTierName(s.tier),
        gained,
        streak: s.momentum.streak
    };
}

export function getRituals() { return RITUALS; }

export async function dispatchRitual(command) {
    if (!command) return null;
    const cmd = command.toLowerCase().trim();
    const key = Object.keys(RITUALS).find(k => cmd.includes(k));
    if (!key) return null;

    const ritual = RITUALS[key];
    const xpResult = await gainXP(ritual.xp);

    // Notify Main Process of Ritual (for backend side effects if any)
    try {
        await window.api.ritual.execute(key);
    } catch (e) { /* ignore if not implemented yet */ }

    return { ritualKey: key, ritual, xpResult };
}

export async function getAchievements() {
    return await StateManager.get(ACHIEVEMENTS_KEY, []);
}
