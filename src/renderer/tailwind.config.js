/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            // ═══ COLOR ROLES ═══
            // cyan   = active / live / primary
            // amber  = proof / trust / authority (gold)
            // green  = stable / success / healthy
            // orange = warning / degraded
            // red    = destructive / critical
            colors: {
                shell: {
                    canvas: '#020812',   // deepest background
                    surface: '#040c16',   // rail/header bg
                    panel: '#071423',   // card/panel bg
                    overlay: '#0b1726',   // overlay/palette bg
                    drawer: '#071321',   // settings drawer bg
                    deep: '#12121e',     // deep card/drawer bg
                    mid: '#1a1a2e',      // footer/composer bg
                    soft: '#1e1e2e',     // header/input bg
                    border: 'rgba(14, 37, 60, 0.4)',
                },
                cyan: {
                    400: '#22d3ee',
                },
                amber: {
                    300: '#fcd34d',
                },
            },

            // ═══ TYPOGRAPHY SCALE ═══
            // Locked operator sizes — do not add new sizes
            fontSize: {
                'shell-micro': ['8px', { lineHeight: '1.4' }],   // badge metadata, version tags
                'shell-label': ['9px', { lineHeight: '1.4' }],   // zone headers, section labels
                'shell-caption': ['10px', { lineHeight: '1.5' }],   // controls, button text, hints
                'shell-body': ['11px', { lineHeight: '1.5' }],   // metric values, list items
                'shell-title': ['13px', { lineHeight: '1.4' }],   // panel titles, model names
                'shell-input': ['14px', { lineHeight: '1.6' }],   // chat bubbles
                'shell-compose': ['15px', { lineHeight: '1.6' }],   // composer textarea
            },

            // ═══ SPACING SCALE ═══
            // Consistent module padding
            spacing: {
                'shell-xs': '4px',
                'shell-sm': '8px',
                'shell-md': '12px',
                'shell-lg': '16px',
                'shell-xl': '24px',
                'shell-2xl': '32px',
            },

            // ═══ RADIUS SCALE ═══
            borderRadius: {
                'shell': '30px',  // main shell container
                'panel': '24px',  // panel cards
                'control': '12px',  // buttons, inputs
                'badge': '9999px', // pills, badges
            },

            // ═══ SHADOW SCALE ═══
            boxShadow: {
                'shell-ambient': '0 18px 60px rgba(0,0,0,0.35)',
                'shell-overlay': '0 20px 50px rgba(0,0,0,0.5), 0 0 30px rgba(34,211,238,0.1)',
                'shell-drawer': '-10px 0 30px rgba(0,0,0,0.4)',
                'shell-glow-cyan': '0 0 20px rgba(34,211,238,0.05)',
                'shell-glow-node': '0 0 8px rgba(16,185,129,0.4)',
                'shell-glow-cmd': '0 0 15px rgba(34,211,238,0.05)',
            },

            // ═══ BACKDROP BLUR SCALE ═══
            backdropBlur: {
                'shell-sm': '4px',
                'shell-md': '12px',
                'shell-lg': '24px',
            },

            // ═══ TRACKING (LETTER SPACING) ═══
            letterSpacing: {
                'shell-tight': '0.1em',
                'shell-normal': '0.2em',
                'shell-wide': '0.3em',
                'shell-ultra': '0.4em',
                'shell-max': '0.6em',
            },

            // ═══ FONT FAMILY ═══
            fontFamily: {
                mono: ['JetBrains Mono', 'monospace'],
            },

            // ═══ OPACITY SCALE ═══
            opacity: {
                'shell-subtle': '0.03',
                'shell-muted': '0.05',
                'shell-dim': '0.10',
                'shell-soft': '0.20',
                'shell-mid': '0.40',
                'shell-strong': '0.60',
                'shell-full': '0.80',
            },
        },
    },
    plugins: [],
}
