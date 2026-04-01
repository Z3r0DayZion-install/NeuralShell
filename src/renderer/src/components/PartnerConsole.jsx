import React from 'react';
import { downloadJson, parseStructuredRecords, readTextFile, toSafeNumber } from '../utils/recordIO.js';

const STORAGE_KEY = 'neuralshell_partner_console_v1';

function loadPartnerRows() {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    try {
        const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
        if (!Array.isArray(parsed)) return [];
        return parsed;
    } catch {
        return [];
    }
}

function normalizePartnerDeal(raw = {}) {
    const payload = raw && typeof raw === 'object' ? raw : {};
    const dealValueUsd = toSafeNumber(payload.dealValueUsd || payload.dealSize || payload.value, 0);
    const marginPercent = Math.max(0, Math.min(100, toSafeNumber(payload.marginPercent || payload.margin, 20)));
    const marginUsd = Math.round((dealValueUsd * marginPercent) / 100);
    return {
        id: String(payload.id || `partner-deal-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`),
        partnerId: String(payload.partnerId || payload.resellerId || 'PARTNER_UNSET').trim().toUpperCase(),
        partnerName: String(payload.partnerName || payload.partner || 'Unassigned Partner').trim(),
        accountName: String(payload.accountName || payload.account || payload.customer || 'Unnamed Account').trim(),
        leadOwner: String(payload.leadOwner || payload.owner || 'sales').trim().toLowerCase(),
        stage: String(payload.stage || payload.status || 'registered').trim().toLowerCase(),
        dealValueUsd,
        marginPercent,
        marginUsd,
        coBrandSlug: String(payload.coBrandSlug || payload.coBrand || payload.partnerId || 'default').trim().toLowerCase(),
        notes: String(payload.notes || '').trim(),
        updatedAt: new Date().toISOString(),
    };
}

