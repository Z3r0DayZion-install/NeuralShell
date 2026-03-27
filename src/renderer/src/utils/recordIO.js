export function toSafeNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : Number(fallback || 0);
}

function parseCsvLine(line) {
    const cols = [];
    let current = '';
    let inQuotes = false;
    for (let index = 0; index < line.length; index += 1) {
        const char = line[index];
        const next = line[index + 1];
        if (char === '"' && inQuotes && next === '"') {
            current += '"';
            index += 1;
            continue;
        }
        if (char === '"') {
            inQuotes = !inQuotes;
            continue;
        }
        if (char === ',' && !inQuotes) {
            cols.push(current.trim());
            current = '';
            continue;
        }
        current += char;
    }
    cols.push(current.trim());
    return cols;
}

export function parseCsvRecords(text = '') {
    const rows = String(text || '').split(/\r?\n/).filter((line) => String(line || '').trim().length > 0);
    if (!rows.length) return [];
    const headers = parseCsvLine(rows[0]).map((header) => String(header || '').trim());
    if (!headers.length) return [];
    return rows.slice(1).map((line) => {
        const values = parseCsvLine(line);
        const row = {};
        headers.forEach((header, index) => {
            if (!header) return;
            row[header] = String(values[index] || '').trim();
        });
        return row;
    });
}

export function parseJsonRecords(text = '') {
    const parsed = JSON.parse(String(text || '{}'));
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === 'object') {
        if (Array.isArray(parsed.rows)) return parsed.rows;
        if (Array.isArray(parsed.records)) return parsed.records;
        if (Array.isArray(parsed.items)) return parsed.items;
        return [parsed];
    }
    return [];
}

export function parseStructuredRecords(text = '', sourceName = '') {
    const lowerName = String(sourceName || '').toLowerCase();
    if (lowerName.endsWith('.csv')) {
        return parseCsvRecords(text);
    }
    try {
        return parseJsonRecords(text);
    } catch {
        return parseCsvRecords(text);
    }
}

export function readTextFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Unable to read local file.'));
        reader.onload = () => resolve(String(reader.result || ''));
        reader.readAsText(file);
    });
}

export function downloadJson(filename, payload) {
    const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = String(filename || 'export.json');
    anchor.click();
    URL.revokeObjectURL(url);
}

export function downloadText(filename, text) {
    const blob = new Blob([String(text || '')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = String(filename || 'export.txt');
    anchor.click();
    URL.revokeObjectURL(url);
}

export function toDateString(input, fallback = '') {
    const value = String(input || '').trim();
    if (!value) return fallback;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return fallback;
    return parsed.toISOString().slice(0, 10);
}

