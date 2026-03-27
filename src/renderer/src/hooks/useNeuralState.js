import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useNeuralState: Hook to sync with the Electron state store.
 */
export function useNeuralState(key, defaultValue) {
    const [value, setValue] = useState(defaultValue);
    const [loading, setLoading] = useState(true);
    const valueRef = useRef(defaultValue);

    useEffect(() => {
        valueRef.current = value;
    }, [value]);

    useEffect(() => {
        async function load() {
            const state = await window.api.state.get();
            if (state[key] !== undefined) {
                setValue(state[key]);
                valueRef.current = state[key];
            }
            setLoading(false);
        }
        const handleUpdate = (updates) => {
            if (updates && updates[key] !== undefined) {
                setValue(updates[key]);
                valueRef.current = updates[key];
            }
        };

        load();
        const unsubscribe = window.api.on('state-updated', handleUpdate);
        return () => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        };
    }, [key]);

    const updateValue = useCallback(async (newValue) => {
        const currentValue = valueRef.current;
        const finalValue = typeof newValue === 'function' ? newValue(currentValue) : newValue;
        valueRef.current = finalValue;
        setValue(finalValue);
        await window.api.state.update({ [key]: finalValue });
    }, [key]);

    return [value, updateValue, loading];
}
