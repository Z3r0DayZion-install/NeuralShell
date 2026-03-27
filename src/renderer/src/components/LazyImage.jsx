import React from 'react';

export default function LazyImage({
    src,
    alt,
    className = '',
    placeholderClassName = '',
}) {
    const wrapperRef = React.useRef(null);
    const [inView, setInView] = React.useState(false);
    const [loaded, setLoaded] = React.useState(false);

    React.useEffect(() => {
        const node = wrapperRef.current;
        if (!node) return undefined;
        if (!window.IntersectionObserver) {
            setInView(true);
            return undefined;
        }
        const observer = new window.IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setInView(true);
                        observer.disconnect();
                    }
                });
            },
            { rootMargin: '120px 0px 120px 0px', threshold: 0.01 },
        );
        observer.observe(node);
        return () => observer.disconnect();
    }, []);

    return (
        <div ref={wrapperRef} className={`relative overflow-hidden ${className}`.trim()}>
            {!loaded && (
                <div
                    data-testid="lazy-image-placeholder"
                    className={`absolute inset-0 bg-slate-800/60 ${placeholderClassName}`.trim()}
                >
                    <div className="h-full w-full ns-shimmer" />
                </div>
            )}
            {inView && (
                <img
                    src={src}
                    alt={alt}
                    loading="lazy"
                    decoding="async"
                    onLoad={() => setLoaded(true)}
                    className={`block h-full w-full object-cover ${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
                />
            )}
        </div>
    );
}
