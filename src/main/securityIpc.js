"use strict";

function registerSecurityIpcHandlers({
  registerHandle,
  authManager,
  permissionManager,
  secretVault,
  syncClient,
  dialog
}) {
  registerHandle("permissions:list", async () => {
    authManager.requireAdmin();
    return permissionManager.list();
  });

  registerHandle("permissions:set", async (_evt, key, value) => {
    authManager.requireAdmin();
    return permissionManager.set(key, value, "renderer");
  });

  registerHandle("auth:setup-pin", async (_evt, pin, role) => authManager.bootstrapPin(pin, role));
  registerHandle("auth:set-pin", async (_evt, pin, role) => {
    authManager.requireAdmin();
    await authManager.setPin(pin, role);
    return { ok: true };
  });

  registerHandle("auth:recover-pin", async (_evt, pin, confirmation) => {
    const phrase = String(confirmation || "").trim().toUpperCase();
    if (phrase !== "RESET PIN") throw new Error("Type RESET PIN to confirm");
    const result = await dialog.showMessageBox({
      type: "warning",
      buttons: ["Cancel", "Recover PIN"],
      defaultId: 0,
      cancelId: 0,
      title: "Recover PIN",
      message: "Recover local admin PIN?",
      detail: "This signs out current sessions and rotates your local PIN. Type RESET PIN in the app to continue."
    });
    if (result.response !== 1) throw new Error("PIN recovery cancelled");
    return authManager.recoverPin(pin, "renderer-recovery");
  });

  registerHandle("vault:set-secret", async (_evt, secret) => {
    authManager.requireAdmin();
    return secretVault.set(secret);
  });
  registerHandle("vault:get-secret", async () => {
    authManager.requireAdmin();
    return secretVault.get();
  });
  registerHandle("vault:clear-secret", async () => {
    authManager.requireAdmin();
    return secretVault.clear();
  });

  registerHandle("sync:push", async (_evt, endpoint, token, payload) => {
    authManager.requireAdmin();
    return syncClient.push(endpoint, token, payload);
  });
  registerHandle("sync:pull", async (_evt, endpoint, token) => {
    authManager.requireAdmin();
    return syncClient.pull(endpoint, token);
  });
}

module.exports = { registerSecurityIpcHandlers };

