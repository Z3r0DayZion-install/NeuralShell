export type NodeChainEvent = {
  type: string;
  at: string;
  payload: Record<string, any>;
};

export type NodeChainAction = {
  type:
    | "show_alert"
    | "open_panel"
    | "share_proof_badge"
    | "snapshot_state"
    | "disable_relay"
    | "block_update_apply"
    | "prompt_vault_save"
    | "write_audit_log"
    | "switch_safe_policy"
    | "run_local_script";
  payload?: Record<string, any>;
};

export type NodeChainRule = {
  id: string;
  label: string;
  enabled: boolean;
  eventType: string;
  conditions?: {
    relayFailureThreshold?: number;
    fieldEquals?: Record<string, any>;
  };
  actions: NodeChainAction[];
  scheduleMs?: number;
};

export type NodeChainExecutionLog = {
  id: string;
  at: string;
  ruleId: string;
  eventType: string;
  dryRun: boolean;
  status: "executed" | "skipped" | "blocked" | "failed";
  detail: string;
  actions: Array<{ type: string; status: string; detail: string }>;
};

type NodeChainHandlers = {
  showAlert?: (payload: Record<string, any>) => Promise<void> | void;
  openPanel?: (payload: Record<string, any>) => Promise<void> | void;
  shareProofBadge?: (payload: Record<string, any>) => Promise<void> | void;
  snapshotState?: (payload: Record<string, any>) => Promise<void> | void;
  disableRelay?: (payload: Record<string, any>) => Promise<void> | void;
  blockUpdateApply?: (payload: Record<string, any>) => Promise<void> | void;
  promptVaultSave?: (payload: Record<string, any>) => Promise<void> | void;
  writeAuditLog?: (payload: Record<string, any>) => Promise<void> | void;
  switchSafePolicy?: (payload: Record<string, any>) => Promise<void> | void;
  runLocalScript?: (payload: Record<string, any>) => Promise<void> | void;
};

export class NodeChainEngine {
  private rules: NodeChainRule[];
  private readonly handlers: NodeChainHandlers;
  private readonly logs: NodeChainExecutionLog[];
  private readonly timers: Array<number>;
  private relayFailedCount: number;
  private readonly commandAllowlist: Set<string>;

  constructor(rules: NodeChainRule[], handlers: NodeChainHandlers = {}, commandAllowlist: string[] = []) {
    this.rules = Array.isArray(rules) ? rules : [];
    this.handlers = handlers;
    this.logs = [];
    this.timers = [];
    this.relayFailedCount = 0;
    this.commandAllowlist = new Set((Array.isArray(commandAllowlist) ? commandAllowlist : []).map((entry) => String(entry || "")));
  }

  setRules(nextRules: NodeChainRule[]) {
    this.rules = Array.isArray(nextRules) ? nextRules : [];
    this.stop();
    this.start();
  }

  getRules() {
    return this.rules.slice();
  }

  getLogs() {
    return this.logs.slice(-250);
  }

  start() {
    this.stop();
    this.rules.forEach((rule) => {
      if (!rule.enabled || !Number.isFinite(Number(rule.scheduleMs)) || Number(rule.scheduleMs) <= 0) return;
      const timer = window.setInterval(() => {
        this.dispatch({
          type: "nodechain.schedule.tick",
          at: new Date().toISOString(),
          payload: { scheduledRuleId: rule.id },
        }, true).catch(() => undefined);
      }, Number(rule.scheduleMs));
      this.timers.push(timer);
    });
  }

  stop() {
    this.timers.splice(0).forEach((timer) => window.clearInterval(timer));
  }

  async dispatch(event: NodeChainEvent, dryRun = false) {
    const safeEvent: NodeChainEvent = {
      type: String(event && event.type ? event.type : ""),
      at: String(event && event.at ? event.at : new Date().toISOString()),
      payload: event && event.payload && typeof event.payload === "object" ? event.payload : {},
    };
    if (!safeEvent.type) return [];
    if (safeEvent.type === "relay.failed") {
      this.relayFailedCount += 1;
    }
    if (safeEvent.type === "relay.sent") {
      this.relayFailedCount = 0;
    }

    const matching = this.rules.filter((rule) => Boolean(rule.enabled) && String(rule.eventType || "") === safeEvent.type);
    const results: NodeChainExecutionLog[] = [];
    for (const rule of matching) {
      const log = await this.executeRule(rule, safeEvent, dryRun);
      this.logs.push(log);
      results.push(log);
    }
    return results;
  }

