import React from 'react';
import { useUIPreferences, ACCENT_COLOR_MAP, FONT_SIZE_MAP } from '../../state/useUIPreferences';

const ACCENT_OPTIONS = Object.keys(ACCENT_COLOR_MAP);
const FONT_SIZE_OPTIONS = ['small', 'medium', 'large'];
const SIDEBAR_OPTIONS = ['left', 'right'];

const ToggleSwitch = React.memo(function ToggleSwitch({ checked, onChange, label, description }) {
    return (
        <label className="flex items-center justify-between cursor-pointer group py-2">
            <div>
                <div className="text-[12px] font-medium text-slate-200 group-hover:text-white transition-colors">{label}</div>
                {description && <div className="text-[10px] text-slate-500 mt-0.5">{description}</div>}
            </div>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={() => onChange(!checked)}
                className={`relative w-10 h-5.5 rounded-full transition-all duration-200 ${checked ? 'bg-violet-500/40 border-violet-400/40' : 'bg-white/5 border-white/10'} border flex-shrink-0`}
            >
                <span className={`absolute top-0.5 h-4 w-4 rounded-full transition-all duration-200 ${checked ? 'left-5 bg-violet-400 shadow-[0_0_8px_rgba(139,92,246,0.4)]' : 'left-0.5 bg-slate-400'}`} />
            </button>
        </label>
    );
});

const SegmentedControl = React.memo(function SegmentedControl({ value, options, onChange, labels }) {
    return (
        <div className="inline-flex items-center rounded-lg border border-violet-400/15 bg-violet-500/5 overflow-hidden">
            {options.map((opt, i) => (
                <button
                    key={opt}
                    type="button"
                    onClick={() => onChange(opt)}
                    className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.1em] transition-all ${
                        i > 0 ? 'border-l border-violet-400/15' : ''
                    } ${
                        value === opt
                            ? 'bg-violet-500/20 text-violet-200 font-bold'
                            : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                    }`}
                >
                    {labels ? labels[i] : opt}
                </button>
            ))}
        </div>
    );
});

export default React.memo(function UIAppearanceCard() {
    const {
        fontSize, setFontSize,
        accentColor, setAccentColor,
        compactMode, setCompactMode,
        animationsEnabled, setAnimationsEnabled,
        sidebarPosition, setSidebarPosition,
        resetToDefaults,
    } = useUIPreferences();

    const fontInfo = FONT_SIZE_MAP[fontSize] || FONT_SIZE_MAP.medium;

    return (
        <section className="rounded-xl border border-violet-400/15 bg-[#1e1e2e]/40 p-5 space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-[13px] font-bold text-violet-300">Appearance & Layout</h3>
                    <p className="text-[10px] font-mono text-slate-500 mt-0.5">Customize how NeuralShell looks and feels</p>
                </div>
                <button
                    type="button"
                    onClick={resetToDefaults}
                    className="px-2.5 py-1 rounded-lg border border-slate-500/20 bg-white/[0.02] text-[9px] font-mono text-slate-400 uppercase tracking-wider hover:bg-white/5 hover:text-slate-300 transition-all"
                >
                    Reset All
                </button>
            </div>

            {/* Font Size */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label className="text-[11px] font-mono text-slate-300">
                        <span className="text-violet-400">fontSize</span> <span className="text-slate-600">=</span> <span className="text-green-300">"{fontSize}"</span>
                    </label>
                    <span className="text-[9px] font-mono text-slate-600">{fontInfo.base}px base</span>
                </div>
                <SegmentedControl value={fontSize} options={FONT_SIZE_OPTIONS} onChange={setFontSize} labels={['Sm', 'Md', 'Lg']} />
                <div className="text-[10px] text-slate-500 mt-1" style={{ fontSize: `${fontInfo.base}px` }}>
                    Preview text at {fontSize} size
                </div>
            </div>

            {/* Accent Color */}
            <div className="space-y-2.5">
                <label className="text-[11px] font-mono text-slate-300">
                    <span className="text-violet-400">accentColor</span> <span className="text-slate-600">=</span> <span className="text-green-300">"{accentColor}"</span>
                </label>
                <div className="flex items-center gap-2">
                    {ACCENT_OPTIONS.map((color) => {
                        const c = ACCENT_COLOR_MAP[color];
                        const isActive = accentColor === color;
                        return (
                            <button
                                key={color}
                                type="button"
                                onClick={() => setAccentColor(color)}
                                title={color}
                                className={`w-7 h-7 rounded-full transition-all duration-200 border-2 ${
                                    isActive
                                        ? 'scale-110 shadow-[0_0_12px_var(--ring)]'
                                        : 'border-transparent hover:scale-105 opacity-70 hover:opacity-100'
                                }`}
                                style={{
                                    backgroundColor: c.primary,
                                    borderColor: isActive ? c.hover : 'transparent',
                                    '--ring': c.ring,
                                }}
                            />
                        );
                    })}
                </div>
            </div>

            {/* Sidebar Position */}
            <div className="space-y-2">
                <label className="text-[11px] font-mono text-slate-300">
                    <span className="text-violet-400">sidebarPosition</span> <span className="text-slate-600">=</span> <span className="text-green-300">"{sidebarPosition}"</span>
                </label>
                <SegmentedControl value={sidebarPosition} options={SIDEBAR_OPTIONS} onChange={setSidebarPosition} labels={['← Left', 'Right →']} />
            </div>

            {/* Toggles */}
            <div className="space-y-1 border-t border-white/5 pt-3">
                <ToggleSwitch
                    checked={compactMode}
                    onChange={setCompactMode}
                    label="Compact Mode"
                    description="Reduce padding and spacing for more content density"
                />
                <ToggleSwitch
                    checked={animationsEnabled}
                    onChange={setAnimationsEnabled}
                    label="Animations"
                    description="Enable smooth transitions and pulse effects"
                />
            </div>
        </section>
    );
});
