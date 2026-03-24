/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                shell: {
                    canvas: '#020812',
                    surface: '#05101b',
                    panel: '#071423',
                    border: 'rgba(14, 37, 60, 0.4)',
                },
                cyan: {
                    400: '#22d3ee',
                },
                amber: {
                    300: '#fcd34d',
                }
            },
            borderRadius: {
                'shell': '30px',
                'panel': '24px',
            },
            fontFamily: {
                mono: ['JetBrains Mono', 'monospace'],
            }
        },
    },
    plugins: [],
}
