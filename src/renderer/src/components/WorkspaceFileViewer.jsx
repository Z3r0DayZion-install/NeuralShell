import React from 'react';
import ContextChipBar from './ContextChipBar';

const SAMPLE_FILE = [
    'export function verifyReleaseGate(input) {',
    '  if (!input || !input.manifest) {',
    "    throw new Error('manifest required');",
    '  }',
    '  const passed = Boolean(input.signature && input.checksums);',
    '  return { passed, checkedAt: new Date().toISOString() };',
    '}',
].join('\n');

export default function WorkspaceFileViewer({
    onInsertCommand,
}) {
    const viewerRef = React.useRef(null);
    const [chipState, setChipState] = React.useState({
        visible: false,
        x: 0,
        y: 0,
        text: '',
    });

    React.useEffect(() => {
        const hideOnResize = () => {
            setChipState((prev) => ({ ...prev, visible: false }));
        };
        window.addEventListener('resize', hideOnResize);
        window.addEventListener('scroll', hideOnResize, true);
        return () => {
            window.removeEventListener('resize', hideOnResize);
            window.removeEventListener('scroll', hideOnResize, true);
        };
    }, []);

    const updateSelection = React.useCallback(() => {
        const selection = window.getSelection ? window.getSelection() : null;
        if (!selection || selection.rangeCount === 0) {
            setChipState((prev) => ({ ...prev, visible: false }));
            return;
        }
        const text = String(selection.toString() || '').trim();
        if (!text) {
            setChipState((prev) => ({ ...prev, visible: false }));
            return;
        }
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        if (!rect || (!rect.width && !rect.height)) {
            setChipState((prev) => ({ ...prev, visible: false }));
            return;
        }
        const host = viewerRef.current;
        if (host && !host.contains(range.commonAncestorContainer)) {
            setChipState((prev) => ({ ...prev, visible: false }));
            return;
        }
        setChipState({
            visible: true,
            x: rect.left + rect.width / 2 - 90,
            y: rect.top - 38,
            text,
        });
    }, []);

    return (
        <section className="rounded-xl border border-white/10 bg-black/30 p-3">
            <div className="mb-2 flex items-center justify-between">
                <div>
                    <div className="text-[9px] uppercase tracking-[0.14em] text-slate-500 font-bold">Workspace Viewer</div>
                    <div className="text-[10px] text-slate-400 font-mono">Select text to open context chips.</div>
                </div>
            </div>
            <pre
                ref={viewerRef}
                data-testid="workspace-file-viewer"
                onMouseUp={updateSelection}
                onKeyUp={updateSelection}
                onBlur={() => {
                    setChipState((prev) => ({ ...prev, visible: false }));
                }}
                tabIndex={0}
                className="m-0 rounded-lg border border-white/10 bg-slate-950/70 p-3 text-[10px] leading-relaxed font-mono text-slate-300 max-h-44 overflow-auto custom-scrollbar whitespace-pre-wrap outline-none focus:border-cyan-300/35"
            >
                {SAMPLE_FILE}
            </pre>
            <ContextChipBar
                visible={chipState.visible}
                x={chipState.x}
                y={chipState.y}
                selectionText={chipState.text}
                onPick={(command) => {
                    if (typeof onInsertCommand === 'function') {
                        onInsertCommand(command);
                    }
                    setChipState((prev) => ({ ...prev, visible: false }));
                }}
            />
        </section>
    );
}
