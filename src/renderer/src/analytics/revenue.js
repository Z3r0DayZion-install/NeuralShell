function toNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function parseCsv(text) {
    const rows = String(text || '').split(/\r?\n/).filter(Boolean);
    if (!rows.length) return [];
    const headers = rows[0].split(',').map((value) => value.trim());
    return rows.slice(1).map((line) => {
        const cols = line.split(',');
        const row = {};
        headers.forEach((header, index) => {
            row[header] = String(cols[index] || '').trim();
        });
        return row;
    });
}

export function parseRevenueSnapshot(raw = {}, source = 'snapshot') {
    const payload = raw && typeof raw === 'object' ? raw : {};
    return {
        source,
        period: String(payload.period || payload.date || new Date().toISOString().slice(0, 10)),
        mrr: toNumber(payload.mrr, 0),
        installs: toNumber(payload.installs, 0),
        activations: toNumber(payload.activations, 0),
        upgrades: toNumber(payload.upgrades, 0),
        agentSales: toNumber(payload.agentSales, 0),
        partnerRevenue: toNumber(payload.partnerRevenue, 0),
    };
}

export function parseRevenueImport(text, fileName = '') {
    const source = String(fileName || 'import');
    if (source.toLowerCase().endsWith('.csv')) {
        return parseCsv(text).map((row) => parseRevenueSnapshot(row, source));
    }
    const parsed = JSON.parse(String(text || '{}'));
    if (Array.isArray(parsed)) {
        return parsed.map((entry) => parseRevenueSnapshot(entry, source));
    }
    if (Array.isArray(parsed.snapshots)) {
        return parsed.snapshots.map((entry) => parseRevenueSnapshot(entry, source));
    }
    return [parseRevenueSnapshot(parsed, source)];
}

export function summarizeRevenue(rows = []) {
    const safe = Array.isArray(rows) ? rows : [];
    const totals = {
        mrr: 0,
        installs: 0,
        activations: 0,
        upgrades: 0,
        agentSales: 0,
        partnerRevenue: 0,
    };
    for (const row of safe) {
        totals.mrr += toNumber(row.mrr, 0);
        totals.installs += toNumber(row.installs, 0);
        totals.activations += toNumber(row.activations, 0);
        totals.upgrades += toNumber(row.upgrades, 0);
        totals.agentSales += toNumber(row.agentSales, 0);
        totals.partnerRevenue += toNumber(row.partnerRevenue, 0);
    }
    const recent = safe.slice(-3);
    const recentAvgMrr = recent.length
        ? recent.reduce((sum, row) => sum + toNumber(row.mrr, 0), 0) / recent.length
        : 0;
    return {
        totals,
        projectionYearly: Math.round(recentAvgMrr * 12),
    };
}