export default function PartnerConsole() {
    const [rows, setRows] = React.useState(() => loadPartnerRows());
    const [error, setError] = React.useState('');

    React.useEffect(() => {
        if (typeof window === 'undefined' || !window.localStorage) return;
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
    }, [rows]);

    const totals = React.useMemo(() => {
        return rows.reduce((acc, row) => {
            acc.deals += 1;
            acc.value += toSafeNumber(row.dealValueUsd, 0);
            acc.margin += toSafeNumber(row.marginUsd, 0);
            return acc;
        }, { deals: 0, value: 0, margin: 0 });
    }, [rows]);

    const importRows = async (event) => {
        const file = event && event.target && event.target.files ? event.target.files[0] : null;
        if (!file) return;
        try {
            const text = await readTextFile(file);
            const parsed = parseStructuredRecords(text, file.name).map((entry) => normalizePartnerDeal(entry));
            setRows((prev) => {
                const byId = new Map(prev.map((item) => [item.id, item]));
                parsed.forEach((item) => byId.set(item.id, item));
                return Array.from(byId.values());
            });
            setError('');
        } catch (err) {
            setError(err && err.message ? err.message : String(err));
        }
    };

    const updateRow = (id, patch) => {
        setRows((prev) => prev.map((item) => {
            if (item.id !== id) return item;
            const next = { ...item, ...patch };
            const dealValueUsd = toSafeNumber(next.dealValueUsd, 0);
            const marginPercent = Math.max(0, Math.min(100, toSafeNumber(next.marginPercent, 0)));
            return {
                ...next,
                dealValueUsd,
                marginPercent,
                marginUsd: Math.round((dealValueUsd * marginPercent) / 100),
                updatedAt: new Date().toISOString(),
            };
        }));
    };

    const addRow = () => {
        setRows((prev) => [normalizePartnerDeal({
            partnerId: `P-${String(prev.length + 1).padStart(3, '0')}`,
            partnerName: 'New Partner',
            accountName: 'New Account',
            leadOwner: 'sales',
            stage: 'registered',
            dealValueUsd: 50000,
            marginPercent: 20,
        }), ...prev]);
    };

    const exportPartnerReport = () => {
        const byPartner = rows.reduce((acc, row) => {
            const partnerId = String(row.partnerId || 'UNKNOWN');
            if (!acc[partnerId]) {
                acc[partnerId] = {
                    partnerId,
                    partnerName: row.partnerName || partnerId,
                    deals: 0,
                    valueUsd: 0,
                    marginUsd: 0,
                };
            }
            acc[partnerId].deals += 1;
            acc[partnerId].valueUsd += toSafeNumber(row.dealValueUsd, 0);
            acc[partnerId].marginUsd += toSafeNumber(row.marginUsd, 0);
            return acc;
        }, {});
        downloadJson(`neuralshell_partner_report_${Date.now()}.json`, {
            exportedAt: new Date().toISOString(),
            totals,
            partners: Object.values(byPartner),
            deals: rows,
        });
    };

    const exportCoBrandedKit = (row) => {
        const safe = normalizePartnerDeal(row);
        downloadJson(`neuralshell_cobranded_kit_${safe.partnerId}_${Date.now()}.json`, {
            generatedAt: new Date().toISOString(),
            partner: {
                id: safe.partnerId,
                name: safe.partnerName,
                coBrandSlug: safe.coBrandSlug,
            },
            account: safe.accountName,
            messaging: {
                header: `${safe.partnerName} + NeuralShell`,
                cta: 'Book enterprise pilot review',
                supportEmail: `support+${safe.coBrandSlug}@neuralshell.local`,
            },
            deal: {
                stage: safe.stage,
                valueUsd: safe.dealValueUsd,
                marginPercent: safe.marginPercent,
                marginUsd: safe.marginUsd,
            },
        });
    };

    return (
        <section data-testid="partner-console" className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
                <div>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300 font-bold">Partner Operations Layer</div>
                    <div className="text-[10px] text-slate-500 font-mono">Deal registration, ownership, margin tracking, and reseller export packs.</div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        data-testid="partner-console-add-row-btn"
                        onClick={addRow}
                        className="px-2 py-1 rounded border border-cyan-300/30 bg-cyan-500/10 text-[9px] uppercase tracking-[0.12em] font-mono text-cyan-100"
                    >
                        + Register Deal
                    </button>
                    <label className="px-2 py-1 rounded border border-white/15 bg-white/5 text-[9px] uppercase tracking-[0.12em] font-mono text-slate-200 cursor-pointer">
                        Import CSV/JSON
                        <input
                            type="file"
                            accept=".csv,.json,application/json"
                            className="hidden"
                            data-testid="partner-console-import-input"
                            onChange={importRows}
                        />
                    </label>
                    <button
                        type="button"
                        data-testid="partner-console-export-report-btn"
                        onClick={exportPartnerReport}
                        className="px-2 py-1 rounded border border-emerald-300/30 bg-emerald-500/10 text-[9px] uppercase tracking-[0.12em] font-mono text-emerald-100"
                    >
                        Export Report
                    </button>
                </div>
            </div>

            {error && (
                <div className="rounded-lg border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-[10px] text-rose-200 font-mono">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                    <div className="text-[9px] uppercase tracking-[0.12em] text-slate-500">Registered Deals</div>
                    <div className="text-[14px] font-bold text-slate-100">{totals.deals}</div>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                    <div className="text-[9px] uppercase tracking-[0.12em] text-slate-500">Pipeline Value</div>
                    <div className="text-[14px] font-bold text-cyan-100">${totals.value.toLocaleString()}</div>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                    <div className="text-[9px] uppercase tracking-[0.12em] text-slate-500">Partner Margin</div>
                    <div className="text-[14px] font-bold text-emerald-100">${totals.margin.toLocaleString()}</div>
                </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-black/30 overflow-auto">
                <table className="min-w-full text-[10px] font-mono">
                    <thead className="bg-white/[0.04] text-slate-400 uppercase tracking-[0.1em]">
                        <tr>
                            <th className="text-left px-2 py-2">Partner</th>
                            <th className="text-left px-2 py-2">Account</th>
                            <th className="text-left px-2 py-2">Owner</th>
                            <th className="text-left px-2 py-2">Value</th>
                            <th className="text-left px-2 py-2">Margin %</th>
                            <th className="text-left px-2 py-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 && (
                            <tr><td className="px-3 py-3 text-slate-500" colSpan={6}>No partner deals registered.</td></tr>
                        )}
                        {rows.map((row) => (
                            <tr key={row.id} className="border-t border-white/5">
                                <td className="px-2 py-2">
                                    <input
                                        value={row.partnerId}
                                        onChange={(event) => updateRow(row.id, { partnerId: event.target.value.toUpperCase() })}
                                        className="w-full bg-transparent border border-white/10 rounded px-1.5 py-1 mb-1 text-slate-200"
                                    />
                                    <input
                                        value={row.partnerName}
                                        onChange={(event) => updateRow(row.id, { partnerName: event.target.value })}
                                        className="w-full bg-transparent border border-white/10 rounded px-1.5 py-1 text-slate-300"
                                    />
                                </td>
                                <td className="px-2 py-2 text-slate-200">
                                    <input
                                        value={row.accountName}
                                        onChange={(event) => updateRow(row.id, { accountName: event.target.value })}
                                        className="w-full bg-transparent border border-white/10 rounded px-1.5 py-1"
                                    />
                                </td>
                                <td className="px-2 py-2">
                                    <select
                                        value={row.leadOwner}
                                        onChange={(event) => updateRow(row.id, { leadOwner: event.target.value })}
                                        className="w-full bg-slate-900 border border-white/10 rounded px-1.5 py-1 text-slate-200"
                                    >
                                        <option value="sales">sales</option>
                                        <option value="support">support</option>
                                        <option value="founder">founder</option>
                                        <option value="partner">partner</option>
                                    </select>
                                </td>
                                <td className="px-2 py-2">
                                    <input
                                        type="number"
                                        value={row.dealValueUsd}
                                        onChange={(event) => updateRow(row.id, { dealValueUsd: toSafeNumber(event.target.value, 0) })}
                                        className="w-full bg-transparent border border-white/10 rounded px-1.5 py-1 text-slate-200"
                                    />
                                </td>
                                <td className="px-2 py-2">
                                    <input
                                        type="number"
                                        value={row.marginPercent}
                                        onChange={(event) => updateRow(row.id, { marginPercent: toSafeNumber(event.target.value, 0) })}
                                        className="w-full bg-transparent border border-white/10 rounded px-1.5 py-1 text-slate-200"
                                    />
                                    <div className="text-[9px] text-emerald-200 mt-1">${toSafeNumber(row.marginUsd, 0).toLocaleString()}</div>
                                </td>
                                <td className="px-2 py-2">
                                    <button
                                        type="button"
                                        data-testid={`partner-console-cobrand-btn-${row.id}`}
                                        onClick={() => exportCoBrandedKit(row)}
                                        className="px-2 py-1 rounded border border-cyan-300/30 bg-cyan-500/10 text-[9px] uppercase tracking-[0.12em] text-cyan-100"
                                    >
                                        Co-Brand Kit
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

