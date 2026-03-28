import React from "react";

export default function ChannelScorecard({ card }) {
    const safe = card && typeof card === "object" ? card : {};
    return (
        <article className="rounded border border-white/10 bg-black/30 px-2 py-1.5" role="listitem">
            <div className="text-[10px] font-mono text-slate-100">{String(safe.channelType || "channel")}</div>
            <div className="text-[9px] font-mono text-slate-400">score {Number(safe.score || 0)}</div>
            <div className="text-[9px] font-mono text-slate-500">status {String(safe.status || "unknown")}</div>
        </article>
    );
}
