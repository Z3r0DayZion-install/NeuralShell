import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export function ProofChipRow({ steps }) {
    const prefersReducedMotion = useReducedMotion();
    const safeSteps = Array.isArray(steps) ? steps : [];

    return (
        <div className="flex items-center gap-2.5">
            {safeSteps.map((step) => (
                <motion.div
                    key={step.id}
                    animate={prefersReducedMotion
                        ? {}
                        : (step.done
                            ? {
                                scale: [1, 1.15, 1],
                                boxShadow: [
                                    '0 0 0 rgba(16,185,129,0)',
                                    '0 0 18px rgba(16,185,129,0.45)',
                                    '0 0 0 rgba(16,185,129,0)',
                                ],
                            }
                            : {
                                scale: 1,
                                boxShadow: '0 0 0 rgba(15,23,42,0)',
                            })}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className={`px-2 py-1 rounded-md text-[8px] font-mono uppercase tracking-[0.14em] border ${
                        step.done
                            ? 'border-emerald-300/30 bg-emerald-500/10 text-emerald-200'
                            : 'border-slate-500/20 bg-slate-800/30 text-slate-400'
                    }`}
                >
                    {step.label}
                </motion.div>
            ))}
        </div>
    );
}

export default ProofChipRow;
