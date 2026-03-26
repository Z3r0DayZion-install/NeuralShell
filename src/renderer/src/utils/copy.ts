export type CopyMode = 'default' | 'codeblock' | 'commit';

function normalizeText(value: string): string {
    return String(value || '').replace(/\r\n/g, '\n').trimEnd();
}

export function asCodeBlock(value: string, language = 'txt'): string {
    const body = normalizeText(value);
    return `\`\`\`${language}\n${body}\n\`\`\``;
}

export function asCommitMessage(value: string): string {
    const source = normalizeText(value);
    const lines = source.split('\n').map((line) => line.trim()).filter(Boolean);
    const subjectSource = lines[0] || 'update';
    const compact = subjectSource.replace(/[^a-zA-Z0-9 ]+/g, ' ').trim().replace(/\s+/g, ' ');
    const subject = compact.length > 68 ? compact.slice(0, 68).trim() : compact;
    const body = lines.slice(1, 5).map((line) => `- ${line}`).join('\n');
    const scopedSubject = subject ? `chore(neuralshell): ${subject.toLowerCase()}` : 'chore(neuralshell): update';
    return body ? `${scopedSubject}\n\n${body}` : scopedSubject;
}

export function materializeCopyValue(value: string, mode: CopyMode): string {
    if (mode === 'codeblock') return asCodeBlock(value, 'md');
    if (mode === 'commit') return asCommitMessage(value);
    return normalizeText(value);
}

export async function copyWithMode(value: string, mode: CopyMode = 'default'): Promise<string> {
    const content = materializeCopyValue(value, mode);
    if (!navigator || !navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') {
        throw new Error('Clipboard API unavailable.');
    }
    await navigator.clipboard.writeText(content);
    return content;
}

export function copyToastLabel(mode: CopyMode): string {
    if (mode === 'commit') return 'Copied (commit)';
    if (mode === 'codeblock') return 'Copied (codeblock)';
    return 'Copied';
}
