export type TransferLedgerStatus = "quarantined" | "verified" | "released";

export type TransferHandoff = {
  handoffId: string;
  at: string;
  actor: string;
  action: string;
  detail: Record<string, any>;
};

export type TransferLedgerEntry = {
  entryId: string;
  packageId: string;
  courierClass: string;
  sender: string;
  receiver: string;
  status: TransferLedgerStatus;
  createdAt: string;
  updatedAt: string;
  handoffs: TransferHandoff[];
};

export function createTransferEntry(input: Partial<TransferLedgerEntry>): TransferLedgerEntry {
  const safe = input && typeof input === "object" ? input : {};
  const now = new Date().toISOString();
  return {
    entryId: String(safe.entryId || `ledger-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
    packageId: String(safe.packageId || ""),
    courierClass: String(safe.courierClass || "standard"),
    sender: String(safe.sender || "sender-unset"),
    receiver: String(safe.receiver || "receiver-unset"),
    status: (safe.status || "quarantined") as TransferLedgerStatus,
    createdAt: String(safe.createdAt || now),
    updatedAt: String(safe.updatedAt || now),
    handoffs: Array.isArray(safe.handoffs) ? safe.handoffs : [],
  };
}

export function appendHandoff(
  entry: TransferLedgerEntry,
  input: { actor: string; action: string; detail?: Record<string, any>; status?: TransferLedgerStatus },
) {
  const safe = entry && typeof entry === "object" ? entry : createTransferEntry({});
  const handoff: TransferHandoff = {
    handoffId: `handoff-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: new Date().toISOString(),
    actor: String(input && input.actor ? input.actor : "unknown-actor"),
    action: String(input && input.action ? input.action : "unspecified"),
    detail: input && input.detail && typeof input.detail === "object" ? input.detail : {},
  };
  return {
    ...safe,
    status: (input && input.status ? input.status : safe.status) as TransferLedgerStatus,
    updatedAt: handoff.at,
    handoffs: [...(Array.isArray(safe.handoffs) ? safe.handoffs : []), handoff].slice(-400),
  };
}

export default {
  createTransferEntry,
  appendHandoff,
};
