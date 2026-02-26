
import { stateEngine } from "../../core/neuraltube/stateEngine.js";
import { biasEngine } from "../../core/neuraltube/biasEngine.js";
import { rankEngine } from "../../core/neuraltube/rankEngine.js";
import { feedEngine } from "../../core/neuraltube/feedEngine.js";

export function renderNeuralTube(appContainer, feedData) {
    appContainer.innerHTML = "";

    const header = buildHeader();
    const layout = buildLayout(feedData);

    appContainer.appendChild(header);
    appContainer.appendChild(layout);
}

function buildHeader() {
    const header = document.createElement("div");
    header.className = "ntxr-header";
    const state = stateEngine.get();

    header.innerHTML = `
        <div class="brand">NEURAL<span class="accent">tube</span> XR</div>
        <div class="controls">
            <button id="ntPauseBtn">${state.settings.pauseAlgorithm ? "Resume" : "Pause"} Algorithm</button>
            <button id="ntModeBtn">LeanDetect ${state.settings.leanDetectEnabled ? "ON" : "OFF"}</button>
            <button id="ntDashToggle">Analytics</button>
            ${(stateEngine.hasCapability("killSwitch") || state.founderOverride) ? `<button id="ntKillBtn" class="${state.killSwitch.active ? "kill-active" : ""}">Kill Switch</button>` : ""}
        </div>
    `;

    header.querySelector("#ntPauseBtn").onclick = () => {
        state.settings.pauseAlgorithm = !state.settings.pauseAlgorithm;
        stateEngine.addXP(5);
        stateEngine.save();
        location.reload();
    };

    header.querySelector("#ntModeBtn").onclick = () => {
        state.settings.leanDetectEnabled = !state.settings.leanDetectEnabled;
        stateEngine.save();
        location.reload();
    };

    header.querySelector("#ntDashToggle").onclick = () => {
        const dash = document.querySelector(".ntxr-dashboard");
        if (dash) dash.classList.toggle("open");
    };

    const killBtn = header.querySelector("#ntKillBtn");
    if (killBtn) {
        killBtn.onclick = () => {
            stateEngine.toggleKillSwitch();
            location.reload();
        };
    }

    if (state.killSwitch.active) header.classList.add("kill-active");
    if (state.settings.pauseAlgorithm) header.classList.add("alert");

    return header;
}

function buildLayout(feedData) {
    const container = document.createElement("div");
    container.className = "ntxr-container";

    const feed = buildFeed(feedData);
    const sidebar = buildSidebar();

    container.appendChild(feed);
    container.appendChild(sidebar);

    return container;
}

function buildFeed(feedData) {
    const feed = document.createElement("div");
    feed.className = "ntxr-feed";

    feedData.forEach(item => {
        const card = document.createElement("div");
        card.className = `ntxr-card heat-${item.heat}`;

        card.innerHTML = `
            <div class="title">${item.title}</div>
            <div class="meta">
                Worth: <span class="worth">${item.worth}</span>
                Bias: <span class="bias">${item.bias.biasScore}</span>
                <span class="platform chip">${item.platform}</span>
            </div>
            ${stateEngine.get().settings.leanDetectEnabled ? `
                <div class="vector">
                    T:${item.bias.vector.trigger}
                    E:${item.bias.vector.emotion}
                    C:${item.bias.vector.conflict}
                    A:${item.bias.vector.authority}
                    S:${item.bias.vector.sensational}
                </div>
            ` : ""}
        `;

        card.onclick = () => {
            const gained = stateEngine.addXP(item.worth, item.bias);
            stateEngine.recordBias(item.bias.biasScore);
            stateEngine.recordPattern(item, item.bias);
            stateEngine.recordChannel(item, item.bias);
            stateEngine.recordTimeline();
            pulseXP(gained);
            // Optionally update UI without reload if performance allows
        };

        feed.appendChild(card);
    });

    return feed;
}

