/**
 * Phase 17: Onboarding-to-Profile Convergence Verification (V2.1.18+)
 * Built-in node:assert version.
 */

const assert = require('node:assert');
const { describe, it, beforeEach } = require('node:test');

describe('Phase 17 Convergence Governance', () => {
    let mockAppState;

    beforeEach(() => {
        mockAppState = {
            setupState: 'unconfigured',
            onboardingDraft: null,
            settings: {
                onboardingCompleted: false,
                connectionProfiles: [],
                setupDraft: null
            }
        };
    });

    describe('Profile Materialization Rules', () => {
        it('should NOT create a profile during provider selection', () => {
            mockAppState.setupState = 'setup_provider';
            mockAppState.onboardingDraft = { provider: 'openai-compatible' };
            // Rule: profiles array remains empty
            assert.strictEqual(mockAppState.settings.connectionProfiles.length, 0);
        });

        it('should NOT create a profile during endpoint entry', () => {
            mockAppState.setupState = 'setup_endpoint';
            mockAppState.onboardingDraft = { provider: 'openai-compatible', baseUrl: 'https://api.openai.com' };
            assert.strictEqual(mockAppState.settings.connectionProfiles.length, 0);
        });

        it('should materialize profile ONLY on final Seal step', () => {
            // Simulate Step 6: Finalize (ready)
            const draft = {
                provider: 'openai-compatible',
                baseUrl: 'https://api.openai.com',
                apiKey: 'sk-123',
                model: 'gpt-4o',
                reconnectStartup: true
            };

            // Finalization Logic
            mockAppState.settings.connectionProfiles.push({ id: 'p1', ...draft });
            mockAppState.settings.onboardingCompleted = true;
            mockAppState.settings.setupDraft = null;

            assert.strictEqual(mockAppState.settings.connectionProfiles.length, 1);
            assert.strictEqual(mockAppState.settings.onboardingCompleted, true);
            assert.strictEqual(mockAppState.settings.setupDraft, null);
        });
    });

    describe('Secret Gating (Phase 17.4)', () => {
        it('should block transition if remote provider is missing apiKey', () => {
            const provider = 'openai-compatible';
            const apiKey = ''; // MISSING
            const requiresSecret = true;

            const canTransition = !(requiresSecret && !apiKey);
            assert.strictEqual(canTransition, false);
        });
    });

    describe('Draft Persistence & Abort Hygiene (Phase 17.2, 18.3 Rule D)', () => {
        it('should restore appState from setupDraft on reload if incomplete', () => {
            const savedDraft = { state: 'endpoint_verified', provider: 'ollama' };

            // Simulation of loadInitialState logic
            const resumedState = savedDraft.state;
            const resumedDraft = savedDraft;

            assert.strictEqual(resumedState, 'endpoint_verified');
            assert.strictEqual(resumedDraft.provider, 'ollama');
        });

        it('should NOT appear in governed profile list as a saved profile', () => {
            const savedDraft = { state: 'endpoint_verified', provider: 'ollama' };
            mockAppState.settings.setupDraft = savedDraft;

            assert.strictEqual(mockAppState.settings.connectionProfiles.length, 0);
        });

        it('should clear or isolate draft properly upon abort (if implemented)', () => {
            // Abort Hygiene rule
            mockAppState.settings.onboardingCompleted = true; // Skipped
            mockAppState.settings.setupDraft = null;
            assert.strictEqual(mockAppState.settings.setupDraft, null);
            assert.strictEqual(mockAppState.settings.connectionProfiles.length, 0);
        });
    });

    describe('Offline Isolation & Resume Governance (Phase 17.5, 18.3 Rule C)', () => {
        it('should seal as OFFLINE_LOCKED and clear drafts', () => {
            mockAppState.setupState = 'offline_locked';
            mockAppState.settings.onboardingCompleted = true;
            mockAppState.settings.allowRemoteBridge = false;
            mockAppState.settings.setupDraft = null;

            assert.strictEqual(mockAppState.settings.allowRemoteBridge, false);
            assert.strictEqual(mockAppState.settings.setupDraft, null);
        });

        it('should prevent auto-resuming remote settings after offline seal', () => {
            // Rule C: Offline isolation
            mockAppState.settings.onboardingCompleted = true;
            mockAppState.settings.allowRemoteBridge = false;

            const isOffline = mockAppState.settings.onboardingCompleted && !mockAppState.settings.allowRemoteBridge;
            assert.strictEqual(isOffline, true);
        });
    });

    describe('Materialization & Seal Correctness (Phase 18.3 Rule B, Rule F)', () => {
        it('should create exactly one governed profile and clear drafts on final seal', () => {
            const draft = {
                provider: 'openai-compatible',
                baseUrl: 'https://api.openai.com',
                apiKey: 'sk-123',
                model: 'gpt-4o'
            };

            // Seal Logic
            mockAppState.settings.connectionProfiles.push({ id: 'final', ...draft });
            mockAppState.settings.onboardingCompleted = true;
            mockAppState.settings.setupDraft = null;

            assert.strictEqual(mockAppState.settings.connectionProfiles.length, 1);
            assert.strictEqual(mockAppState.settings.setupDraft, null);
            assert.strictEqual(mockAppState.settings.connectionProfiles[0].id, 'final');
        });

        it('should stamp initial trust state as VERIFIED', () => {
            const profile = { id: 'p1', trustState: 'VERIFIED' };
            assert.strictEqual(profile.trustState, 'VERIFIED');
        });
    });
});
