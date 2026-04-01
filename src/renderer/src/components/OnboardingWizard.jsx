import React from 'react';
import onboardingSteps from '../config/onboarding_steps.json';

const STORAGE_KEY = 'neuralshell_onboarding_progress_v1';
const EVENTS_KEY = 'neuralshell_onboarding_events_v1';

function readProgress() {
    if (typeof window === 'undefined' || !window.localStorage) {
        return {};
    }
    try {
        return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}') || {};
    } catch {
        return {};
    }
}

function writeProgress(progress) {
    if (typeof window === 'undefined' || !window.localStorage) {
        return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress || {}));
}

function appendEvent(type, stepId = '') {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
        const list = JSON.parse(window.localStorage.getItem(EVENTS_KEY) || '[]');
        const next = Array.isArray(list) ? list : [];
        next.push({
            at: new Date().toISOString(),
            type: String(type || ''),
            stepId: String(stepId || ''),
        });
        window.localStorage.setItem(EVENTS_KEY, JSON.stringify(next.slice(-200)));
    } catch {
        // best effort
    }
}

export default function OnboardingWizard({
    open,
    onClose,
    onOpenSettings,
    onRunCommand,
}) {
    const [progress, setProgress] = React.useState(() => readProgress());
    const [busyStep, setBusyStep] = React.useState('');

    React.useEffect(() => {
        if (open) {
            appendEvent('wizard_opened');
        }
    }, [open]);

    if (!open) return null;

    const completeStep = (stepId) => {
        const next = {
            ...progress,
            [stepId]: true,
        };
        setProgress(next);
        writeProgress(next);
        appendEvent('step_completed', stepId);
    };

    const runStep = async (step) => {
        const stepId = String(step && step.id ? step.id : '');
        if (!stepId) return;
        setBusyStep(stepId);
        appendEvent('step_started', stepId);
        try {
            if (stepId === 'provider_sweep') {
                if (typeof onOpenSettings === 'function') {
                    onOpenSettings();
                }
                completeStep(stepId);
                return;
            }
            if (stepId === 'vault_save') {
                await window.api.vault.setSecret('onboarding', 'demo_key', `created:${new Date().toISOString()}`);
                completeStep(stepId);
                return;
            }
            if (stepId === 'run_proof') {
                if (typeof onRunCommand === 'function') {
                    onRunCommand('/proof');
                }
                completeStep(stepId);
                return;
            }
            if (stepId === 'share_badge') {
                await window.api.system.openExternal('https://raw.githubusercontent.com/Z3r0DayZion-install/NeuralShell/badges/proof_badge.svg');
                completeStep(stepId);
            }
        } catch {
            appendEvent('step_failed', stepId);
        } finally {
            setBusyStep('');
        }
    };

    const completed = onboardingSteps.filter((step) => Boolean(progress[step.id])).length;
    const allDone = completed >= onboardingSteps.length;

    return (
        <div className="fixed inset-0 z-[140] bg-black/65 backdrop-blur-sm flex items-center justify-center p-5">
            <div className="w-full max-w-3xl rounded-2xl border border-cyan-300/20 bg-slate-950 p-5">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300 font-bold">First-Run Onboarding</div>
                        <div className="text-[11px] text-slate-400 font-mono">{completed}/{onboardingSteps.length} complete</div>
                    </div>
                    <button
                        type="button"
                        data-testid="onboarding-close-btn"
                        onClick={onClose}
                        className="h-8 w-8 rounded-full border border-white/10 text-slate-300 hover:bg-white/10"
                    >
                        ✕
                    </button>
                </div>
                <div className="space-y-3">
                    {onboardingSteps.map((step, index) => {
                        const stepId = String(step.id || '');
                        const done = Boolean(progress[stepId]);
                        return (
                            <div key={stepId} className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 flex items-center justify-between gap-3">
                                <div>
                                    <div className="text-[10px] uppercase tracking-[0.14em] text-slate-200 font-bold">
                                        {index + 1}. {step.title}
                                    </div>
                                    <div className="text-[10px] text-slate-500 font-mono">{step.description}</div>
                                </div>
                                <button
                                    type="button"
                                    data-testid={`onboarding-step-${stepId}`}
                                    disabled={done || busyStep === stepId}
                                    onClick={() => runStep(step)}
                                    className={`px-3 py-1.5 rounded border text-[9px] font-mono uppercase tracking-[0.14em] ${
                                        done
                                            ? 'border-emerald-300/30 bg-emerald-500/10 text-emerald-200'
                                            : 'border-cyan-300/30 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20'
                                    } disabled:opacity-60`}
                                >
                                    {done ? 'Done' : busyStep === stepId ? 'Running' : 'Run'}
                                </button>
                            </div>
                        );
                    })}
                </div>
                <div className="mt-4 flex items-center justify-between">
                    <div className="text-[10px] font-mono text-slate-500">
                        Funnel events are logged locally for drop-off tracking.
                    </div>
                    <button
                        type="button"
                        data-testid="onboarding-finish-btn"
                        onClick={onClose}
                        className={`px-3 py-2 rounded border text-[10px] uppercase tracking-[0.16em] font-bold ${
                            allDone
                                ? 'border-emerald-300/30 bg-emerald-500/10 text-emerald-100'
                                : 'border-white/10 bg-white/5 text-slate-300'
                        }`}
                    >
                        {allDone ? 'Complete' : 'Close'}
                    </button>
                </div>
            </div>
        </div>
    );
}
