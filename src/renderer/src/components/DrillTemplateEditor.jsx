import React from "react";

export default function DrillTemplateEditor({
    templates,
    selectedTemplateId,
    onSelectTemplate,
    onUpdateTemplates,
}) {
    const safeTemplates = Array.isArray(templates) ? templates : [];

    return (
        <section className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
            <div>
                <div className="text-[9px] uppercase tracking-[0.14em] text-slate-300 font-bold">Drill Templates</div>
                <div className="text-[10px] text-slate-500 font-mono">Scenario definitions for repeatable continuity exercises.</div>
            </div>
            <div className="space-y-1 max-h-[240px] overflow-auto pr-1">
                {safeTemplates.map((template) => (
                    <button
                        key={template.templateId}
                        type="button"
                        data-testid={`drill-template-${template.templateId}`}
                        onClick={() => {
                            if (typeof onSelectTemplate === "function") onSelectTemplate(template.templateId);
                        }}
                        className={`w-full text-left rounded border px-2 py-1.5 ${
                            selectedTemplateId === template.templateId
                                ? "border-cyan-300/35 bg-cyan-500/15"
                                : "border-white/10 bg-black/20"
                        }`}
                    >
                        <div className="text-[10px] font-mono text-slate-100">{template.title}</div>
                        <div className="text-[9px] font-mono text-slate-500">{template.scenarioId}</div>
                    </button>
                ))}
            </div>
            <button
                type="button"
                data-testid="drill-template-add-btn"
                onClick={() => {
                    const next = {
                        templateId: `drill-custom-${Date.now()}`,
                        scenarioId: "support_incident_export",
                        title: "Custom Continuity Drill",
                        expectedState: { exportCompleted: true, trustState: "valid" },
                        checklist: ["run scenario", "capture evidence", "review deltas"],
                    };
                    if (typeof onUpdateTemplates === "function") {
                        onUpdateTemplates([next, ...safeTemplates].slice(0, 40));
                    }
                }}
                className="w-full px-3 py-1.5 rounded border border-cyan-300/30 bg-cyan-500/10 text-[10px] font-mono uppercase tracking-[0.12em] text-cyan-100"
            >
                Add Template
            </button>
        </section>
    );
}
