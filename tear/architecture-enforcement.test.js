const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const RENDERER_COMPONENTS = path.resolve(__dirname, "../src/renderer/src/components");
const RENDERER_STATE = path.resolve(__dirname, "../src/renderer/src/state");
const CORE_DIR = path.resolve(__dirname, "../src/core");

test("Architecture Contract: No arbitrary HEX color tokens in UI components", () => {
    // Only an existing legacy baseline is allowed. New components must use tailwind theme colors.
    if (fs.existsSync(RENDERER_COMPONENTS)) {
        const files = fs.readdirSync(RENDERER_COMPONENTS).filter(f => f.endsWith('.jsx'));
        let arbitraryHexCount = 0;
        let arbitraryPxCount = 0;

        for (const file of files) {
            const content = fs.readFileSync(path.join(RENDERER_COMPONENTS, file), 'utf8');

            const hexMatches = content.match(/(?:bg|text|border|ring|shadow)-\[#[0-9a-fA-F]+\]/g);
            if (hexMatches) arbitraryHexCount += hexMatches.length;

            const pxMatches = content.match(/(?:p|m|gap|w|h|top|left|right|bottom)-\[\d+px\]/g);
            if (pxMatches) arbitraryPxCount += pxMatches.length;
        }

        // We lock the drift to existing numbers or lower. 
        assert.ok(arbitraryHexCount <= 1, `Found ${arbitraryHexCount} arbitrary hex values. Use strict design tokens from tailwind config instead.`);
        assert.ok(arbitraryPxCount <= 10, `Found ${arbitraryPxCount} arbitrary px values. Prevent spacing drift by using standard tailwind utilities.`);
    }
});

test("Architecture Contract: Module Registry commands must have strict schema binding", () => {
    const registryPath = path.join(RENDERER_STATE, "moduleRegistry.js");
    if (fs.existsSync(registryPath)) {
        const content = fs.readFileSync(registryPath, 'utf8');

        // Extract registerModule objects
        const modules = [...content.matchAll(/registerModule\(\{([\s\S]*?)\}\);/g)];
        assert.ok(modules.length > 0, "No modules found in registry");

        for (const m of modules) {
            const block = m[1];
            assert.ok(block.includes('id:'), "Module must have an id");
            assert.ok(block.includes('slot:'), "Module must have a slot declared");
            assert.ok(block.includes('title:'), "Module must have a display title");
            assert.ok(block.includes('action:') || block.includes('component:'), "Module must bind to a real action or a React component");

            // Check stability explicit definition
            const hasStability = block.includes("stability: 'core'") || block.includes("stability: 'experimental'") || block.includes("stability: 'trusted'");
            assert.ok(hasStability, "Module must explicitly declare a 'core', 'trusted', or 'experimental' stability label.");
        }
    }
});

test("Architecture Contract: State schemas must enforce versioning and persistence bounds", () => {
    const stateManagerPath = path.join(CORE_DIR, "stateManager.js");
    if (fs.existsSync(stateManagerPath)) {
        const content = fs.readFileSync(stateManagerPath, 'utf8');
        assert.ok(content.includes('stateVersion'), "stateManager.js must enforce stateVersion for persistence backwards compatibility");
        assert.ok(content.match(/stateVersion:\s*([A-Z_]+|\d+)/), "stateManager.js must start with an explicitly declared stateVersion number");
        assert.ok(content.includes('load()'), "StateManager must implement standard load lifecycle");
        assert.ok(content.includes('getState()') || content.includes('setState('), "StateManager must implement getter/setter access controls");
    }
});

test("Architecture Contract: Verified UI zone constraints", () => {
    const appPath = path.join(__dirname, "../src/renderer/src/App.jsx");
    if (fs.existsSync(appPath)) {
        const appContent = fs.readFileSync(appPath, 'utf8');
        assert.ok(appContent.includes('useShell') || appContent.includes('ShellProvider'), "App must invoke Shell context");
        assert.ok(!appContent.includes('absolute inset-0 z-[9999]'), "Root App should not contain raw overlay hacks");
    }
});

test("Architecture Contract: Critical components must retain E2E data-testid hooks", () => {
    if (!fs.existsSync(RENDERER_COMPONENTS)) return;

    const requiredHooks = {
        "TopStatusBar.jsx": ["top-status-bar", "trust-indicator", "settings-open-btn", "command-palette-btn"],
        "ThreadRail.jsx": ["thread-rail", "new-thread-btn"],
        "WorkspacePanel.jsx": ["workspace-panel", "chat-input"],
        "WorkbenchRail.jsx": ["workbench-rail"],
        "SettingsDrawer.jsx": ["settings-drawer"],
        "CommandPalette.jsx": ["command-palette"]
    };

    for (const [file, hooks] of Object.entries(requiredHooks)) {
        const filePath = path.join(RENDERER_COMPONENTS, file);
        assert.ok(fs.existsSync(filePath), `Critical component missing: ${file}`);
        const content = fs.readFileSync(filePath, 'utf8');

        for (const hook of hooks) {
            assert.ok(content.includes(`data-testid="${hook}"`), `Component ${file} is missing required E2E hook data-testid="${hook}". This prevents E2E test drift.`);
        }
    }
});

test("Architecture Contract: No Stubbed Registry Actions", () => {
    const registryPath = path.join(RENDERER_STATE, "moduleRegistry.js");
    if (fs.existsSync(registryPath)) {
        const content = fs.readFileSync(registryPath, 'utf8');
        const modules = [...content.matchAll(/registerModule\(\{([\s\S]*?)\}\);/g)];

        for (const m of modules) {
            const block = m[1];
            const isExperimental = block.includes("stability: 'experimental'");
            const isStubbed = block.includes("console.log(");

            if (!isExperimental) {
                assert.ok(!isStubbed, `Module in ${registryPath} with block ${block} is a stub with 'console.log' instead of a real action. Remove or move to 'experimental' stability.`);
            }
        }
    }
});

test("Architecture Contract: Command Routing Integrity in App.jsx", () => {
    const appPath = path.join(RENDERER_COMPONENTS, "../App.jsx");
    if (fs.existsSync(appPath)) {
        const content = fs.readFileSync(appPath, 'utf8');
        assert.ok(content.includes('executeSignal'), "App.jsx must implement a central signal execution router.");
        assert.ok(content.includes("command === '/help'"), "App.jsx must implement the mandatory '/help' command routing.");
        assert.ok(content.includes("command === '/clear'"), "App.jsx must implement the mandatory '/clear' command routing.");
    }
});
