export type UpdateVerificationInput = {
  signatureState: string;
  stagedUpdateAvailable: boolean;
};

export function updateVerificationCheck(input: UpdateVerificationInput) {
  const signatureState = String(input && input.signatureState ? input.signatureState : "unknown").toLowerCase();
  const staged = Boolean(input && input.stagedUpdateAvailable);
  if (signatureState === "verified") return null;
  if (!staged && signatureState === "unknown") return null;
  return {
    source: "update-lane",
    severity: "critical",
    message: `Update verification is ${signatureState}.`,
    suggestedAction: "Freeze update apply lane until signature/hash verification passes.",
  };
}

export default updateVerificationCheck;

