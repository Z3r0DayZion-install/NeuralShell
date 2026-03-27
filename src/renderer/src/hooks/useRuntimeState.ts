import React from "react";
import { appendRuntimeEvent } from "../runtime/runtimeEventBus.ts";

export type RuntimeStatePayload = {
  providerHealth: {
    activeProvider: string;
    model: string;
    latencyMs: number | null;
    online: boolean;
    lastSweepResult: string;
    lastSweepAt: string;
  };
  vaultState: {
    locked: boolean;
    activeProfile: string;
    exportImportStatus: string;
    policyBound: boolean;
  };
  proofEngine: {
    lastProofStatus: string;
    currentStage: string;
    lastBundleHash: string;
    parityState: string;
  };
  relayState: {
    enabled: boolean;
    mappedChannel: string;
    lastRelaySend: string;
    relayError: string;
  };
  collabVoiceState: {
    peersActive: number;
    currentRoom: string;
    voiceRttMs: number | null;
    sessionHealth: string;
  };
  policyState: {
    activePolicyProfile: string;
    updateRing: string;
    offlineOnly: boolean;
    approvedProviders: string[];
  };
  updateLane: {
    currentVersion: string;
    lastUpdateCheck: string;
    signatureState: string;
    stagedUpdateAvailable: boolean;
  };
  sealIdentity: {
    sealIdentity: string;
    machineTrust: string;
    whiteLabelProfile: string;
  };
  watchdog: {
    status: string;
    pid: number | null;
    wsRunning: boolean;
  };
  releaseHealth: {
    status: string;
  };
  refreshedAt: string;
};

function safeReadLocalStorage(key: string, fallback = "") {
  if (typeof window === "undefined" || !window.localStorage) return fallback;
  const raw = window.localStorage.getItem(key);
  return raw == null ? fallback : String(raw || fallback);
}

