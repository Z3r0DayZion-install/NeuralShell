/**
 * Phase 21: Runtime Control Surface Integration & Proof Hardening
 *
 * This suite exercises the actual renderer.js runtime entry path and
 * APB button handlers against real renderer state and a mocked DOM,
 * proving that the UI correctly reflects live state changes.
 */

const assert = require("node:assert/strict");
const { describe, it, beforeEach } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

describe("Phase 21: Runtime Control Surface Integration", () => {
    let context;
    let mockDOM;
    let loggedEvents;

    beforeEach(() => {
        loggedEvents = [];

        // Lightweight DOM mock
        mockDOM = {};
        const createElement = (tag) => {
            const el = {
                tagName: tag,
                className: "",
                textContent: "",
                innerHTML: "",
                style: {},
                classList: {
                    classes: new Set(),
                    add: (c) => el.classList.classes.add(c),
                    remove: (c) => el.classList.classes.delete(c),
                    toggle: (c, state) => {
                        if (state === undefined) {
                            if (el.classList.classes.has(c)) el.classList.classes.delete(c);
                            else el.classList.classes.add(c);
                        } else if (state) el.classList.classes.add(c);
                        else el.classList.classes.delete(c);
                    },
                    contains: (c) => el.classList.classes.has(c)
                },
                children: [],
                appendChild: (child) => el.children.push(child),
                querySelector: () => createElement("div"), // Stub for querySelector
                addEventListener: () => { }, // Stub for event listeners
                options: [], // Stub for select elements
                dataset: {}, // Stub for dataset dataset.tone
                onclick: null,
                onchange: null
            };

            // Getter for className to stringify classList
            Object.defineProperty(el, 'className', {
                get() { return Array.from(el.classList.classes).join(' '); },
                set(v) {
                    el.classList.classes.clear();
                    if (v) v.split(' ').forEach(c => el.classList.classes.add(c));
                }
            });
            return el;
        };

        const documentMock = {
            body: createElement("body"),
            getElementById: (id) => {
                if (!mockDOM[id]) mockDOM[id] = createElement("div");
                mockDOM[id].id = id;
                return mockDOM[id];
            },
            createElement,
            querySelectorAll: () => []
        };

        const windowMock = {
            addEventListener: () => { },
            removeEventListener: () => { },
            api: {
                state: {
                    TRUST_STATES: {
                        VERIFIED: "VERIFIED",
                        DRIFTED: "DRIFTED",
                        MISSING_SECRET: "MISSING_SECRET",
                        OFFLINE_LOCKED: "OFFLINE_LOCKED",
                        INVALID: "INVALID",
                        SIGNATURE_TAMPERED: "SIGNATURE_TAMPERED"
                    },
                    logProfileEvent: (id, type, summary) => {
                        loggedEvents.push({ id, type, summary });
                    },
                    retrieveSecret: () => "secret",
                    calculateProfileFingerprint: (p) => "fingerprint"
                },
                bridge: {
                    test: async () => ({ ok: true })
                },
                settings: {
                    update: async (s) => s,
                    load: async () => context.appInitState.settings
                }
            }
        };

        // Prepare sandbox
        context = vm.createContext({
            document: documentMock,
            window: windowMock,
            console,
            setTimeout,
            clearTimeout,
            setInterval,
            clearInterval,
            fetch: async () => ({ ok: true, json: async () => ({}) }),
            prompt: () => "1",
            alert: () => { },
            // Mock some external dependencies of renderer
            require: () => ({}),
            module: {},
            exports: {},
            bridgeSettingsFeatureCatalog: {
                createBridgeSettingsFeature: () => ({
                    init: () => { },
                    bindEvents: () => { },
                    renderSettings: () => { }
                })
            }
        });

        // We must mock text dependencies like marked/highlight.js if renderer calls them.
        // However, renderer.js is huge. We just evaluate it and override what fails or simply
        // provide stubs for what it tries to access globally.
        context.marked = { parse: (t) => t };
        context.hljs = { highlightElement: () => { } };

        // Load runtime modules
        const modules = [
            "trust-evaluator.js",
            "session-control.js",
            "profile-switcher.js",
            "runtime-governance.js",
            "active-profile-bar.js"
        ];
        for (const mod of modules) {
            const code = fs.readFileSync(path.join(__dirname, "../src/runtime", mod), "utf8");
            vm.runInContext(code, context);
        }

        // Load renderer.js
        let rendererCode = fs.readFileSync(path.join(__dirname, "../src/renderer.js"), "utf8");
        rendererCode += `
      window.test_runtimeResumeGovernance = bootstrapGovernance;
      window.test_performDisconnect = uiPerformDisconnect;
      window.test_performOfflineEntry = uiPerformOfflineEntry;
      window.test_switchActiveProfile = uiSwitchActiveProfile;
      function getBridgeSettingsFeature() {
        return { init: () => {}, bindBridgeSettingsEvents: () => {}, renderSettings: () => {}, syncSettingsInputsFromState: () => {} };
      }
      Object.assign(appState, typeof appInitState !== 'undefined' ? appInitState : {});
    `;

        // Setup appInitState
        context.appInitState = {
            model: "test-model",
            chat: [],
            setupState: "ready",
            settings: {
                onboardingCompleted: true,
                connectOnStartup: true,
                activeProfileId: "prof-1",
                connectionProfiles: [
                    {
                        id: "prof-1", name: "Profile 1", provider: "ollama",
                        trustState: "VERIFIED", lastSuccessTs: "2026-03-20T00:00:00Z",
                        lastVerifiedFingerprint: "fingerprint"
                    },
                    {
                        id: "prof-2", name: "Profile Drift", provider: "ollama",
                        trustState: "VERIFIED", lastVerifiedFingerprint: "wrong" // drifts
                    },
                    {
                        id: "prof-3", name: "Tampered", provider: "ollama",
                        authenticity: "SIGNATURE_TAMPERED"
                    }
                ]
            }
        };

        context.showBanner = () => { };
        context.applySettingsPatch = async (patch) => {
            Object.assign(context.window.appState.settings, patch);
        };
        context.runBridgeAutoDetect = async () => { };
        context.renderOnboardingStep = () => { };

        // We mock checkProfileDrift / showBanner if the full evaluation is too entangled,
        // but the instruction is to test actual renderer state.
        // The evaluation will bind the actual functions to context.
        vm.runInContext(rendererCode, context);
    });

    describe("runtimeResumeGovernance", () => {
        it("should allow auto-resume for VERIFIED + connectOnStartup", () => {
            context.window.test_runtimeResumeGovernance();

            const event = loggedEvents.find(e => e.type === "runtime_resume_allowed");
            assert.ok(event);

            const apb = mockDOM["activeProfileBar"];
            assert.ok(!apb.classList.contains("apb-blocked"));
            assert.ok(apb.classList.contains("hidden") === false);

            const name = mockDOM["apbProfileName"];
            assert.equal(name.textContent, "Profile 1");

            const badge = mockDOM["apbTrustBadge"];
            assert.ok(badge.classList.contains("trust-verified"));
        });

        it("should block auto-resume for DRIFTED", () => {
            context.window.appState.settings.activeProfileId = "prof-2"; // Will evaluate to DRIFTED
            context.window.test_runtimeResumeGovernance();

            const event = loggedEvents.find(e => e.type === "runtime_resume_blocked");
            assert.ok(event);

            const apb = mockDOM["activeProfileBar"];
            assert.ok(apb.classList.contains("apb-blocked"));
        });
    });

    describe("performDisconnect", () => {
        it("should clear session state, update UI, and log disconnection", () => {
            context.window.appState.chat = [{ role: 'user', content: 'hello' }];
            context.window.test_performDisconnect();

            assert.equal(context.window.appState.chat.length, 0);
            assert.equal(context.window.appState.model, null);

            const status = mockDOM["globalBridgeStatusText"];
            assert.equal(status.textContent, "Disconnected");

            const event = loggedEvents.find(e => e.type === "session_disconnected");
            assert.ok(event);
        });
    });

    describe("performOfflineEntry", () => {
        it("should enforce offline hardening via runtime entry", () => {
            context.window.test_performOfflineEntry();

            const event = loggedEvents.find(e => e.type === "offline_entry");
            assert.ok(event);

            // check state mutation
            const activeProf = context.window.getActiveProfile();
            assert.equal(activeProf.trustState, "OFFLINE_LOCKED");

            const apb = mockDOM["activeProfileBar"];
            assert.ok(apb.classList.contains("apb-offline"));

            const cb = mockDOM["offlineModeInput"];
            assert.equal(cb.checked, true);
        });
    });

    describe("switchActiveProfile", () => {
        it("should block activation of SIGNATURE_TAMPERED profiles", async () => {
            await context.window.test_switchActiveProfile("prof-3");

            const event = loggedEvents.find(e => e.type === "runtime_resume_blocked");
            assert.ok(event);
            assert.ok(event.summary.includes("SIGNATURE_TAMPERED"));

            // Should remain prof-1
            assert.equal(context.window.appState.settings.activeProfileId, "prof-1");
        });

        it("should apply switch and render governing state if allowed", async () => {
            await context.window.test_switchActiveProfile("prof-2");

            const event = loggedEvents.find(e => e.type === "profile_switch");
            assert.ok(event);

            assert.equal(context.window.appState.settings.activeProfileId, "prof-2");

            // Profile 2 evaluates to DRIFTED
            const apb = mockDOM["activeProfileBar"];
            assert.ok(apb.classList.contains("apb-blocked"));
        });
    });
});
