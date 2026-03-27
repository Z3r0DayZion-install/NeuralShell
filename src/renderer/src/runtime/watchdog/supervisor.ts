import { providerBridgeCheck } from "./checks/providerBridgeCheck";
import { relayHealthCheck } from "./checks/relayHealthCheck";
import { updateVerificationCheck } from "./checks/updateVerificationCheck";
import { vaultHealthCheck } from "./checks/vaultHealthCheck";

export type WatchdogSeverity = "info" | "warning" | "degraded" | "critical";

export type WatchdogAlert = {
  id: string;
  source: string;
  severity: WatchdogSeverity;
  message: string;
  suggestedAction: string;
  at: string;
  sticky: boolean;
  acknowledged: boolean;
  recoveredAt?: string;
};

type WatchdogHooks = {
  retryProviderProbe?: () => Promise<void> | void;
  disableRelayPath?: () => Promise<void> | void;
  freezeUpdateLane?: () => Promise<void> | void;
  switchSafePolicy?: () => Promise<void> | void;
  onAlert?: (alert: WatchdogAlert) => void;
};

function buildAlertId(source: string, message: string) {
  return `${source}:${message}`.toLowerCase();
}

export class RuntimeWatchdogSupervisor {
  private readonly hooks: WatchdogHooks;
  private readonly alerts: Map<string, WatchdogAlert>;

  constructor(hooks: WatchdogHooks = {}) {
    this.hooks = hooks;
    this.alerts = new Map();
  }

  getAlerts() {
    return Array.from(this.alerts.values()).sort((a, b) => String(b.at).localeCompare(String(a.at)));
  }

  acknowledgeAlert(alertId: string) {
    const existing = this.alerts.get(String(alertId || ""));
    if (!existing) return false;
    this.alerts.set(existing.id, {
      ...existing,
      acknowledged: true,
    });
    return true;
  }

  async evaluate(snapshot: {
    providerHealth: { online: boolean; activeProvider: string; model: string };
    relayState: { enabled: boolean; relayError: string };
    updateLane: { signatureState: string; stagedUpdateAvailable: boolean };
    vaultState: { locked: boolean; exportImportStatus: string };
  }) {
    const findings = [
      providerBridgeCheck({
        online: Boolean(snapshot && snapshot.providerHealth && snapshot.providerHealth.online),
        provider: String(snapshot && snapshot.providerHealth ? snapshot.providerHealth.activeProvider : ""),
        model: String(snapshot && snapshot.providerHealth ? snapshot.providerHealth.model : ""),
      }),
      relayHealthCheck({
        enabled: Boolean(snapshot && snapshot.relayState && snapshot.relayState.enabled),
        relayError: String(snapshot && snapshot.relayState ? snapshot.relayState.relayError : ""),
      }),
      updateVerificationCheck({
        signatureState: String(snapshot && snapshot.updateLane ? snapshot.updateLane.signatureState : ""),
        stagedUpdateAvailable: Boolean(snapshot && snapshot.updateLane && snapshot.updateLane.stagedUpdateAvailable),
      }),
      vaultHealthCheck({
        locked: Boolean(snapshot && snapshot.vaultState && snapshot.vaultState.locked),
        exportImportStatus: String(snapshot && snapshot.vaultState ? snapshot.vaultState.exportImportStatus : ""),
      }),
    ].filter(Boolean) as Array<{
      source: string;
      severity: WatchdogSeverity;
      message: string;
      suggestedAction: string;
    }>;

    const activeIds = new Set<string>();
    for (const finding of findings) {
      const id = buildAlertId(finding.source, finding.message);
      activeIds.add(id);
      const existing = this.alerts.get(id);
      if (!existing) {
        const created: WatchdogAlert = {
          id,
          source: finding.source,
          severity: finding.severity,
          message: finding.message,
          suggestedAction: finding.suggestedAction,
          at: new Date().toISOString(),
          sticky: finding.severity === "degraded" || finding.severity === "critical",
          acknowledged: false,
        };
        this.alerts.set(id, created);
        if (this.hooks.onAlert) this.hooks.onAlert(created);
      }
      await this.tryRecover(finding);
    }

    // Auto-resolve non-sticky alerts that no longer appear.
    Array.from(this.alerts.values()).forEach((alert) => {
      if (!activeIds.has(alert.id) && !alert.sticky) {
        this.alerts.delete(alert.id);
        return;
      }
      if (!activeIds.has(alert.id) && alert.sticky && !alert.recoveredAt) {
        this.alerts.set(alert.id, {
          ...alert,
          recoveredAt: new Date().toISOString(),
        });
      }
    });
    return this.getAlerts();
  }

  private async tryRecover(finding: { source: string; severity: WatchdogSeverity }) {
    try {
      if (finding.source === "provider-bridge" && this.hooks.retryProviderProbe) {
        await Promise.resolve(this.hooks.retryProviderProbe());
        return;
      }
      if (finding.source === "relay" && this.hooks.disableRelayPath) {
        await Promise.resolve(this.hooks.disableRelayPath());
        return;
      }
      if (finding.source === "update-lane" && this.hooks.freezeUpdateLane) {
        await Promise.resolve(this.hooks.freezeUpdateLane());
        if (this.hooks.switchSafePolicy) {
          await Promise.resolve(this.hooks.switchSafePolicy());
        }
      }
    } catch {
      // Recovery failure remains visible through sticky alert state.
    }
  }
}

export default RuntimeWatchdogSupervisor;

