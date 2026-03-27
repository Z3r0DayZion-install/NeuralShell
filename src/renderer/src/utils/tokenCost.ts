import modelPrices from '../config/model_prices.json';

function toNumber(value: unknown, fallback = 0): number {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
}

export function estimateTokens(text: string): number {
    const length = String(text || '').trim().length;
    if (!length) return 0;
    return Math.max(1, Math.ceil(length / 4));
}

export function resolvePricePer1k(providerId: string, modelId: string): number {
    const provider = String(providerId || '').trim().toLowerCase();
    const model = String(modelId || '').trim();
    const table = (modelPrices as Record<string, Record<string, number>>) || {};
    const providerTable = table[provider] || {};

    if (Object.prototype.hasOwnProperty.call(providerTable, model)) {
        return toNumber(providerTable[model], 0);
    }

    if (Object.prototype.hasOwnProperty.call(providerTable, '*')) {
        return toNumber(providerTable['*'], 0);
    }

    const fallback = table.default || {};
    if (Object.prototype.hasOwnProperty.call(fallback, '*')) {
        return toNumber(fallback['*'], 0);
    }

    return 0;
}

export function estimateCostUsd(tokens: number, providerId: string, modelId: string): number {
    const safeTokens = Math.max(0, toNumber(tokens, 0));
    const per1k = resolvePricePer1k(providerId, modelId);
    return Number(((safeTokens / 1000) * per1k).toFixed(6));
}

export function formatTokenCostTooltip(content: string, providerId: string, modelId: string): string {
    const tokens = estimateTokens(content);
    const usd = estimateCostUsd(tokens, providerId, modelId);
    return `${tokens} tok · $${usd.toFixed(3)}`;
}

export default {
    estimateTokens,
    resolvePricePer1k,
    estimateCostUsd,
    formatTokenCostTooltip,
};
