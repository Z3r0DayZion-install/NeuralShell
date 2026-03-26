/**
 * stateManager.js — Electron-Bridge Persistence Layer
 * 
 * Adapts the NeuralEngine's state management to use the Electron IPC bridge.
 * This ensures state is persisted in the main process's secure store.
 */

export const StateManager = {
    get: async function (key, defaultValue = null) {
        try {
            const state = await window.api.state.get();
            return state[key] !== undefined ? state[key] : defaultValue;
        } catch (e) {
            console.error(`[StateManager] Failed to load key: ${key}`, e);
            return defaultValue;
        }
    },

    set: async function (key, value) {
        try {
            await window.api.state.update({ [key]: value });
        } catch (e) {
            console.error(`[StateManager] Failed to save key: ${key}`, e);
        }
    },

    remove: async function (key) {
        // Current IPC doesn't have a direct 'remove' but 'update' with null or similar works
        try {
            await window.api.state.set(key, null);
        } catch (e) {
            console.error(`[StateManager] Failed to remove key: ${key}`, e);
        }
    }
};

export default StateManager;
