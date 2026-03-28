export type MissionTemplate = {
  missionId: string;
  label: string;
  description: string;
  target: "node" | "fleet";
  defaultScheduleMinutes: number;
  defaultDryRun: boolean;
  steps: string[];
};

export type MissionSchedule = {
  missionId: string;
  enabled: boolean;
  intervalMs: number;
  dryRun: boolean;
  targetNodeIds: string[];
};

export type MissionHistoryEntry = {
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

type MissionHooks = {
  onRun?: (entry: MissionHistoryEntry) => Promise<void> | void;
};

export class MissionEngine {
  private readonly hooks: MissionHooks;
  private schedules: MissionSchedule[];
  private history: MissionHistoryEntry[];
  private timers: Map<string, number>;

  constructor(schedules: MissionSchedule[] = [], hooks: MissionHooks = {}) {
    this.hooks = hooks;
    this.schedules = Array.isArray(schedules) ? schedules : [];
    this.history = [];
    this.timers = new Map();
  }

  setSchedules(nextSchedules: MissionSchedule[]) {
    this.schedules = Array.isArray(nextSchedules) ? nextSchedules : [];
    this.restart();
  }

  getSchedules() {
    return this.schedules.slice();
  }

  getHistory() {
    return this.history.slice(-500);
  }

  restart() {
    this.stop();
    this.start();
  }

  start() {
    this.stop();
    this.schedules.forEach((schedule) => {
      if (!schedule || !schedule.enabled) return;
      const intervalMs = Number(schedule.intervalMs || 0);
      if (!Number.isFinite(intervalMs) || intervalMs < 1000) return;
      const timer = window.setInterval(() => {
        this.runScheduledMission(schedule).catch(() => undefined);
      }, intervalMs);
      this.timers.set(String(schedule.missionId || ""), timer);
    });
  }

  stop() {
    Array.from(this.timers.values()).forEach((timer) => window.clearInterval(timer));
    this.timers.clear();
  }

  async runMission(template: MissionTemplate, options: { dryRun?: boolean; targetNodeIds?: string[] } = {}) {
    const startedAt = new Date().toISOString();
    const dryRun = Boolean(options.dryRun);
    const entry: MissionHistoryEntry = {
      runId: `mission-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      missionId: String(template && template.missionId ? template.missionId : "mission"),
      label: String(template && template.label ? template.label : "Mission"),
      target: template && template.target ? template.target : "fleet",
      targetNodeIds: Array.isArray(options.targetNodeIds) ? options.targetNodeIds : [],
      dryRun,
      status: "completed",
      startedAt,
      finishedAt: new Date().toISOString(),
      detail: dryRun ? "Dry-run complete. No side effects applied." : "Mission completed.",
    };
    this.history.push(entry);
    this.history = this.history.slice(-500);
    if (this.hooks.onRun) {
      await Promise.resolve(this.hooks.onRun(entry));
    }
    return entry;
  }

  cancelRun(runId: string) {
    this.history = this.history.map((entry) => {
      if (String(entry.runId || "") !== String(runId || "")) return entry;
      return {
        ...entry,
        status: "cancelled",
        finishedAt: new Date().toISOString(),
        detail: "Mission run cancelled.",
      };
    });
  }

  private async runScheduledMission(schedule: MissionSchedule) {
    const missionId = String(schedule && schedule.missionId ? schedule.missionId : "");
    if (!missionId) return;
    const template = {
      missionId,
      label: missionId,
      description: "scheduled mission",
      target: schedule && schedule.targetNodeIds && schedule.targetNodeIds.length ? "node" : "fleet",
      defaultScheduleMinutes: Math.max(1, Math.round((Number(schedule.intervalMs || 60000) / 60000))),
      defaultDryRun: Boolean(schedule.dryRun),
      steps: [],
    } as MissionTemplate;
    await this.runMission(template, {
      dryRun: Boolean(schedule.dryRun),
      targetNodeIds: schedule.targetNodeIds,
    });
  }
}

export default MissionEngine;