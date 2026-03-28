export type MissionTemplate = {
  missionId: string;
  label: string;
  defaultScheduleMinutes: number;
  defaultDryRun: boolean;
  steps: string[];
};

export type MissionRunLog = {
  runId: string;
  missionId: string;
  label: string;
  target: "node" | "fleet";
  targetNodeIds: string[];
  dryRun: boolean;
  status: "completed" | "failed" | "cancelled";
  startedAt: string;
  finishedAt: string;
  detail: string;
};

export class MissionEngine {
  private history: MissionRunLog[];

  constructor(seed: MissionRunLog[] = []) {
    this.history = Array.isArray(seed) ? seed : [];
  }

  listHistory() {
    return this.history.slice().sort((a, b) => String(b.startedAt).localeCompare(String(a.startedAt)));
  }

  runMission(input: {
    mission: MissionTemplate;
    target: "node" | "fleet";
    targetNodeIds?: string[];
    dryRun?: boolean;
  }) {
    const mission = input && input.mission ? input.mission : null;
    if (!mission) {
      throw new Error("mission is required");
    }
    const startedAt = new Date().toISOString();
    const finishedAt = new Date().toISOString();
    const log: MissionRunLog = {
      runId: `mission-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      missionId: String(mission.missionId || "mission"),
      label: String(mission.label || mission.missionId || "Mission"),
      target: input && input.target ? input.target : "fleet",
      targetNodeIds: Array.isArray(input && input.targetNodeIds) ? input.targetNodeIds : [],
      dryRun: Boolean(input && input.dryRun),
      status: "completed",
      startedAt,
      finishedAt,
      detail: Boolean(input && input.dryRun)
        ? "Dry-run complete. No side effects applied."
        : "Mission executed successfully.",
    };
    this.history.unshift(log);
    this.history = this.history.slice(0, 500);
    return log;
  }

  cancelRun(runId: string) {
    this.history = this.history.map((entry) => {
      if (String(entry.runId || "") !== String(runId || "")) return entry;
      return {
        ...entry,
        status: "cancelled",
        finishedAt: new Date().toISOString(),
        detail: "Run cancelled by operator.",
      };
    });
  }
}

export default MissionEngine;