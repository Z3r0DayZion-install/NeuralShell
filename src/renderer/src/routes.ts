export type RouteMatch =
    | { name: 'app' }
    | { name: 'share'; hash: string };

function sanitizeHash(value: string): string {
    return String(value || '').trim().replace(/[^a-zA-Z0-9_-]/g, '');
}

function parseShareFromPath(pathname: string): string {
    const match = String(pathname || '').match(/^\/share\/([a-zA-Z0-9_-]+)$/);
    if (!match) return '';
    return sanitizeHash(match[1]);
}

function parseShareFromHash(rawHash: string): string {
    const match = String(rawHash || '').match(/^#\/share\/([a-zA-Z0-9_-]+)/);
    if (!match) return '';
    return sanitizeHash(match[1]);
}

export function resolveRoute(pathname: string, rawHash = ''): RouteMatch {
    const pathHash = parseShareFromPath(pathname);
    if (pathHash) {
        return { name: 'share', hash: pathHash };
    }
    const hashRoute = parseShareFromHash(rawHash);
    if (hashRoute) {
        return { name: 'share', hash: hashRoute };
    }
    return { name: 'app' };
}

export default resolveRoute;