  private async executeRule(rule: NodeChainRule, event: NodeChainEvent, dryRun: boolean) {
    const base: NodeChainExecutionLog = {
      id: `nodechain-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      at: new Date().toISOString(),
      ruleId: String(rule.id || "unknown-rule"),
      eventType: String(event.type || "unknown-event"),
      dryRun: Boolean(dryRun),
      status: "executed",
      detail: "",
      actions: [],
    };
    if (!this.conditionsPass(rule, event)) {
      return {
        ...base,
        status: "skipped",
        detail: "Conditions not met.",
      };
    }

    for (const action of Array.isArray(rule.actions) ? rule.actions : []) {
      const actionType = String(action && action.type ? action.type : "");
      if (!actionType) continue;
      if (dryRun) {
        base.actions.push({ type: actionType, status: "dry-run", detail: "Action simulated." });
        continue;
      }
      try {
        const detail = await this.runAction(actionType, action && action.payload ? action.payload : {});
        base.actions.push({ type: actionType, status: "ok", detail });
      } catch (err: any) {
        base.actions.push({
          type: actionType,
          status: "failed",
          detail: err && err.message ? err.message : String(err),
        });
        base.status = "failed";
        base.detail = `Action ${actionType} failed.`;
      }
    }

    if (!base.detail) {
      base.detail = base.actions.length
        ? `${base.actions.length} action(s) evaluated.`
        : "No actions configured.";
    }
    return base;
  }

  private conditionsPass(rule: NodeChainRule, event: NodeChainEvent) {
    const conditions = rule && rule.conditions && typeof rule.conditions === "object" ? rule.conditions : {};
    const threshold = Number(conditions.relayFailureThreshold || 0);
    if (threshold > 0 && this.relayFailedCount < threshold) {
      return false;
    }
    const fieldEquals = conditions.fieldEquals && typeof conditions.fieldEquals === "object"
      ? conditions.fieldEquals
      : {};
    const payload = event && event.payload && typeof event.payload === "object" ? event.payload : {};
    const mismatch = Object.entries(fieldEquals).find(([key, value]) => {
      return String(payload[key]) !== String(value);
    });
    return !mismatch;
  }

  private async runAction(type: string, payload: Record<string, any>) {
    if (type === "show_alert") {
      await Promise.resolve(this.handlers.showAlert && this.handlers.showAlert(payload));
      return "Alert emitted.";
    }
    if (type === "open_panel") {
      await Promise.resolve(this.handlers.openPanel && this.handlers.openPanel(payload));
      return "Panel opened.";
    }
    if (type === "share_proof_badge") {
      await Promise.resolve(this.handlers.shareProofBadge && this.handlers.shareProofBadge(payload));
      return "Proof badge flow triggered.";
    }
    if (type === "snapshot_state") {
      await Promise.resolve(this.handlers.snapshotState && this.handlers.snapshotState(payload));
      return "State snapshot captured.";
    }
    if (type === "disable_relay") {
      await Promise.resolve(this.handlers.disableRelay && this.handlers.disableRelay(payload));
      return "Relay disabled.";
    }
    if (type === "block_update_apply") {
      await Promise.resolve(this.handlers.blockUpdateApply && this.handlers.blockUpdateApply(payload));
      return "Update apply blocked.";
    }
    if (type === "prompt_vault_save") {
      await Promise.resolve(this.handlers.promptVaultSave && this.handlers.promptVaultSave(payload));
      return "Vault save prompt emitted.";
    }
    if (type === "write_audit_log") {
      await Promise.resolve(this.handlers.writeAuditLog && this.handlers.writeAuditLog(payload));
      return "Audit entry recorded.";
    }
    if (type === "switch_safe_policy") {
      await Promise.resolve(this.handlers.switchSafePolicy && this.handlers.switchSafePolicy(payload));
      return "Safe policy profile applied.";
    }
    if (type === "run_local_script") {
      const commandId = String(payload && payload.commandId ? payload.commandId : "").trim();
      if (!commandId || !this.commandAllowlist.has(commandId)) {
        throw new Error(`Command '${commandId || "<empty>"}' is not in NodeChain allowlist.`);
      }
      await Promise.resolve(this.handlers.runLocalScript && this.handlers.runLocalScript(payload));
      return `Allowlisted command '${commandId}' executed.`;
    }
    throw new Error(`Unsupported NodeChain action type: ${type}`);
  }
}

export default NodeChainEngine;

