export type ProviderBridgeInput = {
  online: boolean;
  provider: string;
  model: string;
};

export function providerBridgeCheck(input: ProviderBridgeInput) {
  if (input && input.online) {
    return null;
  }
  return {
    source: "provider-bridge",
    severity: "degraded",
    message: `Provider bridge is offline (${String(input && input.provider ? input.provider : "unknown")}/${String(input && input.model ? input.model : "unknown")}).`,
    suggestedAction: "Run provider sweep and switch to safe local profile.",
  };
}

export default providerBridgeCheck;

