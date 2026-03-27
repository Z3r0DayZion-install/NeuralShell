import React from 'react';

const STORAGE_KEY = 'neuralshell_referrals_v1';

function readRows() {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    try {
        const raw = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
        return Array.isArray(raw) ? raw : [];
    } catch {
        return [];
    }
}

function writeRows(rows) {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
}

function randomCode() {
    const seed = Math.random().toString(36).slice(2, 10).toUpperCase();
    return `NSREF-${seed}`;
}

function buildLink(baseCheckoutUrl, code) {
    const base = String(baseCheckoutUrl || 'https://gumroad.com/l/neuralshell-operator').trim();
    const separator = base.includes('?') ? '&' : '?';
    return `${base}${separator}ref=${encodeURIComponent(code)}&utm_source=referral&utm_medium=partner&utm_campaign=delta9`;
}

function downloadJson(filename, payload) {
    const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(href);
}

export default function ReferralCard() {
    const [rows, setRows] = React.useState(() => readRows());
    const [status, setStatus] = React.useState('');
    const [baseCheckoutUrl, setBaseCheckoutUrl] = React.useState('https://gumroad.com/l/neuralshell-operator');

    const createReferral = () => {
        const code = randomCode();
        const link = buildLink(baseCheckoutUrl, code);
        const entry = {
            code,
            link,
            createdAt: new Date().toISOString(),
        };
        const next = [entry, ...rows].slice(0, 200);
        setRows(next);
        writeRows(next);
        setStatus(`Created referral ${code}`);
    };

    const exportReport = () => {
        const payload = {
            generatedAt: new Date().toISOString(),
            count: rows.length,
            rows,
        };
        downloadJson(`neuralshell_referrals_${Date.now()}.json`, payload);
        setStatus('Referral report exported.');
    };

    return (
        <section data-testid="referral-card" className="space-y-3 p-5 bg-black/30 rounded-2xl border border-white/5 shadow-inner">
            <div>
                <div className="text-[10px] uppercase tracking-widest text-cyan-300 font-bold">Referral Program</div>
                <div className="text-[11px] text-slate-400 font-mono">Generate referral links and export local attribution reports.</div>
            </div>

            <input
                data-testid="referral-base-url"
                value={baseCheckoutUrl}
                onChange={(event) => setBaseCheckoutUrl(event.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-[10px] font-mono text-slate-100"
                placeholder="Checkout URL"
            />

            <div className="flex flex-wrap gap-2">
                <button
                    type="button"
                    data-testid="referral-generate-btn"
                    onClick={createReferral}
                    className="px-3 py-2 rounded border border-cyan-300/30 bg-cyan-500/10 text-[10px] uppercase tracking-[0.14em] font-mono text-cyan-100"
                >
                    Generate Referral
                </button>
                <button
                    type="button"
                    data-testid="referral-export-btn"
                    onClick={exportReport}
                    className="px-3 py-2 rounded border border-white/15 bg-white/5 text-[10px] uppercase tracking-[0.14em] font-mono text-slate-200"
                >
                    Export Report
                </button>
            </div>

            <div className="space-y-1 max-h-32 overflow-auto">
                {rows.slice(0, 5).map((row) => (
                    <div data-testid={`referral-row-${row.code}`} key={row.code} className="rounded border border-white/10 bg-black/25 px-2 py-1 text-[9px] font-mono text-slate-300 break-all">
                        {row.code}{' -> '}{row.link}
                    </div>
                ))}
                {rows.length === 0 && (
                    <div className="text-[10px] font-mono text-slate-500">No referral codes generated yet.</div>
                )}
            </div>

            {status && (
                <div data-testid="referral-status" className="rounded border border-white/10 bg-black/25 px-2 py-1 text-[10px] font-mono text-slate-300">
                    {status}
                </div>
            )}
        </section>
    );
}
