export type PolicyRolloutStatus = "pending" | "applied" | "failed" | "rolled_back";

export type PolicyRolloutRecord = {
  rolloutId: string;
  policyId: string;
  policyProfile: string;
  nodeIds: string[];
  mode: "immediate" | "scheduled";
  scheduledFor?: string;
  status: PolicyRolloutStatus;
  createdAt: string;
  updatedAt: string;
};

export function previewPolicyDiff(currentPolicyProfile: string, nextPolicyProfile: string) {
  const left = String(currentPolicyProfile || "none");
  const right = String(nextPolicyProfile || "none");
  if (left === right) return [];
  return [{
    key: "policyProfile",
    before: left,
    after: right,
    changed: true,
  }];
}

export function createRolloutRecord(input: {
  policyId: string;
  policyProfile: string;
  nodeIds: string[];
  mode?: "immediate" | "scheduled";
  scheduledFor?: string;
}): PolicyRolloutRecord {
  const now = new Date().toISOString();
  return {
    rolloutId: `rollout-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    policyId: String(input && input.policyId ? input.policyId : "policy"),
    policyProfile: String(input && input.policyProfile ? input.policyProfile : "policy"),
    nodeIds: Array.isArray(input && input.nodeIds) ? input.nodeIds : [],
    mode: input && input.mode ? input.mode : "immediate",
    scheduledFor: input && input.scheduledFor ? input.scheduledFor : undefined,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };
}

export function markRolloutStatus(record: PolicyRolloutRecord, status: PolicyRolloutStatus) {
  return {
    ...record,
    status,
    updatedAt: new Date().toISOString(),
  };
}

export default {
  previewPolicyDiff,
  createRolloutRecord,
  markRolloutStatus,
};