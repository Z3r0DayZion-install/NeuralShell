import React from 'react';

function usePrefersReducedMotion() {
    const [reduced, setReduced] = React.useState(false);

    React.useEffect(() => {
        if (!window.matchMedia) return;
        const query = window.matchMedia('(prefers-reduced-motion: reduce)');
        const apply = () => setReduced(Boolean(query.matches));
        apply();
        if (typeof query.addEventListener === 'function') {
            query.addEventListener('change', apply);
            return () => query.removeEventListener('change', apply);
        }
        query.addListener(apply);
        return () => query.removeListener(apply);
    }, []);

    return reduced;
}

export default function StreamingBar({ active, enabled = true }) {
    const prefersReducedMotion = usePrefersReducedMotion();
    const [progress, setProgress] = React.useState(8);

    React.useEffect(() => {
        if (!active || !enabled || prefersReducedMotion) {
            return undefined;
        }
        const id = window.setInterval(() => {
            setProgress((prev) => {
                if (prev >= 92) return 18;
                return Math.min(92, prev + 7);
            });
        }, 220);
        return () => window.clearInterval(id);
    }, [active, enabled, prefersReducedMotion]);

    if (!active || !enabled || prefersReducedMotion) {
        return null;
    }

    return (
        <div data-testid="streaming-progress" className="h-[2px] w-full bg-transparent">
            <div
                className="h-full"
                style={{
                    width: `${progress}%`,
                    transition: 'width 180ms linear',
                    backgroundColor: 'rgb(var(--accent-rgb) / 0.92)',
                    boxShadow: '0 0 18px rgb(var(--accent-rgb) / 0.55)',
                }}
            />
        </div>
    );
}
