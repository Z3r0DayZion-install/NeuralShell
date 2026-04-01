const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

/**
 * NeuralShell Workspace Registry
 * Manages the fleet of registered project roots and their persistent profiles.
 */
class WorkspaceRegistry {
    constructor() {
        this.workspaces = new Map(); // id -> workspaceObject
        this.activeWorkspaceId = null;
        this.storagePath = null;
    }

    init(storageDir) {
        this.storagePath = path.join(storageDir, "workspace_registry.json");
        if (fs.existsSync(this.storagePath)) {
            try {
                const data = JSON.parse(fs.readFileSync(this.storagePath, "utf8"));
                if (data.workspaces) {
                    data.workspaces.forEach(ws => this.workspaces.set(ws.id, ws));
                }
                this.activeWorkspaceId = data.activeWorkspaceId || null;
            } catch (err) {
                console.error("Failed to load workspace registry:", err);
            }
        }
    }

    register(rootPath, intelligence = {}) {
        const normalizedPath = path.resolve(String(rootPath || "").trim());
        const id = crypto.createHash("md5").update(normalizedPath).digest("hex");

        const workspace = {
            id,
            path: normalizedPath,
            label: path.basename(normalizedPath) || normalizedPath,
            profile: {
                techStack: intelligence.techStack || [],
                signals: intelligence.signals || [],
                lowConfidence: !!intelligence.lowConfidence
            },
            lastSeen: Date.now(),
            status: "idle"
        };

        this.workspaces.set(id, workspace);
        if (!this.activeWorkspaceId) this.activeWorkspaceId = id;

        this.save();
        return workspace;
    }

    unregister(id) {
        const deleted = this.workspaces.delete(id);
        if (this.activeWorkspaceId === id) {
            const keys = Array.from(this.workspaces.keys());
            this.activeWorkspaceId = keys.length > 0 ? keys[0] : null;
        }
        this.save();
        return deleted;
    }

    getWorkspaces() {
        return Array.from(this.workspaces.values());
    }

    getActiveWorkspace() {
        return this.workspaces.get(this.activeWorkspaceId);
    }

    setActiveWorkspace(id) {
        if (this.workspaces.has(id)) {
            this.activeWorkspaceId = id;
            this.save();
            return true;
        }
        return false;
    }

    updateWorkspaceStatus(id, status) {
        const ws = this.workspaces.get(id);
        if (ws) {
            ws.status = status;
            ws.lastSeen = Date.now();
            this.save();
        }
    }

    save() {
        if (!this.storagePath) return;
        try {
            const data = {
                workspaces: this.getWorkspaces(),
                activeWorkspaceId: this.activeWorkspaceId
            };
            fs.writeFileSync(this.storagePath, JSON.stringify(data, null, 2));
        } catch (err) {
            console.error("Failed to save workspace registry:", err);
        }
    }
}

const workspaceRegistry = new WorkspaceRegistry();
module.exports = workspaceRegistry;
