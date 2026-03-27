import React from 'react';
import SalesConsole from './SalesConsole';
import PilotKitConsole from './PilotKitConsole';
import BrandingOverrides from './BrandingOverrides';
import PartnerConsole from './PartnerConsole';
import CertificationCenter from './CertificationCenter';
import BoardConsole from './BoardConsole';
import EnterprisePolicySuite from './EnterprisePolicySuite';
import CustomerSuccessConsole from './CustomerSuccessConsole';
import ExpansionPlanner from './ExpansionPlanner';
import {
    ECOSYSTEM_MODULES,
    canAccessEcosystemModule,
    getAccessibleEcosystemModules,
} from '../routes/ecosystem.ts';

const ROLE_STORAGE_KEY = 'neuralshell_ecosystem_role_v1';

const ROLE_OPTIONS = [
    { id: 'founder', label: 'Founder' },
    { id: 'sales', label: 'Sales' },
    { id: 'support', label: 'Support' },
    { id: 'operator', label: 'Operator' },
];

function loadRole() {
    if (typeof window === 'undefined' || !window.localStorage) return 'founder';
    const stored = String(window.localStorage.getItem(ROLE_STORAGE_KEY) || '').trim().toLowerCase();
    return ROLE_OPTIONS.some((role) => role.id === stored) ? stored : 'founder';
}

function EcosystemHome({ role, tierId, moduleCount }) {
    return (
        <section data-testid="ecosystem-home" className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-3">
            <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300 font-bold">Ecosystem Command Center</div>
            <div className="text-[11px] text-slate-300">
                NeuralShell ecosystem mode links enterprise sales, partner ops, certification workflows, policy enforcement, and board reporting into one local-first surface.
            </div>
            <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                    <div className="text-[9px] uppercase tracking-[0.1em] text-slate-500">Role</div>
                    <div className="text-[13px] text-slate-100 font-bold">{role}</div>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                    <div className="text-[9px] uppercase tracking-[0.1em] text-slate-500">Tier</div>
                    <div className="text-[13px] text-slate-100 font-bold">{tierId || 'free'}</div>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                    <div className="text-[9px] uppercase tracking-[0.1em] text-slate-500">Modules</div>
                    <div className="text-[13px] text-slate-100 font-bold">{moduleCount}</div>
                </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/20 p-3 text-[10px] font-mono text-slate-400">
                Use role + tier controls to validate access boundaries for Sales, Support, Founder, and Operator views.
            </div>
        </section>
    );
}

