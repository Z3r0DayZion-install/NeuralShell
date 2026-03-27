/**
 * Shell Module Registry — NeuralShell V2.1.29+
 *
 * Provides a slot-based registration system for pluggable shell modules.
 * Modules declare what zone/slot they belong to, and the shell renders
 * them from the registry instead of hardcoded imports.
 *
 * SLOTS:
 *   workbench.summary    — WorkbenchRail trust/status cards
 *   workbench.outputs    — WorkbenchRail output panels
 *   workbench.runtime    — WorkbenchRail runtime diagnostics
 *   settings.general     — SettingsDrawer general section
 *   settings.integrity   — SettingsDrawer integrity section
 *   palette.commands     — CommandPalette action commands
 *   palette.system       — CommandPalette system commands
 *
 * Each module declares:
 *   id        — unique identifier
 *   slot      — target slot
 *   title     — display name
 *   priority  — render order (lower = first)
 *   visible   — function returning visibility boolean
 *   component — React component (for panel slots)
 *   action    — function (for command slots)
 */

// ── Registry Store ──
const _modules = [];

/**
 * Register a module in the shell.
 * @param {object} module
 * @param {string} module.id
 * @param {string} module.slot
 * @param {string} module.title
 * @param {number} [module.priority=100]
 * @param {Function} [module.visible] - () => boolean
 * @param {React.ComponentType} [module.component]
 * @param {Function} [module.action] - (context) => void
 * @param {string} [module.shortcut] - e.g. "Ctrl + 1"
 * @param {string} [module.stability] - "core" | "trusted" | "experimental"
 */
export function registerModule(module) {
    if (!module.id || !module.slot) {
        throw new Error(`Module registration requires id and slot: ${JSON.stringify(module)}`);
    }
    // Prevent duplicates
    const existing = _modules.findIndex(m => m.id === module.id);
    if (existing >= 0) {
        _modules[existing] = { priority: 100, stability: 'trusted', visible: () => true, ...module };
    } else {
        _modules.push({ priority: 100, stability: 'trusted', visible: () => true, ...module });
    }
}

/**
 * Get all modules for a given slot, sorted by priority.
 * Filters out invisible and (optionally) experimental modules.
 * @param {string} slot
 * @param {object} [opts]
 * @param {boolean} [opts.includeExperimental=false]
 * @returns {Array<object>}
 */
export function getModulesForSlot(slot, opts = {}) {
    const { includeExperimental = false } = opts;
    return _modules
        .filter(m => m.slot === slot)
        .filter(m => includeExperimental || m.stability !== 'experimental')
        .filter(m => m.visible())
        .sort((a, b) => a.priority - b.priority);
}

/**
 * Get all registered palette commands.
 * @param {object} [opts]
 * @param {boolean} [opts.includeExperimental=false]
 * @returns {Array<object>}
 */
export function getPaletteCommands(opts = {}) {
    return [
        ...getModulesForSlot('palette.commands', opts),
        ...getModulesForSlot('palette.system', opts),
    ];
}

/**
 * Clear all registrations (for testing).
 */
export function clearRegistry() {
    _modules.length = 0;
}

/**
 * Get the full registry (for debugging/diagnostics).
 */
export function getRegistry() {
    return [..._modules];
}

// ── Default Registrations ──
// Core palette commands (Hardened for V2.1.29)
registerModule({
    id: 'cmd-purge',
    slot: 'palette.commands',
    title: 'Purge Workflow History',
    priority: 30,
    stability: 'core',
    action: () => {
        if (window.api && window.api.ritual) {
            window.api.ritual.execute('purge');
        }
    },
});

registerModule({
    id: 'cmd-clear',
    slot: 'palette.system',
    title: 'Clear History',
    priority: 10,
    stability: 'core',
    action: (ctx) => {
        if (ctx && typeof ctx.setChatLog === 'function') {
            ctx.setChatLog([]);
        }
    },
});

registerModule({
    id: 'cmd-status',
    slot: 'palette.system',
    title: 'Show System Status',
    priority: 20,
    stability: 'core',
    action: (ctx) => {
        if (ctx && typeof ctx.appendChat === 'function') {
            ctx.appendChat({
                role: 'assistant',
                content: `Node Status: OPERATIONAL\nIntegrity: SEALED\nCPU: ${ctx.stats.cpuPercent}%\nMemory: ${ctx.stats.memoryMb}MB`
            });
        }
    },
});

registerModule({
    id: 'cmd-help',
    slot: 'palette.system',
    title: 'Show Help Guide',
    priority: 50,
    stability: 'core',
    action: (ctx) => {
        if (ctx && typeof ctx.appendChat === 'function') {
            ctx.appendChat({
                role: 'assistant',
                content: "### NeuralShell Help Guide\n\n- `/help` : Show this guide\n- `/status` : Check node telemetry\n- `/clear` : Clear current thread\n- `/purge` : Delete all session history\n- `Ctrl+P` : Open Command Palette"
            });
        }
    },
});