function buildSidebar() {
    const sidebar = document.createElement("div");
    sidebar.className = "ntxr-sidebar";

    const state = stateEngine.get();

    sidebar.innerHTML = `
        <div class="tier-block">
            <div class="tier">Tier ${state.tier}</div>
            <div class="xp">
                XP: ${state.xp}
                <div class="xp-bar">
                    <div class="xp-fill" style="width:${tierProgress()}%"></div>
                </div>
            </div>
            <div class="drift">Drift: ${stateEngine.driftScore().toFixed(2)}</div>
        </div>

        <div class="pattern-block">
            <h4>Narrative Saturation</h4>
            ${stateEngine.get().patternMemory
                .sort((a,b)=> b.count - a.count)
                .slice(0,3)
                .map(p => `<div class="pattern">${p.axis}: ${p.count}</div>`)
                .join("")}
        </div>

        <div class="channel-block">
            <h4>Channel Bias</h4>
            ${Object.entries(state.channels || {})
                .map(([name,data])=>({ name, avg: (data.totalBias / data.count).toFixed(1) }))
                .sort((a,b)=> b.avg - a.avg)
                .slice(0,3)
                .map(c=>`<div>${c.name}: ${c.avg}</div>`)
                .join("")}
        </div>

        <div class="timeline">
            <h4>Bias Drift Evolution</h4>
            <div style="display:flex;align-items:flex-end;height:40px;margin-top:8px">
                ${(state.timeline || []).slice(-20).map(t =>
                    `<span style="display:inline-block;width:4px;height:${t.drift*2}px;background:#2fff9b;margin-right:1px;"></span>`
                ).join("")}
            </div>
        </div>

        ${stateEngine.hasCapability("labToggle") ? `
            <div class="lab-block">
                <h4>NeuralLab™</h4>
                <button id="ntLabToggle">${state.lab.enabled ? "Disable Lab" : "Enable Lab"}</button>
                ${state.lab.enabled ? `
                    <div class="lab-controls">
                        ${stateEngine.hasCapability("simulatedDrift") ? `
                            <label>Sim Drift:
                                <input type="number" id="ntSimDrift" value="${state.lab.simulatedDrift || ""}">
                            </label>
                        ` : ""}
                        ${stateEngine.hasCapability("mutationControl") ? `
                            <label>
                                <input type="checkbox" id="ntMutToggle" ${state.lab.mutationDisabled ? "checked" : ""}> Disable Mutation
                            </label>
                        ` : ""}
                    </div>
                ` : ""}
            </div>
        ` : `<div class="locked">Lab Locked: Tier 3 required</div>`}

        ${stateEngine.hasCapability("fullOverride") ? `
            <div class="founder-block">
                <h4>Founder Override™</h4>
                <button id="ntFounderToggle">${state.founderOverride ? "Disable Override" : "Enable Override"}</button>
                ${state.founderOverride ? `
                    <button id="ntDriftReset">Reset Drift</button>
                    <button id="ntReshuffle">Reshuffle Feed</button>
                    <button id="ntInjectXP">Inject 500 XP</button>
                ` : ""}
            </div>
        ` : ""}
    `;

    // Handlers
    setTimeout(() => {
        const labToggle = sidebar.querySelector("#ntLabToggle");
        if (labToggle) labToggle.onclick = () => { stateEngine.toggleLab(); location.reload(); };

        const simDrift = sidebar.querySelector("#ntSimDrift");
        if (simDrift) simDrift.onchange = e => { stateEngine.setSimulatedDrift(Number(e.target.value)); location.reload(); };

        const mutToggle = sidebar.querySelector("#ntMutToggle");
        if (mutToggle) mutToggle.onchange = () => { stateEngine.toggleMutation(); location.reload(); };

        const founderToggle = sidebar.querySelector("#ntFounderToggle");
        if (founderToggle) founderToggle.onclick = () => { stateEngine.toggleFounderOverride(); location.reload(); };

        const driftReset = sidebar.querySelector("#ntDriftReset");
        if (driftReset) driftReset.onclick = () => { stateEngine.get().leanHistory = []; stateEngine.save(); location.reload(); };

        const reshuffle = sidebar.querySelector("#ntReshuffle");
        if (reshuffle) reshuffle.onclick = () => { location.reload(); };

        const injectXP = sidebar.querySelector("#ntInjectXP");
        if (injectXP) injectXP.onclick = () => { stateEngine.addXP(500); location.reload(); };
    }, 0);

    return sidebar;
}

function tierProgress() {
    const state = stateEngine.get();
    const current = Math.floor(150 * Math.pow(state.tier-1, 1.8));
    const next = Math.floor(150 * Math.pow(state.tier, 1.8));
    if (state.tier === 1) return (state.xp / next) * 100;
    return ((state.xp - current) / (next - current)) * 100;
}

function pulseXP(amount) {
    const header = document.querySelector(".ntxr-header");
    header.classList.add("xp-pulse");
    const xpPopup = document.createElement("div");
    xpPopup.className = "xp-popup";
    xpPopup.innerText = `+${amount} XP`;
    header.appendChild(xpPopup);
    setTimeout(()=> {
        header.classList.remove("xp-pulse");
        xpPopup.remove();
    }, 600);
}
