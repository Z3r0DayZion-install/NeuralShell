const { exec } = require("child_process");
const path = require("path");

// Path to the NeuralLink CLI
// NOTE: Adjusting for the user's environment
const CLI_PATH = "neural-link.exe";

function runLinkCommand(args) {
    return new Promise((resolve, reject) => {
        exec(`${CLI_PATH} ${args}`, (error, stdout, stderr) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(stdout.trim());
        });
    });
}

module.exports = {
    onLoad: async () => {
        console.log("NeuralLink™ Bridge Plugin Loaded");
    },

    commands: [
        {
            name: "link.devices",
            description: "List available NeuralLink™ devices.",
            args: [],
            execute: async () => {
                try {
                    const output = await runLinkCommand("devices");
                    return { output };
                } catch (err) {
                    throw new Error(`Failed to query devices: ${err.message}`);
                }
            }
        },
        {
            name: "link.transfers",
            description: "Show active NeuralLink™ transfers.",
            args: [],
            execute: async () => {
                try {
                    const output = await runLinkCommand("transfers");
                    return { output };
                } catch (err) {
                    throw new Error(`Failed to query transfers: ${err.message}`);
                }
            }
        },
        {
            name: "link.send",
            description: "Send a file to a peer. Usage: /link.send <path> <peer_id>",
            args: ["path", "peer_id"],
            execute: async (ctx) => {
                const filePath = ctx.args[0];
                const peerId = ctx.args[1];
                if (!filePath || !peerId) {
                    throw new Error("Usage: /link.send <path> <peer_id>");
                }
                try {
                    const output = await runLinkCommand(`send "${filePath}" --to ${peerId}`);
                    return { status: "queued", output };
                } catch (err) {
                    throw new Error(`Transfer failed: ${err.message}`);
                }
            }
        },
        {
            name: "link.metrics",
            description: "View real-time NeuralLink™ kernel metrics.",
            args: [],
            execute: async () => {
                try {
                    const output = await runLinkCommand("get-metrics");
                    const metrics = JSON.parse(output);
                    return {
                        "Uptime": `${metrics.uptime_secs}s`,
                        "Throughput": `Sent: ${metrics.throughput.total_sent}B | Recv: ${metrics.throughput.total_received}B`,
                        "Scheduler": `Active: ${metrics.scheduler.active_transfers} | Queued: ${metrics.scheduler.queued_transfers}`,
                        "Health": metrics.health.is_under_pressure ? "CRITICAL (Backpressure)" : "Healthy"
                    };
                } catch (err) {
                    throw new Error(`Failed to query metrics: ${err.message}`);
                }
            }
        },
        {
            name: "link.identity",
            description: "Show this device's NeuralLink™ identity fingerprint and trusted peers.",
            args: [],
            execute: async (ctx) => {
                try {
                    const identity = await ctx.api.identity.pubkey();
                    const peers = await ctx.api.identity.listPeers();
                    const peerLines = peers.length
                        ? peers.map(p => `  ${p.label} (${p.fingerprint})`).join("\n")
                        : "  None";
                    return {
                        "Fingerprint": identity.fingerprint,
                        "Trusted Peers": peerLines
                    };
                } catch (err) {
                    throw new Error(`Identity query failed: ${err.message}`);
                }
            }
        },
        {
            name: "link.trust",
            description: "Trust a peer device. Usage: /link.trust <deviceId> <pubKeyPem> [label]",
            args: ["deviceId", "pubKeyPem", "label"],
            execute: async (ctx) => {
                const [deviceId, pubKeyPem, label] = ctx.args;
                if (!deviceId || !pubKeyPem) {
                    throw new Error("Usage: /link.trust <deviceId> <pubKeyPem> [label]");
                }
                try {
                    await ctx.api.identity.trustPeer(deviceId, pubKeyPem, label || deviceId);
                    return { status: "Trust granted", deviceId, label: label || deviceId };
                } catch (err) {
                    throw new Error(`Trust failed: ${err.message}`);
                }
            }
        }
    ]
};
