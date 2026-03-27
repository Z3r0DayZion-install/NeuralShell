import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

function buildLiveAnnouncement(steps) {
    return (Array.isArray(steps) ? steps : [])
        .map((step) => `${String(step.label || 'Stage')} stage ${step.done ? '✅' : 'pending'}`)
        .join('. ');
}

export function ProofChipRow({ steps }) {
    const prefersReducedMotion = useReducedMotion();
    const safeSteps = Array.isArray(steps) ? steps : [];
    const announcement = buildLiveAnnouncement(safeSteps);

    return (
        <div className="flex items-center gap-2.5">
            <div className="sr-only" aria-live="polite">{announcement}</div>
            {safeSteps.map((step) => (
                <motion.div
                    key={step.id}
                    animate={prefersReducedMotion
                        ? {}
                        : (step.done
                            ? {
                                scale: [1, 1.12, 1],
                                boxShadow: [
                                    '0 0 0 rgba(0,0,0,0)',
                                    '0 0 16px rgb(var(--accent-rgb) / 0.42)',
                                    '0 0 0 rgba(0,0,0,0)',
                                ],
                            }
                            : {
                                scale: 1,
                                boxShadow: '0 0 0 rgba(0,0,0,0)',
                            })}
                    transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.28, ease: 'easeOut' }}
                    className={`px-2 py-1 rounded-md text-[8px] font-mono uppercase tracking-[0.14em] border ${
                        step.done
                            ? 'text-slate-100'
                            : 'border-slate-500/20 bg-slate-800/30 text-slate-400'
                    }`}
                    style={step.done ? {
                        borderColor: 'rgb(var(--accent-rgb) / 0.36)',
                        backgroundColor: 'rgb(var(--accent-rgb) / 0.15)',
                        color: 'var(--accent)',
                    } : undefined}
                >
                    {step.label}
                </motion.div>
            ))}
        </div>
    );
}

export default ProofChipRow;