export default function EcosystemLauncher({
    open,
    onClose,
    capabilities = [],
    tierId = 'free',
}) {
    const [role, setRole] = React.useState(() => loadRole());
    const [activeModuleId, setActiveModuleId] = React.useState('ecosystem_launcher');

    React.useEffect(() => {
        if (typeof window === 'undefined' || !window.localStorage) return;
        window.localStorage.setItem(ROLE_STORAGE_KEY, role);
    }, [role]);

    const accessibleModules = React.useMemo(
        () => getAccessibleEcosystemModules(role, tierId, capabilities),
        [capabilities, role, tierId],
    );

    React.useEffect(() => {
        if (!accessibleModules.some((item) => item.id === activeModuleId)) {
            setActiveModuleId(accessibleModules[0] ? accessibleModules[0].id : 'ecosystem_launcher');
        }
    }, [accessibleModules, activeModuleId]);

    const activeModule = accessibleModules.find((item) => item.id === activeModuleId) || null;

    if (!open) return null;

    return (
        <>
            <div className="fixed inset-0 z-[95] bg-black/55 backdrop-blur-sm" onClick={onClose} />
            <aside data-testid="ecosystem-launcher" className="fixed inset-x-4 top-16 bottom-4 z-[96] rounded-2xl border border-cyan-400/30 bg-slate-950 shadow-[0_20px_80px_rgba(0,0,0,0.65)] overflow-hidden flex min-h-0">
                <div className="w-72 border-r border-white/10 bg-black/35 p-3 flex flex-col gap-3 overflow-auto">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300 font-bold">Ecosystem Launcher</div>
                            <div className="text-[9px] text-slate-500 font-mono">Role-aware navigation</div>
                        </div>
                        <button
                            type="button"
                            data-testid="ecosystem-close-btn"
                            onClick={onClose}
                            className="h-8 w-8 rounded-full border border-white/10 text-slate-300 hover:text-white hover:bg-white/10"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="rounded-lg border border-white/10 bg-black/20 p-2">
                        <label className="text-[9px] uppercase tracking-[0.12em] text-slate-500 font-mono">Role</label>
                        <select
                            data-testid="ecosystem-role-select"
                            value={role}
                            onChange={(event) => setRole(event.target.value)}
                            className="mt-1 w-full bg-slate-900 border border-white/10 rounded px-2 py-1 text-[10px] font-mono text-slate-200"
                        >
                            {ROLE_OPTIONS.map((entry) => (
                                <option key={entry.id} value={entry.id}>{entry.label}</option>
                            ))}
                        </select>
                        <div className="mt-1 text-[9px] text-slate-500 font-mono">Tier {String(tierId || 'free')}</div>
                    </div>

                    <div className="space-y-1">
                        {accessibleModules.map((moduleDef) => (
                            <button
                                key={moduleDef.id}
                                type="button"
                                data-testid={`ecosystem-module-${moduleDef.id}`}
                                onClick={() => setActiveModuleId(moduleDef.id)}
                                className={`w-full text-left px-2.5 py-2 rounded-lg border text-[10px] font-mono ${
                                    activeModuleId === moduleDef.id
                                        ? 'border-cyan-300/40 bg-cyan-500/15 text-cyan-100'
                                        : 'border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/10'
                                }`}
                            >
                                <div className="font-bold uppercase tracking-[0.1em]">{moduleDef.title}</div>
                                <div className="text-[9px] text-slate-500 mt-0.5">{moduleDef.description}</div>
                            </button>
                        ))}
                    </div>

                    <div className="pt-2 border-t border-white/10 space-y-1">
                        {ECOSYSTEM_MODULES.filter((moduleDef) => (
                            !canAccessEcosystemModule(moduleDef, role, tierId, capabilities)
                        )).map((moduleDef) => (
                            <div
                                key={`locked-${moduleDef.id}`}
                                data-testid={`ecosystem-module-locked-${moduleDef.id}`}
                                className="px-2 py-1.5 rounded border border-white/10 bg-white/[0.02] text-[9px] font-mono text-slate-500"
                            >
                                {moduleDef.title} · locked ({moduleDef.minTier})
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex-1 min-h-0 overflow-auto p-4">
                    {!activeModule && (
                        <div className="text-[11px] font-mono text-slate-500">No module available for this role/tier.</div>
                    )}
                    {activeModule && activeModule.id === 'ecosystem_launcher' && (
                        <EcosystemHome role={role} tierId={String(tierId || 'free')} moduleCount={accessibleModules.length} />
                    )}
                    {activeModule && activeModule.id === 'sales_console' && <SalesConsole />}
                    {activeModule && activeModule.id === 'pilot_kit' && <PilotKitConsole />}
                    {activeModule && activeModule.id === 'white_label' && <BrandingOverrides />}
                    {activeModule && activeModule.id === 'partner_console' && <PartnerConsole />}
                    {activeModule && activeModule.id === 'certifications' && <CertificationCenter />}
                    {activeModule && activeModule.id === 'board_console' && <BoardConsole />}
                    {activeModule && activeModule.id === 'enterprise_policy' && <EnterprisePolicySuite />}
                    {activeModule && activeModule.id === 'customer_success' && <CustomerSuccessConsole />}
                    {activeModule && activeModule.id === 'expansion_planner' && <ExpansionPlanner />}
                </div>
            </aside>
        </>
    );
}