function toNumber(value: any, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function readBrandingProfileId() {
  if (typeof window === "undefined" || !window.localStorage) return "default";
  try {
    const raw = JSON.parse(window.localStorage.getItem("neuralshell_branding_profile_active_v1") || "{}");
    return String(raw && raw.profileId ? raw.profileId : "default");
  } catch {
    return "default";
  }
}

function readVoiceRtt() {
  const raw = safeReadLocalStorage("neuralshell_voice_rtt_median_v1", "");
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.round(n) : null;
}

function initialState(): RuntimeStatePayload {
  return {
    providerHealth: {
      activeProvider: "ollama",
      model: "llama3",
      latencyMs: null,
      online: false,
      lastSweepResult: "unknown",
      lastSweepAt: "",
    },
    vaultState: {
      locked: false,
      activeProfile: "default",
      exportImportStatus: "idle",
      policyBound: false,
    },
    proofEngine: {
      lastProofStatus: "idle",
      currentStage: "idle",
      lastBundleHash: "",
      parityState: "unknown",
    },
    relayState: {
      enabled: false,
      mappedChannel: "local-only",
      lastRelaySend: "",
      relayError: "",
    },
    collabVoiceState: {
      peersActive: 0,
      currentRoom: "default",
      voiceRttMs: null,
      sessionHealth: "offline",
    },
    policyState: {
      activePolicyProfile: "none",
      updateRing: "stable",
      offlineOnly: false,
      approvedProviders: [],
    },
    updateLane: {
      currentVersion: "2.1.29",
      lastUpdateCheck: "",
      signatureState: "unknown",
      stagedUpdateAvailable: false,
    },
    sealIdentity: {
      sealIdentity: "unknown",
      machineTrust: "unknown",
      whiteLabelProfile: "default",
    },
    watchdog: {
      status: "unknown",
      pid: null,
      wsRunning: false,
    },
    releaseHealth: {
      status: "unknown",
    },
    refreshedAt: new Date().toISOString(),
  };
}

export function useRuntimeState({
  connectionInfo,
  workflowId,
  runtimeTier,
  sessionHydrationStatus,
  collabConnected,
  collabRoomId,
  collabPeerCount,
}: {
  connectionInfo: Record<string, any>;
  workflowId: string;
  runtimeTier: string;
  sessionHydrationStatus: string;
  collabConnected: boolean;
  collabRoomId: string;
  collabPeerCount: number;
}) {
  const [runtimeState, setRuntimeState] = React.useState<RuntimeStatePayload>(() => initialState());
  const prevRef = React.useRef<RuntimeStatePayload | null>(null);

  const refresh = React.useCallback(async () => {
    const [settings, daemon, updatePolicy, updatePending, releaseHealth, collabStatus, identityInfo, modelPool] = await Promise.all([
      window.api?.settings?.get ? window.api.settings.get().catch(() => ({})) : Promise.resolve({}),
      window.api?.daemon?.status ? window.api.daemon.status().catch(() => ({})) : Promise.resolve({}),
      window.api?.autoUpdate?.getPolicy ? window.api.autoUpdate.getPolicy().catch(() => ({})) : Promise.resolve({}),
      window.api?.autoUpdate?.pending ? window.api.autoUpdate.pending().catch(() => ({})) : Promise.resolve({}),
      window.api?.releaseHealth?.check ? window.api.releaseHealth.check().catch(() => ({})) : Promise.resolve({}),
      window.api?.collab?.getStatus ? window.api.collab.getStatus().catch(() => ({})) : Promise.resolve({}),
      window.api?.identity?.pubkey ? window.api.identity.pubkey().catch(() => ({})) : Promise.resolve({}),
      window.api?.modelPool?.status ? window.api.modelPool.status().catch(() => ({})) : Promise.resolve({}),
    ]);

    const provider = String(connectionInfo && connectionInfo.provider ? connectionInfo.provider : "ollama");
    const model = String(connectionInfo && connectionInfo.model ? connectionInfo.model : "llama3");
    const bridgeHealth = String(connectionInfo && connectionInfo.health ? connectionInfo.health : "unknown");
    const online = bridgeHealth === "online";
    const lastSweepResult = safeReadLocalStorage("neuralshell_provider_sweep_last_v1", online ? "passed" : "unknown");
    const lastSweepAt = safeReadLocalStorage("neuralshell_provider_sweep_at_v1", "");
    const latencyMs = Number.isFinite(Number(modelPool && modelPool.idleMs)) ? Math.round(Number(modelPool.idleMs)) : null;

    const policy = settings && settings.enterprisePolicyEnforced && typeof settings.enterprisePolicyEnforced === "object"
      ? settings.enterprisePolicyEnforced
      : {};
    const approvedProviders = Array.isArray(policy.allowedProviders)
      ? policy.allowedProviders.map((entry: any) => String(entry || "").trim().toLowerCase()).filter(Boolean)
      : [];
    const policyProfile = String(policy.label || policy.policyId || "none");
    const updateRing = String(settings && settings.autoUpdateChannel ? settings.autoUpdateChannel : updatePolicy && updatePolicy.channel ? updatePolicy.channel : "stable");

    const next: RuntimeStatePayload = {
      providerHealth: {
        activeProvider: provider,
        model,
        latencyMs,
        online,
        lastSweepResult,
        lastSweepAt,
      },
      vaultState: {
        locked: String(sessionHydrationStatus || "") === "locked",
        activeProfile: String(workflowId || "default"),
        exportImportStatus: safeReadLocalStorage("neuralshell_vault_last_action_v1", "idle"),
        policyBound: Boolean(policy && Object.keys(policy).length > 0),
      },
      proofEngine: {
        lastProofStatus: safeReadLocalStorage("neuralshell_proof_last_status_v1", "idle"),
        currentStage: safeReadLocalStorage("neuralshell_proof_stage_v1", "idle"),
        lastBundleHash: safeReadLocalStorage("neuralshell_proof_last_bundle_hash_v1", ""),
        parityState: String(releaseHealth && releaseHealth.status ? releaseHealth.status : "unknown"),
      },
      relayState: {
        enabled: Boolean(settings && settings.proofRelayEnabled),
        mappedChannel: String(collabRoomId || "default"),
        lastRelaySend: safeReadLocalStorage("neuralshell_relay_last_send_v1", ""),
        relayError: safeReadLocalStorage("neuralshell_relay_last_error_v1", ""),
      },
      collabVoiceState: {
        peersActive: Math.max(0, Number(collabPeerCount || 0)),
        currentRoom: String(collabRoomId || (collabStatus && collabStatus.roomId ? collabStatus.roomId : "default")),
        voiceRttMs: readVoiceRtt(),
        sessionHealth: collabConnected ? "healthy" : "degraded",
      },
      policyState: {
        activePolicyProfile: policyProfile,
        updateRing,
        offlineOnly: Boolean(settings && settings.offlineOnlyEnforced),
        approvedProviders,
      },
      updateLane: {
        currentVersion: String(settings && settings.appVersion ? settings.appVersion : "2.1.29"),
        lastUpdateCheck: String(updatePending && updatePending.checkedAt ? updatePending.checkedAt : ""),
        signatureState: String(updatePending && updatePending.verified ? "verified" : "unverified"),
        stagedUpdateAvailable: Boolean(updatePending && updatePending.available),
      },
      sealIdentity: {
        sealIdentity: String(identityInfo && identityInfo.fingerprint ? identityInfo.fingerprint : "unknown"),
        machineTrust: String(runtimeTier || "unknown").toLowerCase(),
        whiteLabelProfile: readBrandingProfileId(),
      },
      watchdog: {
        status: String(daemon && daemon.status ? daemon.status : "unknown"),
        pid: Number.isFinite(Number(daemon && daemon.pid)) ? Number(daemon.pid) : null,
        wsRunning: Boolean(daemon && daemon.wsBridge && daemon.wsBridge.running),
      },
      releaseHealth: {
        status: String(releaseHealth && releaseHealth.status ? releaseHealth.status : "unknown"),
      },
      refreshedAt: new Date().toISOString(),
    };

    const prev = prevRef.current;
    if (prev && prev.providerHealth.online !== next.providerHealth.online) {
      appendRuntimeEvent(
        next.providerHealth.online ? "provider.sweep.passed" : "provider.sweep.failed",
        {
          provider: next.providerHealth.activeProvider,
          model: next.providerHealth.model,
        },
        { severity: next.providerHealth.online ? "info" : "degraded", source: "runtime" },
      );
    }
    if (prev && prev.watchdog.status !== next.watchdog.status) {
      appendRuntimeEvent(
        "runtime.watchdog.alert",
        { status: next.watchdog.status, pid: next.watchdog.pid },
        { severity: next.watchdog.status === "running" ? "info" : "warning", source: "watchdog" },
      );
    }
    if (prev && prev.policyState.activePolicyProfile !== next.policyState.activePolicyProfile) {
      appendRuntimeEvent(
        "policy.changed",
        { policyProfile: next.policyState.activePolicyProfile, updateRing: next.policyState.updateRing },
        { severity: "info", source: "policy" },
      );
    }
    if (prev && prev.vaultState.locked !== next.vaultState.locked) {
      appendRuntimeEvent(
        next.vaultState.locked ? "vault.locked" : "vault.unlocked",
        { activeProfile: next.vaultState.activeProfile },
        { severity: next.vaultState.locked ? "warning" : "info", source: "vault" },
      );
    }

    prevRef.current = next;
    setRuntimeState(next);
    return next;
  }, [
    collabConnected,
    collabPeerCount,
    collabRoomId,
    connectionInfo,
    runtimeTier,
    sessionHydrationStatus,
    workflowId,
  ]);

  React.useEffect(() => {
    refresh();
    const timer = window.setInterval(refresh, 6000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  return {
    runtimeState,
    refreshRuntimeState: refresh,
  };
}

export default useRuntimeState;

