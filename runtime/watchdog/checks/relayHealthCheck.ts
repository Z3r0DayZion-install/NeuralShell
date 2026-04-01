export type RelayHealthInput = {
  enabled: boolean;
  relayError: string;
};

export function relayHealthCheck(input: RelayHealthInput) {
  const enabled = Boolean(input && input.enabled);
  const relayError = String(input && input.relayError ? input.relayError : "");
  if (!enabled) return null;
  if (!relayError) return null;
  return {
    source: "relay",
    severity: "warning",
    message: `Relay is enabled with error: ${relayError}`,
    suggestedAction: "Disable relay path and retry provider/transport checks.",
  };
}

export default relayHealthCheck;

