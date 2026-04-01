import React from "react";
import { readTextFile } from "../utils/recordIO.js";
import { verifyArtifactSignature } from "../utils/signedArtifacts.js";

export default function UpdatePackManager({
    onPackVerified,
}) {
    const [status, setStatus] = React.useState("");
    const [error, setError] = React.useState("");
    const [pack, setPack] = React.useState(null);

    const importPack = async (event) => {
        const file = event && event.target && event.target.files ? event.target.files[0] : null;
        if (!file) return;
        try {
            const text = await readTextFile(file);
            const parsed = JSON.parse(String(text || "{}"));
            const payload = parsed && parsed.payload && typeof parsed.payload === "object" ? parsed.payload : null;
            const signature = String(parsed && parsed.signature ? parsed.signature : "");
            const publicKeyPem = String(parsed && parsed.signer && parsed.signer.publicKeyPem ? parsed.signer.publicKeyPem : "");
            if (!payload || !signature || !publicKeyPem) {
                throw new Error("Update pack missing payload/signature/public key.");
            }
            const valid = await verifyArtifactSignature(payload, signature, publicKeyPem);
            if (!valid) {
                throw new Error("Unverified update pack rejected.");
            }
            setPack(parsed);
            setStatus(`Verified update pack ${String(payload.version || "unknown")}/${String(payload.ring || "standard")}.`);
            setError("");
            if (typeof onPackVerified === "function") onPackVerified(parsed);
        } catch (err) {
            setPack(null);
            setStatus("");
            setError(err && err.message ? err.message : String(err));
        } finally {
            if (event && event.target) event.target.value = "";
        }
    };

    return (
        <section data-testid="update-pack-manager" className="rounded-xl border border-white/10 bg-black/25 p-3 space-y-2">
            <div className="text-[9px] uppercase tracking-[0.14em] text-cyan-300 font-bold">Offline Update Pack Manager</div>
            <label className="inline-flex items-center px-2 py-1 rounded border border-cyan-300/30 bg-cyan-500/10 text-[9px] font-mono uppercase tracking-[0.12em] text-cyan-100 cursor-pointer">
                Import Signed Pack
                <input
                    data-testid="update-pack-import-input"
                    type="file"
                    accept=".json,application/json"
                    className="hidden"
                    onChange={importPack}
                />
            </label>
            {status && <div className="text-[10px] font-mono text-emerald-200">{status}</div>}
            {error && <div data-testid="update-pack-error" className="text-[10px] font-mono text-rose-200">{error}</div>}
            {pack && (
                <div data-testid="update-pack-verified" className="rounded border border-white/10 bg-black/30 px-2 py-1 text-[10px] font-mono text-slate-300">
                    Pack ID: {String(pack && pack.payload && pack.payload.packId ? pack.payload.packId : pack && pack.payload && pack.payload.version ? `pack-${pack.payload.version}` : "n/a")}
                </div>
            )}
        </section>
    );
}