export type IncidentSeverity = "warning" | "degraded" | "critical";

export type IncidentRecord = {
  incidentId: string;
  title: string;
  severity: IncidentSeverity;
  status: "open" | "resolved";
  declaredAt: string;
  resolvedAt?: string;
  affectedNodes: string[];
  timeline: Array<{
    at: string;
    type: string;
    source: string;
    detail: Record<string, any>;
  }>;
};

export class IncidentEngine {
  private incidents: IncidentRecord[];

  constructor(seed: IncidentRecord[] = []) {
    this.incidents = Array.isArray(seed) ? seed : [];
  }

  list() {
    return this.incidents.slice().sort((a, b) => String(b.declaredAt).localeCompare(String(a.declaredAt)));
  }

  declareIncident(input: {
    title: string;
    severity: IncidentSeverity;
    affectedNodes?: string[];
  }) {
    const incident: IncidentRecord = {
      incidentId: `inc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: String(input && input.title ? input.title : "Runtime Incident"),
      severity: (input && input.severity ? input.severity : "degraded") as IncidentSeverity,
      status: "open",
      declaredAt: new Date().toISOString(),
      affectedNodes: Array.isArray(input && input.affectedNodes) ? input.affectedNodes : [],
      timeline: [],
    };
    this.incidents.push(incident);
    return incident;
  }

  attachEvent(incidentId: string, event: { type: string; source: string; detail?: Record<string, any> }) {
    this.incidents = this.incidents.map((incident) => {
      if (incident.incidentId !== incidentId) return incident;
      return {
        ...incident,
        timeline: [...incident.timeline, {
          at: new Date().toISOString(),
          type: String(event && event.type ? event.type : "runtime.event"),
          source: String(event && event.source ? event.source : "runtime"),
          detail: event && event.detail && typeof event.detail === "object" ? event.detail : {},
        }].slice(-400),
      };
    });
  }

  resolveIncident(incidentId: string) {
    this.incidents = this.incidents.map((incident) => {
      if (incident.incidentId !== incidentId) return incident;
      return {
        ...incident,
        status: "resolved",
        resolvedAt: new Date().toISOString(),
      };
    });
  }
}

export default IncidentEngine;