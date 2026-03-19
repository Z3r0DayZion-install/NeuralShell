const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

/**
 * NeuralShell Preflight Guardrails
 * Checks environmental requirements before action execution.
 */

async function checkSafe(rootPath, requirement, context = {}) {
    const normalizedRoot = rootPath ? path.resolve(rootPath) : null;

    switch (requirement) {
        case "has_workspace":
            return { ok: !!normalizedRoot && fs.existsSync(normalizedRoot), reason: "No workspace attached" };

        case "has_package_json":
            if (!normalizedRoot) return { ok: false, reason: "No workspace" };
            const hasPkg = fs.existsSync(path.join(normalizedRoot, "package.json"));
            return { ok: hasPkg, reason: hasPkg ? null : "package.json missing" };

        case "has_node_modules":
            if (!normalizedRoot) return { ok: false, reason: "No workspace" };
            const hasModules = fs.existsSync(path.join(normalizedRoot, "node_modules"));
            return { ok: hasModules, reason: hasModules ? null : "node_modules missing (Run npm install)" };

        case "has_git":
            if (!normalizedRoot) return { ok: false, reason: "No workspace" };
            const hasGit = fs.existsSync(path.join(normalizedRoot, ".git"));
            return { ok: hasGit, reason: hasGit ? null : "Not a git repository" };

        case "is_git_clean":
            if (!normalizedRoot || !fs.existsSync(path.join(normalizedRoot, ".git"))) {
                return { ok: false, reason: "Git not initialized" };
            }
            try {
                const status = execSync("git status --porcelain", { cwd: normalizedRoot }).toString().trim();
                return { ok: status === "", reason: status ? "Git tree is dirty" : null };
            } catch {
                return { ok: false, reason: "Git status check failed" };
            }

        case "has_build_script":
            if (!normalizedRoot) return { ok: false, reason: "No workspace" };
            const bPkgPath = path.join(normalizedRoot, "package.json");
            if (!fs.existsSync(bPkgPath)) return { ok: false, reason: "package.json missing" };
            try {
                const pkg = JSON.parse(fs.readFileSync(bPkgPath, "utf8"));
                const hasBuild = !!(pkg.scripts && pkg.scripts.build);
                return { ok: hasBuild, reason: hasBuild ? null : "No 'build' script found" };
            } catch {
                return { ok: false, reason: "Failed to parse package.json" };
            }

        case "has_playwright":
            if (!normalizedRoot) return { ok: false, reason: "No workspace" };
            const pwPkgPath = path.join(normalizedRoot, "package.json");
            try {
                const pkg = JSON.parse(fs.readFileSync(pwPkgPath, "utf8"));
                const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
                const hasPw = !!deps.playwright;
                return { ok: hasPw, reason: hasPw ? null : "Playwright not found in dependencies" };
            } catch {
                return { ok: false, reason: "Failed to parse package.json" };
            }

        case "has_session_history":
            const hasHistory = Array.isArray(context.chat) && context.chat.length > 0;
            return { ok: hasHistory, reason: hasHistory ? null : "No session history available" };

        default:
            return { ok: true, reason: null };
    }
}

async function runPreflight(actionDef, rootPath, context = {}) {
    if (!actionDef.preflight || !Array.isArray(actionDef.preflight)) {
        return { ok: true, status: "ready" };
    }

    for (const req of actionDef.preflight) {
        const res = await checkSafe(rootPath, req, context);
        if (!res.ok) {
            return { ok: false, status: "blocked", reason: res.reason || `Requirement failed: ${req}` };
        }
    }

    return { ok: true, status: "ready" };
}

module.exports = {
    runPreflight
};
