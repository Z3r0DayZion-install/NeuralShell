import { useState, useEffect } from 'react';

/**
 * useNeuralState: Hook to sync with the Electron state store.
 */
export function useNeuralState(key, defaultValue) {
    const [value, setValue] = useState(defaultValue);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const state = await window.api.state.get();
            if (state[key] !== undefined) {
                setValue(state[key]);
            }
            setLoading(false);
        }
        const handleUpdate = (_event, updates) => {
            if (updates[key] !== undefined) {
                setValue(updates[key]);
            }
        };

        load();
        window.api.on('state-updated', handleUpdate);
        return () => {
            // Preload usually doesn't expose 'removeListener' unless explicitly added, 
            // but we'll include it for robustness if the API supports it.
            if (window.api.off) window.api.off('state-updated', handleUpdate);
        };
    }, [key]);

    const updateValue = async (newValue) => {
        const finalValue = typeof newValue === 'function' ? newValue(value) : newValue;
        setValue(finalValue);
        await window.api.state.update({ [key]: finalValue });
    };

    return [value, updateValue, loading];
}
