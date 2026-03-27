import React from 'react';
import { downloadJson, downloadText } from '../utils/recordIO.js';

export default function PilotKitConsole() {
    const [customerName, setCustomerName] = React.useState('Acme Security Group');
    const [industry, setIndustry] = React.useState('critical-infrastructure');
    const [useCase, setUseCase] = React.useState('secure release verification');
    const [logoPath, setLogoPath] = React.useState('assets/pilot_kit/customer_logo.png');

    const command = React.useMemo(() => {
        const parts = [
            'node scripts/gen_pilot_pack.cjs',
            `--customer "${customerName}"`,
            `--industry "${industry}"`,
            `--use-case "${useCase}"`,
            `--logo "${logoPath}"`,
        ];
        return parts.join(' ');
    }, [customerName, industry, logoPath, useCase]);

    const payload = React.useMemo(() => ({
        customerName,
        industry,
        useCase,
        logoPath,
        generatedAt: new Date().toISOString(),
        recommendedCommand: command,
    }), [command, customerName, industry, logoPath, useCase]);

    return (
        <section data-testid="pilot-kit-console" className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
                <div>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300 font-bold">Pilot Program Kit</div>
                    <div className="text-[10px] text-slate-500 font-mono">Generate ready-to-send pilot bundles tailored by customer, logo, industry, and use case.</div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        data-testid="pilot-kit-export-json-btn"
                        onClick={() => downloadJson(`neuralshell_pilot_pack_request_${Date.now()}.json`, payload)}
                        className="px-2 py-1 rounded border border-emerald-300/30 bg-emerald-500/10 text-[9px] uppercase tracking-[0.12em] font-mono text-emerald-100"
                    >
                        Export Request
                    </button>
                    <button
                        type="button"
                        data-testid="pilot-kit-export-command-btn"
                        onClick={() => downloadText(`neuralshell_pilot_pack_command_${Date.now()}.txt`, `${command}\n`)}
                        className="px-2 py-1 rounded border border-cyan-300/30 bg-cyan-500/10 text-[9px] uppercase tracking-[0.12em] font-mono text-cyan-100"
                    >
                        Export Command
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <label className="rounded-lg border border-white/10 bg-black/20 p-2 text-[10px] font-mono text-slate-300">
                    Customer Name
                    <input
                        value={customerName}
                        onChange={(event) => setCustomerName(event.target.value)}
                        className="mt-1 w-full bg-transparent border border-white/10 rounded px-2 py-1"
                    />
                </label>
                <label className="rounded-lg border border-white/10 bg-black/20 p-2 text-[10px] font-mono text-slate-300">
                    Industry
                    <input
                        value={industry}
                        onChange={(event) => setIndustry(event.target.value)}
                        className="mt-1 w-full bg-transparent border border-white/10 rounded px-2 py-1"
                    />
                </label>
                <label className="rounded-lg border border-white/10 bg-black/20 p-2 text-[10px] font-mono text-slate-300 md:col-span-2">
                    Use Case
                    <input
                        value={useCase}
                        onChange={(event) => setUseCase(event.target.value)}
                        className="mt-1 w-full bg-transparent border border-white/10 rounded px-2 py-1"
                    />
                </label>
                <label className="rounded-lg border border-white/10 bg-black/20 p-2 text-[10px] font-mono text-slate-300 md:col-span-2">
                    Logo Path
                    <input
                        value={logoPath}
                        onChange={(event) => setLogoPath(event.target.value)}
                        className="mt-1 w-full bg-transparent border border-white/10 rounded px-2 py-1"
                    />
                </label>
            </div>

            <div className="rounded-lg border border-white/10 bg-black/20 p-2">
                <div className="text-[9px] uppercase tracking-[0.12em] text-slate-500 mb-1">Generator Command</div>
                <code className="text-[10px] font-mono text-cyan-100 break-all">{command}</code>
            </div>
        </section>
    );
}

