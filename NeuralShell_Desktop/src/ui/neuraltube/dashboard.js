
import { stateEngine } from "../../core/neuraltube/stateEngine.js";

export function buildDashboard() {
    const dash = document.createElement("div");
    dash.className = "ntxr-dashboard";

    const state = stateEngine.get();

    dash.innerHTML = `
        <h3>Signal Analytics</h3>
        <button class="dash-close" onclick="this.parentElement.classList.remove('open')">×</button>
        ${biasDistribution(state)}
        ${driftGraph(state)}
        ${channelSpread(state)}
        ${xpCurve(state)}
        ${patternRadar(state)}
    `;

    return dash;
}

function biasDistribution(state) {
    const axes = { trigger:0, emotion:0, conflict:0, authority:0, sensational:0 };
    state.patternMemory.forEach(p => { if (axes[p.axis] !== undefined) axes[p.axis] += p.count; });

    const max = Math.max(...Object.values(axes), 1);
    const bars = Object.entries(axes)
        .map(([k,v]) => `
            <div class="bar">
                <span>${k[0].toUpperCase()}</span>
                <div style="width:${(v/max)*100}%" class="bar-fill"></div>
                <span class="val">${v}</span>
             </div>`).join("");

    return `<div class="dash-block"><h4>Bias Axis Distribution</h4>${bars}</div>`;
}

function driftGraph(state) {
    const timeline = state.timeline || [];
    const graph = timeline.slice(-40).map(t => `<span style="height:${t.drift*4}px" class="drift-bar"></span>`).join("");
    return `<div class="dash-block"><h4>Drift Evolution</h4><div class="drift-graph">${graph}</div></div>`;
}

function channelSpread(state) {
    const channels = state.channels || {};
    const list = Object.entries(channels).map(([name,data]) => {
        const avg = (data.totalBias / data.count).toFixed(1);
        return `<div class="stat-row"><span>${name}</span> <span>${avg}</span></div>`;
    }).join("");
    return `<div class="dash-block"><h4>Channel Lean Spread</h4>${list}</div>`;
}

function xpCurve(state) {
    return `<div class="dash-block"><h4>XP Telemetry</h4>
        <div class="stat-row"><span>Tier</span> <span>${state.tier}</span></div>
        <div class="stat-row"><span>Total XP</span> <span>${state.xp}</span></div>
    </div>`;
}

function patternRadar(state) {
    const dominant = state.patternMemory.sort((a,b)=> b.count - a.count)[0];
    if (!dominant) return "";
    return `<div class="dash-block"><h4>Dominant Narrative</h4>
        <div class="stat-row"><span>Axis</span> <span>${dominant.axis}</span></div>
        <div class="stat-row"><span>Count</span> <span>${dominant.count}</span></div>
    </div>`;
}
