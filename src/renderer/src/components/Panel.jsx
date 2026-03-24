import React from 'react';

/**
 * Panel component from the overhaul design.
 */
export function Panel({ children, className = "" }) {
    const cn = (...parts) => parts.filter(Boolean).join(" ");

    return (
        <section className={cn(
            "rounded-[24px] border border-cyan-900/60 bg-[#071423]/88 shadow-[0_0_0_1px_rgba(18,39,64,0.28),0_18px_60px_rgba(0,0,0,0.35)]",
            className
        )}>
            {children}
        </section>
    );
}

export default Panel;
