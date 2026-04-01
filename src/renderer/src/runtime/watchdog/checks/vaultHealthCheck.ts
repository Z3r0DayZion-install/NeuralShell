export type VaultHealthInput = {
  locked: boolean;
  exportImportStatus: string;
};

export function vaultHealthCheck(input: VaultHealthInput) {
  const locked = Boolean(input && input.locked);
  const state = String(input && input.exportImportStatus ? input.exportImportStatus : "idle").toLowerCase();
  if (!locked && !state.includes("error")) return null;
  return {
    source: "vault",
    severity: locked ? "warning" : "degraded",
    message: locked
      ? "Vault is currently locked."
      : `Vault action state indicates issue: ${state}`,
    suggestedAction: "Unlock vault and verify read/write with a local secret round-trip.",
  };
}

export default vaultHealthCheck;

